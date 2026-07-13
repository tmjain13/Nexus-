import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';

export interface ExpiringMessage {
  id?: string;
  expiresAt?: Timestamp | any;
  viewOnce?: boolean;
  viewedBy?: string[];
  [key: string]: any;
}

export function useMessageExpiry(message: ExpiringMessage) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [color, setColor] = useState<'gray' | 'amber' | 'red'>('gray');
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!message || !message.expiresAt) {
      setTimeLeft('');
      setIsExpired(false);
      return;
    }

    const calculateTime = () => {
      let expiresMs = 0;
      if (message.expiresAt instanceof Timestamp) {
        expiresMs = message.expiresAt.toMillis();
      } else if (message.expiresAt?.seconds) {
        expiresMs = message.expiresAt.seconds * 1000;
      } else if (message.expiresAt instanceof Date) {
        expiresMs = message.expiresAt.getTime();
      } else if (typeof message.expiresAt === 'number') {
        expiresMs = message.expiresAt;
      } else if (typeof message.expiresAt === 'string') {
        expiresMs = new Date(message.expiresAt).getTime();
      } else {
        return;
      }

      const nowMs = Date.now();
      const diffMs = expiresMs - nowMs;

      if (diffMs <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        setColor('red');
        return;
      }

      setIsExpired(false);
      
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 3600) {
        setColor('red');
      } else if (seconds < 86400) {
        setColor('amber');
      } else {
        setColor('gray');
      }

      if (days > 0) {
        setTimeLeft(`${days}d left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h left`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m left`);
      } else {
        setTimeLeft(`${seconds}s left`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [message?.expiresAt]);

  return { timeLeft, color, isExpired };
}
