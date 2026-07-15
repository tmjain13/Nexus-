import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pin, Sparkles, Hourglass, Check, CheckCheck, Heart } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { usePeaceMode } from '../hooks/usePeaceMode';
import { useCloseFriends } from '../hooks/useCloseFriends';
import { cn } from '../lib/utils';
import { formatDistanceToNow, isToday, format } from 'date-fns';

interface ChatListItemProps {
  chat: any;
  currentUserId: string;
  isUnread: boolean;
  unreadCount: number;
  isPinned: boolean;
  isFavorite?: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  density: 'compact' | 'default' | 'comfortable';
  typingUsers?: string[];
  draftText?: string;
  onChatClick: (chatId: string) => void;
  onLongPress: (e: React.MouseEvent | React.TouchEvent, chatId: string) => void;
  onSwipeSummarize: (chatId: string, chatTitle: string) => void;
  hasUnreadStory?: boolean;
}

const MessageStatusIndicator = ({ status }: { status: string }) => {
  return (
    <div className="flex items-center justify-center w-[16px] shrink-0">
      {status === 'sent' && <Check size={12} className="text-zinc-500" />}
      {status === 'delivered' && <CheckCheck size={12} className="text-zinc-500" />}
      {status === 'read' && <CheckCheck size={12} className="text-amber-500" />}
    </div>
  );
};

