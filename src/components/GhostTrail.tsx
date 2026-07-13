import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc, writeBatch, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Footprints, Trash2, Calendar, MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface TrailItem {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  city: string;
  updatedAt: any;
}

export function GhostTrail() {
  const { user } = useAuth();
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const trailRef = collection(db, 'users', user.uid, 'ghostTrail');
    const q = query(trailRef, orderBy('updatedAt', 'desc'), limit(100));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as TrailItem);
      
      // Filter out locations older than 24 hours
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentTrail = list.filter(item => {
        if (!item.updatedAt) return true;
        const time = item.updatedAt.toDate ? item.updatedAt.toDate().getTime() : new Date(item.updatedAt).getTime();
        return time > oneDayAgo;
      });

      setTrail(recentTrail);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/ghostTrail`);
    });

    return () => unsub();
  }, [user]);

  const wipeTrail = async () => {
    if (!user || trail.length === 0) return;
    setDeleting(true);

    try {
      const trailRef = collection(db, 'users', user.uid, 'ghostTrail');
      const snap = await getDocs(trailRef);
      const batch = writeBatch(db);
      
      snap.forEach((d) => {
        batch.delete(d.ref);
      });

      await batch.commit();
      setTrail([]);
    } catch (err) {
      console.error("Wiping trail error:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div id="ghost-trail-module" className="bg-zinc-950 border border-zinc-800/80 p-5 rounded-2xl shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-md shadow-amber-500/5">
            <Footprints className="text-amber-500" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-200">
              Personal Ghost Trail
            </h3>
            <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
              Your private 24-hour movement log. Never shared.
            </p>
          </div>
        </div>
        {trail.length > 0 && (
          <button
            onClick={wipeTrail}
            disabled={deleting}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50"
            title="Wipe Ghost Trail"
            style={{ border: 'none' }}
          >
            {deleting ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <Trash2 className="w-4.5 h-4.5" />
            )}
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-6 text-zinc-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
          Deciphering telemetry footprint...
        </div>
      ) : trail.length === 0 ? (
        <div className="p-4 bg-zinc-900/40 border border-zinc-850/60 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-zinc-500 shrink-0" size={16} />
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-zinc-400">No Trail History</div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Your device hasn't recorded any local movement nodes in the last 24h. Make sure visibility sharing is enabled or click fresh pings!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {trail.map((item) => {
            const timeStr = item.updatedAt
              ? formatDistanceToNow(item.updatedAt.toDate ? item.updatedAt.toDate() : new Date(item.updatedAt), { addSuffix: true })
              : 'Recently';
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-850 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0 border border-zinc-800">
                    <Navigation size={14} className="rotate-45" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <MapPin size={12} className="text-amber-500/80" />
                      {item.city || 'Unknown Node'}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {item.lat.toFixed(3)}°, {item.lng.toFixed(3)}° (±{Math.round(item.accuracy)}m)
                    </div>
                  </div>
                </div>
                <div className="text-[9px] font-mono text-zinc-500 uppercase shrink-0 text-right">
                  {timeStr}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
