import { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export interface FocusSession {
  duration: number; // in minutes
  sound: string;
  distractions: number;
}

const SOUNDS = {
  none: '',
  rain: 'https://assets.mixkit.co/active_storage/sfx/2433/2433-84.wav',
  forest: 'https://assets.mixkit.co/active_storage/sfx/1244/1244-84.wav',
  waves: 'https://assets.mixkit.co/active_storage/sfx/1110/1110-84.wav'
};

export function useFocusTimer() {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(0); // in seconds
  const [initialDuration, setInitialDuration] = useState<number>(0); // in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<keyof typeof SOUNDS>('none');
  const [distractions, setDistractions] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Restore active focus session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('enclave_focus_session');
    if (saved) {
      const { expiry, duration, sound, startDistractions } = JSON.parse(saved);
      const remaining = Math.round((expiry - Date.now()) / 1000);
      if (remaining > 0) {
        setTimeLeft(remaining);
        setInitialDuration(duration * 60);
        setSelectedSound(sound);
        setIsRunning(true);
      } else {
        localStorage.removeItem('enclave_focus_session');
      }
    }
  }, []);

  // Timer countdown tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            playChime();
            recordCompletedSession();
            localStorage.removeItem('enclave_focus_session');
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  // Handle ambient sound playback
  useEffect(() => {
    if (isRunning && selectedSound !== 'none') {
      const url = SOUNDS[selectedSound];
      if (url) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(url);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioRef.current.play().catch((e) => console.warn("Audio playback blocked or failed:", e));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isRunning, selectedSound]);

  const playChime = () => {
    const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-84.wav'); // gentle chime / bell
    chime.volume = 0.8;
    chime.play().catch(() => {});
  };

  const recordCompletedSession = async () => {
    if (!user) return;
    const durationMinutes = Math.round(initialDuration / 60);
    const today = new Date().toISOString().split('T')[0];

    try {
      const statsRef = doc(db, 'users', user.uid, 'peaceModeStats', today);
      const docSnap = await getDoc(statsRef);
      if (docSnap.exists()) {
        await updateDoc(statsRef, {
          minutesInPeaceMode: increment(durationMinutes),
          focusSessions: increment(1)
        });
      } else {
        await setDoc(statsRef, {
          date: today,
          minutesInPeaceMode: durationMinutes,
          focusSessions: 1,
          messagesSent: 0,
          notificationsBlocked: distractions,
          peaceScore: 85
        });
      }
    } catch (err) {
      console.warn("Failed to record focus stats:", err);
    }
  };

  const start = (minutes: number, sound: keyof typeof SOUNDS = 'none') => {
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setInitialDuration(seconds);
    setSelectedSound(sound);
    setIsRunning(true);
    setIsCompleted(false);
    setDistractions(0);

    const expiry = Date.now() + seconds * 1000;
    localStorage.setItem('enclave_focus_session', JSON.stringify({
      expiry,
      duration: minutes,
      sound,
      startDistractions: 0
    }));
  };

  const pause = () => {
    setIsRunning(false);
    localStorage.removeItem('enclave_focus_session');
  };

  const end = () => {
    setIsRunning(false);
    setTimeLeft(0);
    localStorage.removeItem('enclave_focus_session');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const incrementDistractions = () => {
    setDistractions(prev => prev + 1);
  };

  return {
    timeLeft,
    initialDuration,
    isRunning,
    isCompleted,
    selectedSound,
    setSelectedSound,
    distractions,
    start,
    pause,
    end,
    incrementDistractions,
    setIsCompleted
  };
}
