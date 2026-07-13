import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldAlert, Timer } from 'lucide-react';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ViewOnceOverlayProps {
  messageId: string;
  chatId: string;
  isGroup: boolean;
  mediaUrl: string;
  type: 'image' | 'video';
  viewedBy?: string[];
  userId: string;
  isSender: boolean;
}

export const ViewOnceOverlay: React.FC<ViewOnceOverlayProps> = ({
  messageId,
  chatId,
  isGroup,
  mediaUrl,
  type,
  viewedBy = [],
  userId,
  isSender
}) => {
  const [viewing, setViewing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isOpened, setIsOpened] = useState(false);

  const collectionName = isGroup ? 'groupChat' : 'chats';
  const messageDocRef = doc(db, collectionName, chatId, 'messages', messageId);

  const hasOpenedBefore = viewedBy.includes(userId);

  useEffect(() => {
    if (viewing && secondsLeft > 0) {
      const timer = setTimeout(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (viewing && secondsLeft === 0) {
      setViewing(false);
      setIsOpened(true);
      
      // Update doc to expire immediately so cleanup cleans it
      updateDoc(messageDocRef, {
        expiresAt: Timestamp.now()
      }).catch(console.error);
    }
  }, [viewing, secondsLeft, messageDocRef]);

  const handleOpen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSender) {
      // Senders cannot view their own view-once messages
      return;
    }
    if (hasOpenedBefore || isOpened) {
      return;
    }

    try {
      setViewing(true);
      setSecondsLeft(10);
      
      // Update viewed list and set standard 10-second expiration limit
      await updateDoc(messageDocRef, {
        viewedBy: arrayUnion(userId),
        expiresAt: Timestamp.fromMillis(Date.now() + 10 * 1000)
      });
    } catch (err) {
      console.error("Failed to start viewing view-once media", err);
    }
  };

  if (isOpened || hasOpenedBefore) {
    return (
      <div className="w-full aspect-video bg-zinc-950 rounded-2xl flex flex-col items-center justify-center p-4 border border-zinc-900 select-none">
        <EyeOff size={28} className="text-zinc-600 mb-2" />
        <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Opened View-Once Media</span>
      </div>
    );
  }

  if (viewing) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-800">
        <div className="absolute top-3 right-3 z-30 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-amber-500/30 text-amber-500 text-[10px] font-mono font-bold select-none">
          <Timer size={12} className="animate-spin" />
          <span>{secondsLeft}s left</span>
        </div>
        
        {type === 'image' ? (
          <img 
            src={mediaUrl} 
            alt="View Once" 
            className="w-full h-auto object-cover max-h-[350px]" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <video 
            src={mediaUrl} 
            controls 
            autoPlay 
            className="w-full max-h-[350px]"
          />
        )}

        <div className="bg-amber-500/10 border-t border-amber-500/20 p-2 text-[9px] text-amber-500 font-mono uppercase text-center select-none flex items-center justify-center gap-1.5">
          <ShieldAlert size={10} className="animate-pulse" />
          <span>Do not take screenshots. This media will disappear in {secondsLeft} seconds.</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleOpen}
      className={`w-full aspect-video bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden select-none transition-all group ${
        isSender ? 'opacity-80 hover:opacity-90 cursor-not-allowed' : 'hover:bg-zinc-850 hover:border-amber-500/20'
      }`}
    >
      {type === 'image' && (
        <img 
          src={mediaUrl} 
          alt="Blur preview" 
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 pointer-events-none"
          referrerPolicy="no-referrer"
        />
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className={`p-3 rounded-full mb-2 bg-zinc-950 border border-zinc-850 group-hover:border-amber-500/30 transition-colors ${isSender ? '' : 'text-amber-500'}`}>
          <Eye size={22} className={isSender ? 'text-zinc-500' : 'animate-pulse text-amber-500'} />
        </div>
        <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-400 transition-colors">
          {isSender ? "View Once Media Sent" : "👁️ View Once Media"}
        </span>
        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
          {isSender ? "Recipient can view for 10s" : "Tap to open (10 second limit)"}
        </p>
      </div>
    </div>
  );
};
