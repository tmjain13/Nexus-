import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Image as ImageIcon, Heart, Sparkles, Loader2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCloseFriends } from '../hooks/useCloseFriends';
import { uploadFile } from '../services/storageService';
import { postStatus } from '../services/statusService';

interface StatusCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function StatusCreationModal({ isOpen, onClose, onSuccess }: StatusCreationModalProps) {
  const { user } = useAuth();
  const { list: closeFriends } = useCloseFriends();

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isCloseFriendsOnly, setIsCloseFriendsOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!user) return;
    if (!text.trim() && !selectedFile) {
      return;
    }

    setLoading(true);
    try {
      let mediaUrl = null;
      let statusType: 'text' | 'image' | 'video' = 'text';

      if (selectedFile) {
        mediaUrl = await uploadFile(selectedFile, 'statuses');
        statusType = selectedFile.type.startsWith('video') ? 'video' : 'image';
      }

      const content = mediaUrl || text;
      const audience = isCloseFriendsOnly ? 'close-friends' : 'public';
      
      // Map closeFriends to userIds array
      const visibleTo = isCloseFriendsOnly ? closeFriends.map(cf => cf.userId) : [];

      await postStatus(
        user.uid,
        user.displayName || 'Cadet',
        user.photoURL || '',
        statusType,
        content,
        audience,
        visibleTo
      );

      // Trigger standard system push notification if shared to Close Friends
      if (isCloseFriendsOnly && visibleTo.length > 0) {
        // Send simulated close friend story notifications (can log or invoke local triggers)
        console.log(`Sending Close Friends story notification to ${visibleTo.length} cadets.`);
      }

      onSuccess(`Status published to ${isCloseFriendsOnly ? 'Close Friends enclave' : 'All Contacts'} successfully.`);
      
      // Reset state and close
      setText('');
      setSelectedFile(null);
      setFilePreview(null);
      setIsCloseFriendsOnly(false);
      onClose();
    } catch (error) {
      console.error("Failed to post status:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest font-mono text-zinc-400">
              Post temporary status
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Text Input */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Broadcast a transient quantum wave status..."
            rows={3}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-2xl p-4 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors resize-none"
          />

          {/* Media Picker / Preview */}
          {filePreview ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center group">
              {selectedFile?.type.startsWith('video') ? (
                <video src={filePreview} controls className="w-full h-full object-contain" />
              ) : (
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
              )}
              {!loading && (
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="border-2 border-dashed border-slate-800 hover:border-amber-500/30 rounded-2xl py-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-950/40 transition-all cursor-pointer group"
            >
              <div className="p-2.5 bg-slate-800/60 rounded-xl text-zinc-500 group-hover:text-amber-400 group-hover:bg-amber-500/5 transition-colors">
                <ImageIcon size={18} />
              </div>
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300">
                Attach Image / Video
              </span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Audience Toggles */}
          <div className="flex flex-col gap-2 mt-1">
            <span className="text-[9px] font-bold uppercase tracking-widest font-mono text-zinc-500">
              Audience Protocol
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsCloseFriendsOnly(false)}
                disabled={loading}
                className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all text-left ${
                  !isCloseFriendsOnly
                    ? 'bg-amber-500/5 border-amber-500/30 text-amber-400 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 text-zinc-500 hover:text-zinc-300 hover:border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className={!isCloseFriendsOnly ? 'text-amber-400' : 'text-zinc-500'} />
                  <span className="text-[10px] font-bold font-mono tracking-wide uppercase">All Contacts</span>
                </div>
                <p className="text-[9px] font-mono leading-relaxed opacity-80">
                  Visible to everyone in your contacts array.
                </p>
              </button>

              <button
                onClick={() => setIsCloseFriendsOnly(true)}
                disabled={loading}
                className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all text-left relative ${
                  isCloseFriendsOnly
                    ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 text-zinc-500 hover:text-zinc-300 hover:border-slate-700/60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Heart size={12} className={isCloseFriendsOnly ? 'fill-emerald-400 text-emerald-400 animate-pulse' : 'text-zinc-500'} />
                  <span className="text-[10px] font-bold font-mono tracking-wide uppercase">Close Friends</span>
                </div>
                <p className="text-[9px] font-mono leading-relaxed opacity-80">
                  Shared only with your close enclave ({closeFriends.length}).
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/30 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 hover:bg-slate-800 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold font-mono uppercase tracking-widest rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handlePost}
            disabled={loading || (!text.trim() && !selectedFile)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-[10px] font-bold font-mono uppercase tracking-widest rounded-xl transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Publishing
              </>
            ) : (
              <>
                <Send size={11} />
                Publish
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
