import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { LocationSettings, LocationMode } from '../types';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

const DEFAULT_SETTINGS: LocationSettings = {
  mode: 'ghost',
  allowedFriends: [],
  preciseLocation: false,
  batterySaver: false,
  updatedAt: new Date() as any
};

export function useLocationSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<LocationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(docRef, (docSnap) => {
      setLoading(false);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.locationSettings) {
          setSettings({
            mode: data.locationSettings.mode || 'ghost',
            allowedFriends: data.locationSettings.allowedFriends || [],
            preciseLocation: !!data.locationSettings.preciseLocation,
            batterySaver: !!data.locationSettings.batterySaver,
            updatedAt: data.locationSettings.updatedAt || new Date()
          });
        } else {
          // Initialize default location settings if not present
          setSettings(DEFAULT_SETTINGS);
          updateDoc(docRef, { locationSettings: DEFAULT_SETTINGS }).catch(() => {});
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });

    return () => unsub();
  }, [user]);

  const updateSettingsField = async (fields: Partial<LocationSettings>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    try {
      const updated = {
        ...settings,
        ...fields,
        updatedAt: serverTimestamp() as any
      };
      
      const payload: Record<string, any> = {};
      Object.entries(updated).forEach(([key, val]) => {
        payload[`locationSettings.${key}`] = val;
      });
      
      await updateDoc(docRef, payload);
      setSettings(prev => ({ ...prev, ...fields }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const updateMode = async (mode: LocationMode) => {
    await updateSettingsField({ mode });
  };

  const togglePrecise = async () => {
    await updateSettingsField({ preciseLocation: !settings.preciseLocation });
  };

  const addAllowedFriend = async (friendId: string) => {
    if (settings.allowedFriends.includes(friendId)) return;
    const updatedFriends = [...settings.allowedFriends, friendId];
    await updateSettingsField({ allowedFriends: updatedFriends });
  };

  const removeAllowedFriend = async (friendId: string) => {
    const updatedFriends = settings.allowedFriends.filter(id => id !== friendId);
    await updateSettingsField({ allowedFriends: updatedFriends });
  };

  return {
    settings,
    updateMode,
    togglePrecise,
    addAllowedFriend,
    removeAllowedFriend,
    updateSettingsField,
    loading
  };
}
