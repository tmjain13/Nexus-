import { db } from './firebase';
import {
  doc, setDoc, getDoc, updateDoc, onSnapshot,
  collection, addDoc, deleteDoc, getDocs, serverTimestamp
} from 'firebase/firestore';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export type CallType = 'audio' | 'video';

export interface CallSession {
  pc: RTCPeerConnection;
  localStream: MediaStream;
  remoteStream: MediaStream;
  callId: string;
  hangup: () => Promise<void>;
}

/**
 * CALLER SIDE: Start a new call to `calleeId`
 */
export async function startCall(
  callerId: string,
  callerName: string,
  calleeId: string,
  type: CallType,
  onRemoteStream: (stream: MediaStream) => void,
  onStateChange: (state: RTCPeerConnectionState) => void
): Promise<CallSession> {
  const pc = new RTCPeerConnection(ICE_SERVERS);
  const remoteStream = new MediaStream();
  let startTime: number | null = null;

  // 1. Get local media
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: type === 'video',
  });
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // 2. Handle remote tracks
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    onRemoteStream(remoteStream);
  };

  pc.onconnectionstatechange = () => {
    onStateChange(pc.connectionState);
    if (pc.connectionState === 'connected') {
      startTime = Date.now();
    }
  };

  // 3. Create call document
  const callRef = doc(collection(db, 'calls'));
  const callId = callRef.id;

  await setDoc(callRef, {
    callerId,
    callerName,
    calleeId,
    receiverId: calleeId,
    participants: [callerId, calleeId],
    type,
    status: 'ringing',
    createdAt: serverTimestamp(),
  });

  // 4. Collect caller ICE candidates → write to subcollection
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(collection(db, 'calls', callId, 'callerCandidates'), event.candidate.toJSON());
    }
  };

  // 5. Create offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await updateDoc(callRef, { offer: { type: offer.type, sdp: offer.sdp } });

  // 6. Listen for answer
  const unsubAnswer = onSnapshot(callRef, async (snap) => {
    const data = snap.data();
    if (data?.answer && pc.signalingState !== 'stable') {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
    if (data?.status === 'ended' || data?.status === 'declined' || data?.status === 'completed' || data?.status === 'missed') {
      hangup();
    }
  });

  // 7. Listen for callee ICE candidates
  const unsubCandidates = onSnapshot(
    collection(db, 'calls', callId, 'calleeCandidates'),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    }
  );

  const hangup = async () => {
    unsubAnswer();
    unsubCandidates();
    localStream.getTracks().forEach(t => t.stop());
    try {
      pc.close();
    } catch (e) {}

    const connectedAtLeastOnce = startTime !== null;
    const duration = connectedAtLeastOnce ? Math.floor((Date.now() - startTime!) / 1000) : 0;

    const currentDoc = await getDoc(callRef);
    const resolvedStatus = currentDoc.data()?.status;
    
    // Only update once to final state
    if (resolvedStatus === 'ringing' || resolvedStatus === 'in-progress' || resolvedStatus === 'connected') {
      await updateDoc(callRef, {
        status: connectedAtLeastOnce ? 'completed' : 'missed',
        duration,
        endedAt: serverTimestamp()
      });
    }
    await cleanupCallDoc(callId);
  };

  return { pc, localStream, remoteStream, callId, hangup };
}

/**
 * CALLEE SIDE: Answer an existing call
 */
export async function answerCall(
  callId: string,
  type: CallType,
  onRemoteStream: (stream: MediaStream) => void,
  onStateChange: (state: RTCPeerConnectionState) => void
): Promise<CallSession> {
  const pc = new RTCPeerConnection(ICE_SERVERS);
  const remoteStream = new MediaStream();
  const callRef = doc(db, 'calls', callId);
  let startTime: number | null = null;

  const callSnap = await getDoc(callRef);
  const callData = callSnap.data();
  if (!callData?.offer) throw new Error('Call offer not found');

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: type === 'video',
  });
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
    onRemoteStream(remoteStream);
  };

  pc.onconnectionstatechange = () => {
    onStateChange(pc.connectionState);
    if (pc.connectionState === 'connected') {
      startTime = Date.now();
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      addDoc(collection(db, 'calls', callId, 'calleeCandidates'), event.candidate.toJSON());
    }
  };

  await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await updateDoc(callRef, {
    answer: { type: answer.type, sdp: answer.sdp },
    status: 'in-progress', // Display as "in-progress" call in log UI
  });

  // Listen for caller ICE candidates
  const unsubCandidates = onSnapshot(
    collection(db, 'calls', callId, 'callerCandidates'),
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    }
  );

  const unsubCallDoc = onSnapshot(callRef, (snap) => {
    const resolvedStatus = snap.data()?.status;
    if (resolvedStatus === 'ended' || resolvedStatus === 'completed' || resolvedStatus === 'missed' || resolvedStatus === 'declined') {
      hangup();
    }
  });

  const hangup = async () => {
    unsubCandidates();
    unsubCallDoc();
    localStream.getTracks().forEach(t => t.stop());
    try {
      pc.close();
    } catch (e) {}

    const connectedAtLeastOnce = startTime !== null;
    const duration = connectedAtLeastOnce ? Math.floor((Date.now() - startTime!) / 1000) : 0;

    const currentDoc = await getDoc(callRef);
    const resolvedStatus = currentDoc.data()?.status;

    if (resolvedStatus === 'ringing' || resolvedStatus === 'in-progress' || resolvedStatus === 'connected') {
      await updateDoc(callRef, {
        status: connectedAtLeastOnce ? 'completed' : 'missed',
        duration,
        endedAt: serverTimestamp()
      });
    }
    await cleanupCallDoc(callId);
  };

  return { pc, localStream, remoteStream, callId, hangup };
}

/**
 * Reject an incoming call without answering
 */
export async function declineCall(callId: string) {
  await updateDoc(doc(db, 'calls', callId), { status: 'declined', endedAt: serverTimestamp() });
}

/**
 * Delete signaling subcollections after the call ends (housekeeping)
 */
async function cleanupCallDoc(callId: string) {
  const collections = ['callerCandidates', 'calleeCandidates'];
  for (const c of collections) {
    try {
      const snap = await getDocs(collection(db, 'calls', callId, c));
      for (const d of snap.docs) await deleteDoc(d.ref);
    } catch (e) {}
  }
}
