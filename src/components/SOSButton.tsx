import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { AlertOctagon, ShieldAlert, X, HeartHandshake, PhoneCall } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface Contact {
  id: string;
  displayName: string;
  username: string;
}

export function SOSButton() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [emergencyContactId, setEmergencyContactId] = useState<string>('');
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [activeSOS, setActiveSOS] = useState<boolean>(false);

  // Sync emergency contact setting from user profile
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setEmergencyContactId(data.emergencyContactId || '');
        setActiveSOS(!!data.activeSOS);
      }
    });
    return () => unsub();
  }, [user]);

  // Sync available contacts to select
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'contacts'), (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        displayName: d.data().displayName || 'Friend',
        username: d.data().username || ''
      }));
      setContacts(list);
    });
    return () => unsub();
  }, [user]);

  // SOS abort countdown loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTriggering && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isTriggering && countdown === 0) {
      triggerSOS();
    }
    return () => clearTimeout(timer);
  }, [isTriggering, countdown]);

  const triggerSOS = async () => {
    if (!user) return;
    setIsTriggering(false);
    setActiveSOS(true);

    try {
      // 1. Mark SOS as active in user profile
      await updateDoc(doc(db, 'users', user.uid), {
        activeSOS: true
      });

      // 2. Fetch current user coordinates to share
      let coordsText = "GPS coordinates unavailable";
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          coordsText = `Location: https://maps.google.com/?q=${latitude},${longitude} (Accuracy: ~${Math.round(accuracy)}m)`;
          
          // Send SOS text in direct chat to emergency contact
          if (emergencyContactId) {
            const chatId = [user.uid, emergencyContactId].sort().join('_');
            const messageId = `sos_${Date.now()}`;
            await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
              senderId: 'system',
              text: `🚨 EMERGENCY SOS ACTIVATED BY ${user.displayName?.toUpperCase() || 'YOUR CONTACT'}! 🚨\n\nI need immediate assistance! Here are my real-time details:\n${coordsText}\n\nSent via Enclave OS Secure Messenger.`,
              type: 'text',
              status: 'sent',
              createdAt: serverTimestamp()
            });
          }
        }, async () => {
          // If permission blocked, still send warning
          if (emergencyContactId) {
            const chatId = [user.uid, emergencyContactId].sort().join('_');
            const messageId = `sos_${Date.now()}`;
            await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
              senderId: 'system',
              text: `🚨 EMERGENCY SOS ACTIVATED BY ${user.displayName?.toUpperCase() || 'YOUR CONTACT'}! 🚨\n\nI need assistance immediately! GPS coords blocked. Please contact me now!`,
              type: 'text',
              status: 'sent',
              createdAt: serverTimestamp()
            });
          }
        });
      }
    } catch (err) {
      console.error("SOS trigger failed:", err);
    }
  };

  const cancelSOS = async () => {
    if (!user) return;
    setActiveSOS(false);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        activeSOS: false
      });

      if (emergencyContactId) {
        const chatId = [user.uid, emergencyContactId].sort().join('_');
        const messageId = `sos_cancel_${Date.now()}`;
        await setDoc(doc(db, 'chats', chatId, 'messages', messageId), {
          senderId: 'system',
          text: `💚 SOS cancelled safely. ${user.displayName || 'Your contact'} is okay now. false alarm.`,
          type: 'text',
          status: 'sent',
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("SOS cancel failed:", e);
    }
  };

  const handleSelectEmergencyContact = async (id: string) => {
    if (!user) return;
    setEmergencyContactId(id);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        emergencyContactId: id
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <div id="sos-module-container" className="bg-zinc-950 border border-red-500/30 p-5 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-md shadow-red-500/5">
          <ShieldAlert className="text-red-500" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-200">
            SOS Distress Transmitter
          </h3>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
            Instantly alert emergency contacts of your location in danger.
          </p>
        </div>
      </div>

      {/* Select Emergency Contact */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
          Designate Emergency Node
        </label>
        <select
          value={emergencyContactId}
          onChange={(e) => handleSelectEmergencyContact(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl p-2.5 font-mono text-zinc-300 focus:outline-none focus:border-red-500 transition-all"
        >
          <option value="">-- Choose Emergency Contact --</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName} (@{c.username})
            </option>
          ))}
        </select>
      </div>

      {/* SOS Button Triggers */}
      <div className="pt-2">
        {activeSOS ? (
          <div className="space-y-3">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-mono font-bold uppercase text-red-500">Active SOS Broadcast</span>
              </div>
              <button
                onClick={cancelSOS}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg text-[10px] font-mono uppercase border border-zinc-800 transition-all cursor-pointer"
                style={{ borderStyle: 'solid' }}
              >
                Clear Beacon
              </button>
            </div>
          </div>
        ) : isTriggering ? (
          <div className="flex flex-col items-center justify-center p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-center space-y-3 animate-pulse">
            <span className="text-4xl font-mono font-extrabold text-red-500">{countdown}</span>
            <div className="text-xs font-mono uppercase text-red-400">Transmitting SOS distress beacon...</div>
            <button
              onClick={() => {
                setIsTriggering(false);
                setCountdown(3);
              }}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-[10px] uppercase font-bold tracking-widest border border-zinc-800 rounded-lg cursor-pointer"
              style={{ borderStyle: 'solid' }}
            >
              Abort Transmission
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!emergencyContactId) {
                alert("Please select an emergency contact first.");
                return;
              }
              setIsTriggering(true);
              setCountdown(3);
            }}
            className="w-full bg-red-600 hover:bg-red-500 text-zinc-950 font-bold uppercase py-4.5 rounded-xl text-xs font-mono tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-600/15 cursor-pointer transform hover:scale-[1.01] active:scale-98 transition-all"
            style={{ border: 'none' }}
          >
            <AlertOctagon size={16} />
            Transmit distress SOS beacon
          </button>
        )}
      </div>
    </div>
  );
}
