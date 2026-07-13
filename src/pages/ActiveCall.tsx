import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { startCall, answerCall, CallSession } from '../lib/webrtc';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, Shield, Radio, Sparkles, Monitor, MonitorOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

// Animated audio bars for live connected voice sessions
function AudioVoiceWave() {
  return (
    <div className="flex items-center justify-center gap-1.5 h-16 my-8">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((h, i) => (
        <motion.div
          key={i}
          className="w-1 bg-[#00a884] rounded-full shadow-[0_0_12px_rgba(0,168,132,0.6)]"
          animate={{
            height: [h * 4, h * 8, h * 4],
          }}
          transition={{
            duration: 0.8 + (i % 4) * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ height: `${h * 4}px` }}
        />
      ))}
    </div>
  );
}

export default function ActiveCall() {
  const { callId } = useParams<{ callId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const type = (searchParams.get('type') || 'audio') as 'audio' | 'video';
  const role = searchParams.get('role'); // 'callee' if answering
  const calleeId = searchParams.get('to'); // present when caller initiates

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const sessionRef = useRef<CallSession | null>(null);
  const callStartedRef = useRef(false);

  const [status, setStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended' | 'declined'>('connecting');
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [peerName, setPeerName] = useState('');
  const [peerAvatar, setPeerAvatar] = useState('');

  useEffect(() => {
    let timer: any;
    if (status === 'connected') {
      timer = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!user) return;
    if (callStartedRef.current) return;
    callStartedRef.current = true;

    let session: CallSession;
    let unsubCallDoc: (() => void) | null = null;

    const onRemoteStream = (stream: MediaStream) => {
      console.log('Received remote media stream tracks:', stream.getTracks().length);
      if (type === 'video') {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      } else {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
        }
      }
    };

    const onStateChange = (state: RTCPeerConnectionState) => {
      console.log('WebRTC connection state change:', state);
      if (state === 'connected') {
        setStatus('connected');
      }
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setStatus('ended');
        setTimeout(() => navigate(-1), 1200);
      }
    };

    const subscribeToCallState = (actualId: string) => {
      const callRef = doc(db, 'calls', actualId);
      unsubCallDoc = onSnapshot(callRef, (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        if (data.status === 'declined') {
          setStatus('declined');
          setTimeout(() => navigate(-1), 1500);
        } else if (data.status === 'ended' || data.status === 'completed' || data.status === 'missed') {
          setStatus('ended');
          setTimeout(() => navigate(-1), 1200);
        } else if (data.status === 'in-progress' || data.status === 'connected') {
          setStatus('connected');
        }
      }, (err) => {
        console.warn("Call status update subscription err:", err);
      });
    };

    const setupCall = async () => {
      try {
        if (role === 'callee' && callId) {
          // Fetch caller user info for display
          const callDocSnap = await getDoc(doc(db, 'calls', callId));
          if (callDocSnap.exists()) {
            const callerData = callDocSnap.data();
            setPeerName(callerData.callerName || 'Unknown');
            
            // Try fetching full profile to pull real avatar
            try {
              const userDocRef = doc(db, 'users', callerData.callerId);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                setPeerAvatar(userDocSnap.data().photoURL || '');
              }
            } catch (e) {
              console.warn("Could not load caller user profile for avatar:", e);
            }
          }
          
          session = await answerCall(callId, type, onRemoteStream, onStateChange);
          setStatus('connected');
          subscribeToCallState(callId);
        } else if (calleeId) {
          setStatus('ringing');
          // Fetch receiving user info to display
          try {
            const peerDoc = await getDoc(doc(db, 'users', calleeId));
            if (peerDoc.exists()) {
              setPeerName(peerDoc.data()?.displayName || 'Unknown Contact');
              setPeerAvatar(peerDoc.data()?.photoURL || '');
            } else {
              setPeerName('Contact');
            }
          } catch (e) {
            setPeerName('Contact');
          }

          session = await startCall(
            user.uid,
            user.displayName || 'Security Node',
            calleeId,
            type,
            onRemoteStream,
            onStateChange
          );

          subscribeToCallState(session.callId);

          // Update URL in-place so refreshing works normally without triggering duplicate calls
          navigate(`/call/${session.callId}?type=${type}&to=${calleeId}`, { replace: true });
        }

        sessionRef.current = session;

        if (type === 'video' && localVideoRef.current && session?.localStream) {
          localVideoRef.current.srcObject = session.localStream;
        }
      } catch (err) {
        console.error('Call setup failed:', err);
        setStatus('ended');
        setTimeout(() => navigate(-1), 1500);
      }
    };

    setupCall();

    return () => {
      if (unsubCallDoc) unsubCallDoc();
      if (sessionRef.current) {
        sessionRef.current.hangup().catch(e => console.warn("Async hangup error in cleanup:", e));
      }
    };
  }, [user, callId, role, calleeId, type, navigate]);

  const toggleMute = () => {
    const session = sessionRef.current;
    if (!session?.localStream) return;
    const nextMute = !muted;
    session.localStream.getAudioTracks().forEach(t => {
      t.enabled = !nextMute;
    });
    setMuted(nextMute);
  };

  const toggleVideo = () => {
    const session = sessionRef.current;
    if (!session?.localStream) return;
    const nextVideoOff = !videoOff;
    session.localStream.getVideoTracks().forEach(t => {
      t.enabled = !nextVideoOff;
    });
    setVideoOff(nextVideoOff);
  };

  const toggleScreenShare = async () => {
    const session = sessionRef.current;
    if (!session?.pc || !session?.localStream) return;
    
    if (isScreenSharing) {
      // Revert back to camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = stream.getVideoTracks()[0];
        
        const sender = session.pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(newVideoTrack);
        }
        
        // Update local stream
        session.localStream.getVideoTracks().forEach(t => {
          session.localStream.removeTrack(t);
          t.stop();
        });
        session.localStream.addTrack(newVideoTrack);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = session.localStream;
        }
        
        setIsScreenSharing(false);
      } catch (err) {
        console.error("Failed to revert to camera:", err);
      }
    } else {
      // Start screen sharing
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          // If user clicks "Stop sharing" on the browser native bar, revert to camera
          toggleScreenShare();
        };
        
        const sender = session.pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        
        // Update local stream for preview
        session.localStream.getVideoTracks().forEach(t => {
          session.localStream.removeTrack(t);
          t.stop(); // Stop camera track
        });
        session.localStream.addTrack(screenTrack);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = session.localStream;
        }
        
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Failed to start screen share:", err);
      }
    }
  };

  const handleHangup = async () => {
    setStatus('ended');
    if (sessionRef.current) {
      await sessionRef.current.hangup();
    }
    navigate(-1);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const finalAvatar = peerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peerName || 'Enclave'}`;

  return (
    <div className="fixed inset-0 bg-[#0a0f1d] z-[150] flex flex-col items-center justify-between text-white select-none overflow-hidden">
      
      {/* Background patterns & holograms for Voice Call */}
      {type === 'audio' && (
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="absolute w-[450px] h-[450px] rounded-full border border-teal-500/10 animate-[spin_40s_linear_infinite]" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-teal-500/20 animate-[spin_20s_linear_infinite_reverse]" />
          <div className="absolute w-[180px] h-[180px] rounded-full border border-teal-500/30 animate-pulse" />
        </div>
      )}

      {/* Remote video fills background (video calls only) */}
      {type === 'video' && (
        <div className="absolute inset-0 w-full h-full z-0 bg-black">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover" 
          />
          {status !== 'connected' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center">
              <span className="text-zinc-500 text-sm animate-pulse">Awaiting Peer Node Video Feed...</span>
            </div>
          )}
        </div>
      )}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Top security header bar */}
      <div className="relative z-10 w-full pt-8 px-6 flex items-center justify-between text-zinc-400 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-xs font-mono text-[#00a884] uppercase tracking-wider">
          <Shield size={14} className="animate-pulse" />
          <span>E2EE Secure Tunnel</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400">
          <Radio size={14} className="animate-pulse text-[#00a884]" />
          <span>STUN Peer Relay</span>
        </div>
      </div>

      {/* Main peer avatar and status details */}
      <div className="relative z-10 w-full flex flex-col items-center pt-8 pb-4">
        <div 
          id="call-avatar" 
          className={cn(
            "w-28 h-28 rounded-full bg-[#182232] flex items-center justify-center mb-4 overflow-hidden border-2 shadow-2xl transition-all duration-700",
            status === 'ringing' || status === 'connecting' 
              ? "border-teal-500 ring-8 ring-teal-500/10 scale-105" 
              : "border-white/10"
          )}
        >
          <img
            src={finalAvatar}
            alt="peer avatar"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 id="call-peer-name" className="text-2xl font-bold tracking-tight text-white mb-1 drop-shadow-md">{peerName || 'Connecting...'}</h2>
        
        {/* Call Badge Status Indicator */}
        <div className={cn(
          "px-3 py-1 rounded-full text-[11px] font-mono tracking-widest uppercase flex items-center gap-1.5",
          status === 'connected' ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" :
          status === 'ringing' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
          status === 'declined' ? "bg-red-500/10 text-red-400 border border-red-500/20" :
          "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
        )}>
          {status === 'connected' && <Sparkles size={11} className="animate-spin" />}
          <span>
            {status === 'ringing' && 'Ringing...'}
            {status === 'connecting' && 'Connecting...'}
            {status === 'connected' && `Secured • ${formatDuration(duration)}`}
            {status === 'declined' && 'Call Declined'}
            {status === 'ended' && 'Call Ended'}
          </span>
        </div>
      </div>

      {/* Sound spectrum visualizer inside Audio Call active state */}
      {type === 'audio' && status === 'connected' && (
        <div className="relative z-10">
          <AudioVoiceWave />
        </div>
      )}

      {/* Local video preview (video calls only) */}
      {type === 'video' && (
        <>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-28 right-4 w-28 h-40 rounded-2xl object-cover border-2 border-white/20 shadow-2xl z-20 hover:scale-105 transition-transform"
          />
          {isScreenSharing && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg animate-pulse flex items-center gap-2">
              <Monitor size={14} />
              You are sharing your screen
            </div>
          )}
        </>
      )}

      {/* Action controllers */}
      <div className="relative z-10 w-full flex items-center justify-center gap-6 pb-16 bg-gradient-to-t from-black/80 to-transparent pt-12">
        <button
          id="btn-toggle-mic"
          onClick={toggleMute}
          title={muted ? 'Unmute' : 'Mute'}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 border",
            muted 
              ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
              : 'bg-white/5 hover:bg-white/15 text-white border-white/10'
          )}
        >
          {muted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {type === 'video' && (
          <button
            id="btn-toggle-video"
            onClick={toggleVideo}
            title={videoOff ? 'Turn Video On' : 'Turn Video Off'}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 border",
              videoOff 
                ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'bg-white/5 hover:bg-white/15 text-white border-white/10'
            )}
          >
            {videoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}

        <button
          id="btn-hangup"
          onClick={handleHangup}
          title="Hang Up"
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-xl border border-red-500"
        >
          <PhoneOff size={26} className="text-white" />
        </button>

        <button 
          id="btn-volume"
          title="Audio Routing"
          className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center cursor-pointer transition-all shadow-lg active:scale-95 text-zinc-300 hover:text-white"
        >
          <Volume2 size={22} />
        </button>

        {type === 'video' && (
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 border",
              isScreenSharing 
                ? 'bg-amber-500 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                : 'bg-white/5 hover:bg-white/15 text-white border-white/10'
            )}
          >
            {isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
          </button>
        )}
      </div>
    </div>
  );
}
