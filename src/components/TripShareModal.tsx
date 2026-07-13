import React, { useState, useEffect } from 'react';
import { useTripShare } from '../hooks/useTripShare';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Compass, X, Play, ShieldCheck, MapPin, Clock, Users, Navigation } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface Contact {
  id: string;
  displayName: string;
  username: string;
  photoURL?: string;
}

interface TripShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TripShareModal({ isOpen, onClose }: TripShareModalProps) {
  const { user } = useAuth();
  const { activeTrip, startTrip, endTrip } = useTripShare();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [destinationName, setDestinationName] = useState<string>('');
  const [duration, setDuration] = useState<number>(30); // in minutes
  const [loading, setLoading] = useState<boolean>(false);

  // Sync available contacts to select for sharing
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'contacts'), (snap) => {
      const list = snap.docs.map(d => ({
        id: d.id,
        displayName: d.data().displayName || 'Friend',
        username: d.data().username || '',
        photoURL: d.data().photoURL
      }));
      setContacts(list);
    });
    return () => unsub();
  }, [user]);

  if (!isOpen) return null;

  const handleStartTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedContactId || !destinationName) return;

    setLoading(true);
    try {
      // 1. Fetch current GPS location for starting point
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const startLoc = {
            lat: latitude,
            lng: longitude,
            accuracy,
            city: "Departure Point",
            updatedAt: new Date() as any
          };

          // Generate a destination within ~2km for the simulation/MVP, or use approximate offset
          const destOffsetLat = (Math.random() - 0.5) * 0.02;
          const destOffsetLng = (Math.random() - 0.5) * 0.02;
          const endLoc = {
            lat: latitude + destOffsetLat,
            lng: longitude + destOffsetLng,
            accuracy,
            city: destinationName,
            updatedAt: new Date() as any
          };

          await startTrip(selectedContactId, startLoc, endLoc, duration);
          setLoading(false);
          onClose();
        }, () => {
          // Fallback coordinate if geolocation fails
          const startLoc = { lat: 37.7749, lng: -122.4194, accuracy: 50, city: "Mock Start", updatedAt: new Date() as any };
          const endLoc = { lat: 37.7899, lng: -122.4094, accuracy: 50, city: destinationName, updatedAt: new Date() as any };
          startTrip(selectedContactId, startLoc, endLoc, duration);
          setLoading(false);
          onClose();
        });
      }
    } catch (err) {
      console.error("Failed to start trip:", err);
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    setLoading(true);
    await endTrip(activeTrip.id, false); // Cancel early
    setLoading(false);
    onClose();
  };

  const handleArrivedSafely = async () => {
    if (!activeTrip) return;
    setLoading(true);
    await endTrip(activeTrip.id, true); // Marked as arrived
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-zinc-950 text-zinc-100 rounded-2xl border border-zinc-800 shadow-2xl p-5 relative space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors p-1.5 hover:bg-zinc-900 rounded-lg cursor-pointer"
          style={{ border: 'none' }}
        >
          <X size={18} />
        </button>

        {activeTrip ? (
          /* Active Trip Controls */
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 animate-pulse">
              <Compass size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-200">
                Live Trip Active
              </h3>
              <p className="text-xs text-zinc-400">
                Sharing route live to destination: <strong className="text-amber-500">{(activeTrip.end as any).city}</strong>
              </p>
            </div>

            <div className="p-3.5 bg-zinc-900/60 border border-zinc-850/60 rounded-xl text-left space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                <Clock size={12} />
                Duration Remaining
              </div>
              <div className="text-xs font-mono font-bold text-zinc-300">
                Expires at: {activeTrip.expiresAt ? new Date((activeTrip.expiresAt as any).toDate ? (activeTrip.expiresAt as any).toDate() : activeTrip.expiresAt).toLocaleTimeString() : '--:--'}
              </div>
              <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-2/3 rounded-full animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                onClick={handleEndTrip}
                className="py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-mono uppercase tracking-wider font-bold border border-zinc-800 transition-all cursor-pointer"
                style={{ borderStyle: 'solid' }}
              >
                Cancel Share
              </button>
              <button
                onClick={handleArrivedSafely}
                className="py-3 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 rounded-xl text-xs font-mono uppercase tracking-wider font-bold shadow-lg shadow-emerald-600/10 transition-all cursor-pointer"
                style={{ border: 'none' }}
              >
                Arrived Safely!
              </button>
            </div>
          </div>
        ) : (
          /* Create New Trip Share */
          <form onSubmit={handleStartTrip} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-md shadow-amber-500/5">
                <Navigation className="text-amber-500 rotate-45" size={20} />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-200">
                  Secure Trip Share
                </h3>
                <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Stream your movement path securely to a trusted friend.
                </p>
              </div>
            </div>

            {/* Select Contact */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">
                Share With
              </label>
              <select
                required
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl p-2.5 font-mono text-zinc-300 focus:outline-none focus:border-amber-500 transition-all"
              >
                <option value="">-- Choose Trusted Friend --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} (@{c.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Name */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">
                Destination Designation
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="e.g. Home, Work, Gym, Central Station"
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl p-2.5 pl-8.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all font-mono"
                />
                <MapPin size={14} className="text-zinc-600 absolute left-3 top-3.2" />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-zinc-500 block">
                Transmission Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 60, 120].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setDuration(min)}
                    className={`py-2 rounded-xl text-[10px] font-mono transition-all cursor-pointer ${
                      duration === min
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500'
                        : 'bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                    }`}
                    style={{ borderStyle: 'solid' }}
                  >
                    {min >= 60 ? `${min / 60}h` : `${min}m`}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={loading || !selectedContactId || !destinationName}
              type="submit"
              className="w-full py-3.5 mt-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none text-zinc-950 font-bold uppercase rounded-xl text-xs font-mono tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer transform hover:scale-[1.01] active:scale-98 transition-all"
              style={{ border: 'none' }}
            >
              <Play size={14} />
              Engage Trip Sharing
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
