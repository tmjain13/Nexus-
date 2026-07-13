import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, setDoc, addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useLocationSettings } from './useLocationSettings';
import { usePeaceMode } from './usePeaceMode';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export function useGeolocation() {
  const { user } = useAuth();
  const { settings } = useLocationSettings();
  const { isEnabled: isPeaceModeEnabled } = usePeaceMode();
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [city, setCity] = useState<string>("Unknown City");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [batteryLow, setBatteryLow] = useState<boolean>(false);

  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check battery levels
  useEffect(() => {
    const checkBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery: any = await (navigator as any).getBattery();
          setBatteryLow(battery.level < 0.20);
          
          const handleLevelChange = () => {
            setBatteryLow(battery.level < 0.20);
          };
          battery.addEventListener('levelchange', handleLevelChange);
          return () => battery.removeEventListener('levelchange', handleLevelChange);
        }
      } catch (e) {
        console.warn("Battery API not supported or failed:", e);
      }
    };
    checkBattery();
  }, []);

  // Determine if Ghost Mode should be enforced due to Peace Mode or Focus Session
  const isFocusActive = () => {
    const savedFocus = localStorage.getItem('enclave_focus_session');
    if (savedFocus) {
      try {
        const { expiry } = JSON.parse(savedFocus);
        return expiry > Date.now();
      } catch {
        return false;
      }
    }
    return false;
  };

  const isOverriddenToGhost = isPeaceModeEnabled || isFocusActive() || settings.mode === 'ghost';

  // Perform reverse geocoding using Nominatim (free OSM API)
  const fetchCityName = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'Enclave-OS-Messenger-Applet'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Unknown City";
      }
    } catch (err) {
      console.warn("Reverse geocoding error:", err);
    }
    return "Unknown City";
  };

  const trackAndSaveLocation = async () => {
    if (!user) return;
    setLoading(true);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setError(null);

        // Fetch city details
        const cityName = await fetchCityName(latitude, longitude);
        setCity(cityName);

        // Apply Privacy Rules
        let finalLat = latitude;
        let finalLng = longitude;

        // If not precise location, round to 2 decimal places (~1km)
        if (!settings.preciseLocation) {
          finalLat = parseFloat(latitude.toFixed(2));
          finalLng = parseFloat(longitude.toFixed(2));
        }

        setCoords({ lat: finalLat, lng: finalLng, accuracy });

        const userRef = doc(db, 'users', user.uid);

        // If overridden to Ghost Mode, clean or omit precise coordinates
        if (isOverriddenToGhost) {
          // Just update city, but clear precise coordinates to protect privacy
          try {
            await updateDoc(userRef, {
              location: {
                lat: 0,
                lng: 0,
                accuracy: 0,
                city: cityName,
                updatedAt: serverTimestamp()
              }
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
          }
        } else {
          // Write location to user doc
          try {
            await updateDoc(userRef, {
              location: {
                lat: finalLat,
                lng: finalLng,
                accuracy,
                city: cityName,
                updatedAt: serverTimestamp()
              }
            });

            // Write to Ghost Trail (Movement History - stored privately)
            // Save inside users/{uid}/ghostTrail collection
            await addDoc(collection(db, 'users', user.uid, 'ghostTrail'), {
              lat: finalLat,
              lng: finalLng,
              accuracy,
              city: cityName,
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
          }
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Unable to retrieve your location");
        setLoading(false);
      },
      { enableHighAccuracy: settings.preciseLocation, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Trigger update cycles
  useEffect(() => {
    if (!user) return;

    // Trigger immediate update
    trackAndSaveLocation();

    // Determine interval
    const isIntervalLong = settings.batterySaver || batteryLow;
    const intervalTime = isIntervalLong ? 10 * 60 * 1000 : 2 * 60 * 1000; // 10 mins vs 2 mins

    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current);
    }

    updateTimerRef.current = setInterval(() => {
      trackAndSaveLocation();
    }, intervalTime);

    return () => {
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [user, settings.preciseLocation, settings.batterySaver, batteryLow, isOverriddenToGhost]);

  return {
    coords: isOverriddenToGhost ? null : coords,
    city,
    error,
    loading,
    batteryLow,
    refresh: trackAndSaveLocation
  };
}
