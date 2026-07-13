import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { generateKeyPair, importPrivateKey, importPublicKey, deriveSharedKey, decryptText, importSymmetricKey, encryptText } from '../lib/e2ee';
import { Shield, Sparkles, AlertTriangle, Clock, Edit, X, Check, History, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import EditHistoryModal from './EditHistoryModal';

interface GroupMessageBubbleProps {
  key?: any;
  message: any;
  chatId: string;
  isAdmin?: boolean;
  chatInfo?: any;
  memberProfiles?: any[];
}

const getSenderColor = (name: string) => {
  const colors = [
    'text-amber-500', 'text-blue-500', 'text-emerald-500', 'text-purple-500', 
    'text-rose-500', 'text-indigo-400', 'text-pink-500', 'text-cyan-400', 
    'text-violet-400', 'text-teal-500', 'text-orange-400'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Simple global cache for decrypted group messages to prevent constant recalculation
const decryptedGroupCache: { [messageId: string]: string } = {};

export default function GroupMessageBubble({ 
  message, 
  chatId, 
  isAdmin = false, 
  chatInfo = null, 
  memberProfiles = [] 
}: GroupMessageBubbleProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [text, setText] = useState<string>(message.text || '');
  const [isDecrypted, setIsDecrypted] = useState<boolean>(false);
  const [decryptionError, setDecryptionError] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  // Edit and history States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editInputText, setEditInputText] = useState<string>('');
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [hideHistoryByAdmin, setHideHistoryByAdmin] = useState<boolean>(false);

  const symKeyRef = useRef<any>(null);

  const isMe = message.senderId === user?.uid;
  const isSystem = message.type === 'system' || message.senderId === 'system';

  useEffect(() => {
    if (!message.isEncrypted) {
      setText(message.text || '');
      return;
    }

    if (decryptedGroupCache[message.id]) {
      setText(decryptedGroupCache[message.id]);
      setIsDecrypted(true);
      return;
    }

    const decryptGroupMessage = async () => {
      if (!user || isDecrypting) return;
      setIsDecrypting(true);
      try {
        const encryptedKeyForMe = message.encryptedKeys?.[user.uid];
        if (!encryptedKeyForMe) {
          throw new Error("No encrypted key found for this user");
        }

        // 1. Get my private key from stashed in-memory keys
        let myPrivKey = (window as any).e2ee_keys?.[`priv_${user.uid}`];
        if (!myPrivKey) {
          // If keys aren't stashed yet, try to trigger lazy load or warn
          throw new Error("Private key not stashed");
        }

        // 2. Fetch sender public key from group memberKeys subcollection or users collection
        let senderPubKeyStr = '';
        const memberKeySnap = await getDoc(doc(db, 'chats', chatId, 'memberKeys', message.senderId));
        if (memberKeySnap.exists()) {
          senderPubKeyStr = memberKeySnap.data().publicKey;
        } else {
          const userSnap = await getDoc(doc(db, 'users', message.senderId));
          if (userSnap.exists()) {
            senderPubKeyStr = userSnap.data().publicKey;
          }
        }

        if (!senderPubKeyStr) {
          throw new Error("Sender public key not found");
        }

        // 3. Import peer public key & derive ECDH shared key
        const senderPubKey = await importPublicKey(JSON.parse(senderPubKeyStr));
        const sharedKey = await deriveSharedKey(myPrivKey, senderPubKey);

        // 4. Decrypt the wrapped symmetric key
        const decryptedKeyJwkStr = await decryptText(encryptedKeyForMe, sharedKey);
        const decryptedKeyJwk = JSON.parse(decryptedKeyJwkStr);

        // 5. Import message symmetric key & decrypt actual message text
        const symmetricKey = await importSymmetricKey(decryptedKeyJwk);
        symKeyRef.current = symmetricKey;
        const rawMessageText = await decryptText(message.encryptedData, symmetricKey);

        decryptedGroupCache[message.id] = rawMessageText;
        setText(rawMessageText);
        setIsDecrypted(true);
        setDecryptionError(false);
      } catch (err) {
        console.warn(`[Group E2EE] Decryption failed for message ${message.id}:`, err);
        setDecryptionError(true);
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptGroupMessage();
  }, [message, chatId, user]);

  // Update text when the message doc is modified in Firestore
  useEffect(() => {
    if (!message.isEncrypted) {
      setText(message.text || '');
    } else if (isDecrypted && message.encryptedData && symKeyRef.current) {
      decryptText(message.encryptedData, symKeyRef.current)
        .then((rawText) => {
          decryptedGroupCache[message.id] = rawText;
          setText(rawText);
        })
        .catch(console.warn);
    }
  }, [message.text, message.encryptedData, isDecrypted]);

  const timestamp = message.createdAt?.toDate ? message.createdAt.toDate() : new Date();
  const timeString = format(timestamp, 'h:mm a');

  // Render System messages (centered, minimalist, elegant)
  if (isSystem) {
    return (
      <div className="flex justify-center w-full my-4">
        <div className={cn(
          "px-4.5 py-1.5 rounded-full text-[10px] font-sans font-bold tracking-wider uppercase border max-w-md text-center shadow-sm flex items-center gap-1.5",
          isDark 
            ? "bg-zinc-900/40 border-zinc-900/60 text-zinc-500" 
            : "bg-zinc-50 border-zinc-200 text-zinc-550"
        )}>
          <Clock size={11} className="shrink-0" />
          <span>{message.text}</span>
        </div>
      </div>
    );
  }

  const senderAvatar = message.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderName || message.senderId}`;

  // Check if message is a sticker
  const isSticker = message.type === 'sticker';

  // Check if user is @mentioned in the message text
  const isMentioned = !isMe && user?.displayName && text.includes(`@${user.displayName}`);

  const getEditedIndicatorText = () => {
    if (!message.isEdited) return null;
    
    // Check for admin/editor info
    const edits = message.edits || [];
    if (edits.length > 0) {
      const lastEdit = edits[edits.length - 1];
      if (lastEdit.editedByAdmin) {
        return 'edited by Admin';
      }
      if (lastEdit.editedBy && lastEdit.editedBy !== message.senderId) {
        const p = memberProfiles?.find(m => m.uid === lastEdit.editedBy || m.id === lastEdit.editedBy);
        return `edited by ${p?.displayName || 'Moderator'}`;
      }
    }
    
    if (message.editedByAdmin) {
      return 'edited by Admin';
    }
    
    return 'edited';
  };

  const handleSaveEdit = async () => {
    if (!editInputText.trim()) return;
    try {
      // Check edit limit
      const currentEdits = message.edits || [];
      if (currentEdits.length >= 5) {
        alert("Edit limit reached (max 5 edits per transmission)");
        return;
      }

      let newEncryptedData: any = undefined;
      let textToStore = editInputText.trim();

      // Encrypt if original was encrypted and we have key stashed
      if (message.isEncrypted && symKeyRef.current) {
        newEncryptedData = await encryptText(editInputText.trim(), symKeyRef.current);
        textToStore = "[Encrypted Group Message]";
      }

      // Filter existing edits to auto-delete edits older than 90 days
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const validEdits = currentEdits.filter((edit: any) => {
        const editTime = edit.editedAt?.toDate 
          ? edit.editedAt.toDate().getTime() 
          : new Date(edit.editedAt).getTime();
        return editTime >= ninetyDaysAgo;
      });

      const updatePayload: any = {};
      if (!message.originalText) {
        updatePayload.originalText = message.text || '';
        if (message.isEncrypted && message.encryptedData) {
          updatePayload.originalEncryptedData = message.encryptedData;
        }
      }

      const newEdit: any = {
        text: message.isEncrypted ? "[Encrypted Group Message]" : message.text,
        editedAt: new Date(),
        editedBy: user?.uid || '',
        editNumber: validEdits.length + 1,
      };

      if (message.isEncrypted && message.encryptedData) {
        newEdit.encryptedData = message.encryptedData;
      }

      const isAdminEdit = !isMe && isAdmin;
      if (isAdminEdit) {
        newEdit.editedByAdmin = true;
      }

      updatePayload.text = textToStore;
      updatePayload.isEdited = true;
      updatePayload.editedAt = new Date();
      updatePayload.edits = [...validEdits, newEdit];

      if (newEncryptedData) {
        updatePayload.encryptedData = newEncryptedData;
      }

      if (isAdminEdit) {
        updatePayload.editedByAdmin = true;
        if (hideHistoryByAdmin) {
          updatePayload.hideHistory = true;
        }
      }

      const msgRef = doc(db, 'groupChat', chatId, 'messages', message.id);
      await updateDoc(msgRef, updatePayload);

      setIsEditing(false);
      setEditInputText('');
    } catch (err: any) {
      console.error("Save edit failed:", err);
      alert(err.message || "Failed to edit message");
    }
  };

  const editedIndicator = getEditedIndicatorText();

  return (
    <div className={cn(
      "flex gap-3 max-w-[85%] md:max-w-[70%] my-3.5 items-end relative group/bubble-container",
      isMe ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      
      {/* Sender Avatar */}
      {!isMe && (
        <img
          src={senderAvatar}
          alt={message.senderName}
          className="w-8.5 h-8.5 rounded-full object-cover shrink-0 border border-zinc-500/10 shadow-sm"
        />
      )}

      {/* Message Balloon Wrapper */}
      <div className="flex flex-col space-y-0.5 relative">
        
        {/* Sender Name (Non-Me only) */}
        {!isMe && (
          <span className={cn(
            "text-[10px] font-bold tracking-tight px-1.5",
            getSenderColor(message.senderName || 'Anonymous')
          )}>
            {message.senderName || 'Anonymous'}
          </span>
        )}

        {/* Message Options Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "absolute z-50 bg-zinc-950/95 border border-zinc-800 backdrop-blur-xl rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 min-w-[150px]",
                isMe ? "right-0 bottom-full mb-1.5" : "left-0 bottom-full mb-1.5"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Option: Edit message (if me, or if admin) */}
              {((isMe && message.type !== 'sticker' && message.type !== 'image' && message.type !== 'video') || isAdmin) && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditInputText(text);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-300 hover:text-amber-500 font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-900 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>Edit message</span>
                  <Edit size={12} className="text-amber-500" />
                </button>
              )}

              {/* Option: View Revision History */}
              {message.isEdited && !message.hideHistory && (
                <button
                  onClick={() => {
                    setShowHistoryModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-zinc-300 hover:text-blue-400 font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-900 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>History Log</span>
                  <History size={12} className="text-blue-500" />
                </button>
              )}

              <button
                onClick={() => setShowMenu(false)}
                className="w-full text-left px-3 py-2 text-zinc-500 font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-900 rounded-xl transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Dismiss</span>
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Balloon */}
        <div 
          onClick={() => {
            if (!isEditing) setShowMenu(!showMenu);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (!isEditing) setShowMenu(!showMenu);
          }}
          className={cn(
            "rounded-2xl border transition-all duration-300 relative shadow-sm cursor-pointer select-none",
            isSticker 
              ? "bg-transparent border-none shadow-none p-1" 
              : isMe
                ? (isDark 
                    ? "bg-amber-500/15 border-amber-500/20 text-zinc-100 rounded-br-sm" 
                    : "bg-amber-50 border-amber-100 text-amber-950 rounded-br-sm")
                : (isDark 
                    ? "bg-zinc-900/40 border-zinc-850 text-zinc-100 rounded-bl-sm" 
                    : "bg-white border-zinc-200 text-zinc-850 rounded-bl-sm"),
            isMentioned && "ring-2 ring-amber-500 ring-offset-2 ring-offset-black/20 animate-pulse",
            !isSticker && "px-4 py-3",
            message.isEdited && "border-l-2 border-l-amber-500 pl-3.5"
          )}
        >
          
          {/* Decryption status badges */}
          {message.isEncrypted && !isSticker && (
            <div className="flex items-center gap-1 mb-1 text-[9px] uppercase font-bold tracking-wider text-emerald-500">
              <Shield size={10} />
              <span>E2EE Node Sec</span>
            </div>
          )}

          {/* Decryption Failure Fallback */}
          {decryptionError ? (
            <div className="flex items-center gap-2 text-xs text-amber-500 font-medium py-1">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Message encrypted (Key handshake pending)</span>
            </div>
          ) : isSticker ? (
            <div className="relative group">
              <img
                src={message.mediaUrl}
                alt="Sticker"
                className="w-32 h-32 md:w-40 md:h-40 object-contain hover:scale-105 transition-transform"
              />
              <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-zinc-400">
                STK
              </span>
            </div>
          ) : message.type === 'image' ? (
            <div className="space-y-2">
              <img src={message.mediaUrl} alt="Upload" className="rounded-xl max-w-full max-h-72 object-cover border border-zinc-500/10" />
              {text && <p className="text-xs leading-relaxed break-words">{text}</p>}
            </div>
          ) : isEditing ? (
            <div className="flex flex-col gap-2 min-w-[220px] py-1" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editInputText}
                onChange={(e) => setEditInputText(e.target.value)}
                rows={2}
                className="w-full bg-black/20 dark:bg-zinc-950/40 text-zinc-100 placeholder-zinc-500 rounded-xl px-3 py-2 text-sm border border-zinc-800 focus:outline-none focus:border-amber-500 resize-none font-sans"
                placeholder="Edit your group message..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
              />
              {isAdmin && !isMe && (
                <label className="flex items-center gap-1.5 cursor-pointer mt-1 pl-1">
                  <input
                    type="checkbox"
                    checked={hideHistoryByAdmin}
                    onChange={(e) => setHideHistoryByAdmin(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-950/40 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Hide Revision History</span>
                </label>
              )}
              <div className="flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditInputText('');
                  }}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer text-xs font-mono font-bold uppercase tracking-widest flex items-center gap-1"
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono transition-all cursor-pointer text-xs uppercase tracking-widest flex items-center gap-1"
                >
                  <Check size={12} /> Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-relaxed break-words whitespace-pre-wrap select-text">
              {/* Highlight @mentions in text */}
              {text.split(/(\s+)/).map((part, i) => {
                if (part.startsWith('@')) {
                  return (
                    <span key={i} className="bg-amber-500/10 text-amber-500 px-1 py-0.5 rounded font-semibold">
                      {part}
                    </span>
                  );
                }
                return part;
              })}
            </p>
          )}

          {/* Time & Receipt Block */}
          {!isSticker && !isEditing && (
            <div className="flex items-center justify-end gap-1.5 mt-2 text-[9px] text-zinc-500 font-mono">
              {editedIndicator && (
                <div className="relative group/edit-lbl inline-block mr-1">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!message.hideHistory) {
                        setShowHistoryModal(true);
                      }
                    }}
                    className={cn(
                      "font-bold text-amber-500 uppercase tracking-widest hover:underline cursor-pointer",
                      message.hideHistory && "cursor-not-allowed text-zinc-600 hover:no-underline"
                    )}
                  >
                    {editedIndicator}
                  </span>
                  
                  {/* Tooltip on hover */}
                  {!message.hideHistory && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/edit-lbl:block bg-zinc-950 text-zinc-300 text-[10px] font-mono p-2 rounded-lg border border-zinc-800 shadow-xl z-[60] whitespace-nowrap pointer-events-none">
                      Revisions: {message.edits?.length || 1} {message.edits?.length === 1 ? 'change' : 'changes'}
                      {message.editedAt && ` • Last edit: ${format(message.editedAt?.toDate ? message.editedAt.toDate() : new Date(message.editedAt), 'h:mm a')}`}
                    </div>
                  )}
                </div>
              )}
              <span>{timeString}</span>
              {isMe && message.isEncrypted && (
                <Shield size={8} className="text-emerald-500/70" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit History Modal Portal Trigger */}
      <EditHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        messageId={message.id}
        chatId={chatId}
        isGroup={true}
        sharedKey={symKeyRef.current}
        userId={user?.uid || ''}
        isAdmin={isAdmin}
        groupParticipants={memberProfiles}
      />
    </div>
  );
}
