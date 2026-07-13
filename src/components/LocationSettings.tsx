import React, { useState, useEffect } from 'react';
import { useLocationSettings } from '../hooks/useLocationSettings';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Shield, EyeOff, Users, UserCheck, Smartphone, Battery, Compass, ChevronRight } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

interface Contact {
  id: string;
  displayName: string;
  username: string;
  photoURL?: string;
}

export function LocationSettingsPanel() {
  const { user } = useAuth();
  const {
    settings,
    updateMode,
    togglePrecise,
    addAllowedFriend,
    removeAllowedFriend,
    updateSettingsField,
    loading
  } = useLocationSettings();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState<boolean>(true);

  // Sync contacts to let the user select friends
  useEffect(() => {
    if (!user) {
      setContactsLoading(false);
      return;
    }

    const unsub = onSnapshot(collection(db, 'users', user.uid, 'contacts'), (snap) => {
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Contact);
      setContacts(list);
      setContactsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/contacts`);
    });

    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-zinc-500 font-mono text-xs uppercase tracking-widest animate-pulse">
        Configuring privacy matrices...
      </div>
    );
  }

  const isUnder18 = false; // Mock age verification check if needed, but child account safety can be checked

  return (
    <div id="location-settings-panel" className="bg-zinc-950 text-zinc-100 p-5 rounded-2xl border border-zinc-800/80 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/60">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-md shadow-amber-500/5">
          <Shield className="text-amber-500" size={20} />
        </div>
        <div>
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
            Enclave Map Settings
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
              SECURE
            </span>
          </h2>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5">Control who can see your location on the map.</p>
        </div>
      </div>

      {isUnder18 ? (
        <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-red-400 text-xs font-mono">
          🚨 CHILD SECURITY PROTOCOL: Since this is a minor account, Ghost Mode is strictly enforced and cannot be disabled. Your safety is our highest priority.
        </div>
      ) : (
        <>
          {/* Visibility Mode Selectors */}
          <div className="space-y-3">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold block">
              Visibility Matrix
            </label>
            <div className="grid grid-cols-1 gap-2">
              {/* Ghost Mode */}
              <button
                id="btn-mode-ghost"
                onClick={() => updateMode('ghost')}
                className={`flex items-start gap-4 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  settings.mode === 'ghost'
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/5'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
                style={{ borderStyle: 'solid' }}
              >
                <div className={`p-2 rounded-lg shrink-0 ${settings.mode === 'ghost' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
                  <EyeOff size={18} />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-200">
                    Ghost Mode
                    {settings.mode === 'ghost' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Completely invisible to everyone. You also see no one. Map displays only your last approximate city.
                  </p>
                </div>
              </button>

              {/* My Contacts */}
              <button
                id="btn-mode-contacts"
                onClick={() => updateMode('contacts')}
                className={`flex items-start gap-4 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  settings.mode === 'contacts'
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/5'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
                style={{ borderStyle: 'solid' }}
              >
                <div className={`p-2 rounded-lg shrink-0 ${settings.mode === 'contacts' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Users size={18} />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-200">
                    My Contacts
                    {settings.mode === 'contacts' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Only verified contacts can view your location. Non-contacts or public users see nothing.
                  </p>
                </div>
              </button>

              {/* Select Friends */}
              <button
                id="btn-mode-select"
                onClick={() => updateMode('select')}
                className={`flex items-start gap-4 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  settings.mode === 'select'
                    ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/5'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
                style={{ borderStyle: 'solid' }}
              >
                <div className={`p-2 rounded-lg shrink-0 ${settings.mode === 'select' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
                  <UserCheck size={18} />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-zinc-200">
                    Select Friends
                    {settings.mode === 'select' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Whitelist specific friends who can view you. Everyone else remains completely blind to your updates.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Allowed Friends Whitelist Selection */}
          {settings.mode === 'select' && (
            <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
                  Friend Whitelist
                </span>
                <span className="text-[10px] font-mono text-amber-500">
                  {settings.allowedFriends.length} whitelisted
                </span>
              </div>

              {contactsLoading ? (
                <div className="text-center p-4 text-[10px] font-mono text-zinc-500 animate-pulse">
                  Querying potential nodes...
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center p-4 text-[11px] text-zinc-500">
                  No contacts found. Match phone contacts first.
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {contacts.map((contact) => {
                    const isAllowed = settings.allowedFriends.includes(contact.id);
                    return (
                      <div
                        key={contact.id}
                        onClick={() => isAllowed ? removeAllowedFriend(contact.id) : addAllowedFriend(contact.id)}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/40 hover:border-zinc-800 cursor-pointer transition-all duration-150"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={contact.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`}
                            className="w-7 h-7 rounded-full object-cover border border-zinc-800"
                            alt={contact.displayName}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-200 truncate">{contact.displayName}</div>
                            <div className="text-[10px] text-zinc-500 font-mono truncate">@{contact.username}</div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isAllowed}
                          readOnly
                          className="w-4 h-4 rounded border-zinc-800 text-amber-500 focus:ring-amber-500 bg-zinc-950 cursor-pointer accent-amber-500"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Privacy Precision & Battery Saver Toggles */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold block">
              Security Toggles
            </label>
            <div className="space-y-2.5">
              {/* Precise Location */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 shrink-0">
                    <Compass size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                      Precise Location
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal">
                      Disable to round coordinates to 2 decimal places (~1km approximate radius) for ultimate safety.
                    </p>
                  </div>
                </div>
                <button
                  id="toggle-precise-location"
                  onClick={togglePrecise}
                  className={`w-11 h-6 rounded-full shrink-0 transition-all cursor-pointer relative ${
                    settings.preciseLocation ? 'bg-amber-500' : 'bg-zinc-800'
                  }`}
                  style={{ border: 'none' }}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-zinc-950 absolute top-0.75 transition-all ${
                    settings.preciseLocation ? 'right-0.75' : 'left-0.75'
                  }`} />
                </button>
              </div>

              {/* Battery Saver */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 shrink-0">
                    <Battery size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
                      Battery Optimization
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-normal">
                      Reduces geolocation ping frequency to once every 10 minutes when battery drops below 20% to save life.
                    </p>
                  </div>
                </div>
                <button
                  id="toggle-battery-saver"
                  onClick={() => updateSettingsField({ batterySaver: !settings.batterySaver })}
                  className={`w-11 h-6 rounded-full shrink-0 transition-all cursor-pointer relative ${
                    settings.batterySaver ? 'bg-amber-500' : 'bg-zinc-800'
                  }`}
                  style={{ border: 'none' }}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-zinc-950 absolute top-0.75 transition-all ${
                    settings.batterySaver ? 'right-0.75' : 'left-0.75'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