const PeerPresenceStatus = ({ userId }: { userId: string }) => {
  const [peerData, setPeerData] = useState<any>(null);
  const { isEnabled: isPeaceModeActive } = usePeaceMode();

  useEffect(() => {
    if (!userId) return;
    return onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) setPeerData(docSnap.data());
    });
  }, [userId]);

  if (!peerData) return null;

  const isOnline = peerData.isOnline;
  const isPeerInPeace = peerData.presence?.peaceMode || peerData.settings?.peaceMode?.enabled;
  const showPeace = isPeaceModeActive || isPeerInPeace;

  if (showPeace) {
    return (
      <div 
        className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-slate-900 shadow-sm flex items-center justify-center text-[7px]"
        title="In Peace Mode 🧘"
      >
        🧘
      </div>
    );
  }

  if (isOnline) {
    return (
      <div 
        className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-sm animate-pulse"
        title="Online"
      />
    );
  }

  return null;
};

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  currentUserId,
  isUnread,
  unreadCount,
  isPinned,
  isFavorite = false,
  isSelectionMode,
  isSelected,
  density,
  typingUsers = [],
  draftText,
  onChatClick,
  onLongPress,
  onSwipeSummarize,
  hasUnreadStory = false,
}) => {
  const isMe = chat.lastMessage?.senderId === currentUserId;
  const chatTitle = chat.groupName || chat.name || chat.peerName || 'Direct Message';
  const peerId = !chat.isGroup ? chat.participants?.find((p: string) => p !== currentUserId) : null;

  // Swipe state
  const isSpecialBot = chat.id.startsWith('ai_companion') || chat.id.includes('random_check_bot');

  // Format timestamp
  const lastMsgDate = chat.lastMessage?.createdAt?.toDate ? chat.lastMessage.createdAt.toDate() : null;
  const timeStr = lastMsgDate ? (
    isToday(lastMsgDate) ? format(lastMsgDate, 'h:mm a') : format(lastMsgDate, 'dd/MM/yy')
  ) : '';

  // Padding based on density
  const py = density === 'compact' ? 'py-2' : density === 'comfortable' ? 'py-4.5' : 'py-3';

  // Press management
  const pressTimer = React.useRef<any>(null);
  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      onLongPress(e, chat.id);
    }, 600);
  };
  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  return (
    <div className="relative overflow-hidden w-full select-none border-b border-border-subtle/30">
      
      {/* Swipe Quick Action Backplate (E2EE Summary) */}
      {!isSpecialBot && (
        <div className="absolute inset-y-0 right-0 w-32 bg-accent/10 flex items-center justify-center border-l border-accent/10 text-accent z-0 select-none">
          <div className="flex flex-col items-center gap-1">
            <Sparkles size={16} className="text-accent animate-pulse" />
            <span className="text-[9px] font-extrabold font-mono tracking-widest uppercase">Summarize</span>
          </div>
        </div>
      )}

      {/* Main Draggable Layer */}
      <motion.div
        drag={!isSpecialBot ? "x" : false}
        dragConstraints={{ left: -128, right: 0 }}
        dragElastic={0.12}
        dragTransition={{ power: 0.2, timeConstant: 180 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -60) {
            onSwipeSummarize(chat.id, chatTitle);
          }
        }}
        onClick={() => onChatClick(chat.id)}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        className={cn(
          "flex items-center px-4 w-full relative z-10 cursor-pointer transition-colors duration-200 bg-transparent hover:bg-bg-elevated/30",
          py,
          isSelected && "bg-bg-elevated/40 border-l-4 border-accent pl-3"
        )}
      >
        {/* Selection Checkbox */}
        {isSelectionMode && !isSpecialBot && (
          <div className="mr-3 shrink-0">
            <div
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center transition-all border",
                isSelected 
                  ? "bg-accent border-accent" 
                  : "bg-bg-primary border-border-subtle"
              )}
            >
              {isSelected && <Check size={12} strokeWidth={4} className="text-bg-primary" />}
            </div>
          </div>
        )}

        {/* Left: Avatar container with exactly 16px right spacing */}
        <div className="relative shrink-0 mr-4">
          {chat.isGroup || chat.type === 'group' ? (
            /* Group Layout Avatar (52px Box rounded-xl) */
            <div className="w-13 h-13 rounded-xl overflow-hidden bg-bg-elevated border border-border-subtle flex items-center justify-center shadow-lg">
              {chat.avatar || chat.groupPhoto ? (
                <img
                  src={chat.avatar || chat.groupPhoto}
                  alt={chatTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-accent/5">
                  <img
                    src={chat.members?.[0] ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.members[0]}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=m1`}
                    className="absolute w-7 h-7 rounded-xl border border-bg-primary object-cover top-1.5 left-1.5 z-10"
                    alt="M1"
                  />
                  <img
                    src={chat.members?.[1] ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.members[1]}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=m2`}
                    className="absolute w-7 h-7 rounded-xl border border-bg-primary object-cover bottom-1.5 right-1.5 z-20"
                    alt="M2"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Direct message Avatar (52px rounded-xl) with Story Ring option */
            <div 
              className={cn(
                "w-13 h-13 rounded-xl p-[2px] transition-all",
                hasUnreadStory 
                  ? "bg-gradient-to-tr from-accent to-orange-500 ring-2 ring-accent/10" 
                  : "bg-transparent border border-border-subtle/50"
              )}
            >
              <div className="w-full h-full rounded-[10px] overflow-hidden bg-bg-elevated">
                <img
                  src={chat.groupPhoto || chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`}
                  alt={chatTitle}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          )}

          {/* Real-time online/presence dot over avatar */}
          {peerId && (
            <div className="absolute -bottom-0.5 -right-0.5 z-10">
              <PeerPresenceStatus userId={peerId} />
            </div>
          )}
        </div>

        {/* Center/Right Details Area */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Top Row: Name and Time */}
          <div className="flex items-center justify-between gap-2">
            <h3 
              className={cn(
                "text-[15px] font-semibold truncate flex items-center gap-1.5 font-sans tracking-tight",
                isUnread ? "text-accent font-bold" : "text-text-primary"
              )}
            >
              {isPinned && <Pin size={11} className="text-accent -rotate-45" />}
              {isFavorite && <Heart size={11} className="text-rose-500 fill-rose-500" />}
              <span className="truncate">{chatTitle}</span>
              
              {chat.settings?.disappearingTimer > 0 && (
                <span title="Disappearing messages">
                  <Hourglass size={11} className="text-accent shrink-0 animate-pulse" />
                </span>
              )}
              
              {chat.isChannel && (
                <span className="font-sans text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-purple-500/25 bg-purple-950/20 text-purple-400">
                  Broadcast
                </span>
              )}
              {chat.isCommunity && (
                <span className="font-sans text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-blue-500/25 bg-blue-955/20 text-blue-400">
                  Node
                </span>
              )}
            </h3>
            
            <span className={cn("text-[12px] font-medium font-sans shrink-0", isUnread ? "text-accent font-semibold" : "text-text-muted")}>
              {timeStr}
            </span>
          </div>

          {/* Bottom Row: Message preview / typing / draft */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {typingUsers.length > 0 ? (
                /* Typing Indicator */
                <span className="text-[14px] font-medium text-accent flex items-center gap-1.5 font-sans italic animate-pulse">
                  <span className="shrink-0">{typingUsers.join(', ')} typing</span>
                  <span className="flex gap-0.5 items-center justify-center shrink-0">
                    <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                    <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  </span>
                </span>
              ) : draftText ? (
                /* Draft Preview */
                <span className="text-[14px] leading-normal truncate flex items-center gap-1.5 font-sans">
                  <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 bg-accent/10 text-accent rounded border border-accent/20 shrink-0">
                    Draft
                  </span>
                  <span className="text-text-secondary italic truncate">{draftText}</span>
                </span>
              ) : (
                /* Standard Last Message Preview */
                <div className="flex items-center gap-1 min-w-0">
                  {isMe && chat.lastMessage?.status && (
                    <MessageStatusIndicator status={chat.lastMessage.status} />
                  )}
                  <span className="text-[14px] text-text-secondary truncate leading-normal font-sans">
                    {chat.lastMessage?.text || (chat.isGroup ? 'Initializing secure channel...' : 'Direct link ready.')}
                  </span>
                </div>
              )}
            </div>

            {/* Unread badge or Pin badge */}
            {unreadCount > 0 ? (
              <motion.span 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-bg-primary text-[11px] font-bold flex items-center justify-center shrink-0 shadow-lg shadow-accent/10"
              >
                {unreadCount}
              </motion.span>
            ) : null}
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default ChatListItem;
