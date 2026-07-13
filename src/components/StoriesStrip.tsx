import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Plus, Camera, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StoryItem {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  mediaUrl?: string;
  text?: string;
  views?: string[];
  createdAt?: any;
}

interface StoriesStripProps {
  statuses: StoryItem[];
  onStoryClick: (index: number) => void;
  onUploadClick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
}

export const StoriesStrip: React.FC<StoriesStripProps> = ({
  statuses,
  onStoryClick,
  onUploadClick,
  uploading = false,
}) => {
  const { user } = useAuth();

  return (
    <div id="nexus_stories_strip" className="px-4 py-3 select-none w-full">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sparkles size={11} className="text-accent" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted font-mono">
          Quantum Resonance / Stories
        </span>
      </div>

      <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth w-full">
        {/* "My Story" Add Card: 64px box (w-16 h-16) rounded-2xl */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-16 h-16 rounded-2xl bg-bg-elevated border border-border-subtle p-0.5 flex items-center justify-center cursor-pointer group">
            <button
              onClick={() => onUploadClick(null as any)}
              className="w-full h-full rounded-[12px] overflow-hidden bg-bg-primary flex flex-col items-center justify-center relative cursor-pointer"
              title="Post temporary quantum status"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="My Avatar"
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-all"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Camera size={18} className="text-text-muted" />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center">
                {uploading ? (
                  <span className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="bg-accent text-bg-primary p-1 rounded-lg shadow-md hover:scale-110 transition-transform">
                    <Plus size={10} strokeWidth={4} />
                  </div>
                )}
              </div>
            </button>
          </div>
          <span className="text-[10px] font-semibold text-text-secondary mt-1.5">My Status</span>
        </div>

        {/* Existing Friend Stories: 56px box (w-14 h-14) rounded-2xl */}
        {statuses.map((story, index) => {
          // Check if current user already viewed this story
          const isViewed = story.views?.includes(user?.uid || '');
          const isCloseFriendsStory = (story as any).audience === 'close-friends';

          return (
            <motion.button
              key={story.id}
              onClick={() => onStoryClick(index)}
              className="flex flex-col items-center shrink-0 cursor-pointer focus:outline-none relative"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {/* Outer ring pulsing if unread */}
              <div className={`w-14 h-14 rounded-2xl p-[2px] transition-all duration-300 ${
                isViewed 
                  ? isCloseFriendsStory
                    ? 'border-2 border-emerald-500/40 bg-bg-elevated'
                    : 'bg-bg-elevated border border-border-subtle' 
                  : isCloseFriendsStory
                    ? 'bg-gradient-to-tr from-emerald-500 via-green-400 to-emerald-300 animate-pulse'
                    : 'bg-gradient-to-tr from-accent to-orange-500 animate-pulse'
              }`}>
                <div className="w-full h-full rounded-[10px] overflow-hidden bg-bg-primary">
                  <img
                    src={story.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.userId}`}
                    alt={story.userName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[10px] font-medium text-text-secondary mt-1.5 max-w-[56px] truncate text-center">
                {story.userName.split(' ')[0]}
              </span>
            </motion.button>
          );
        })}

        {statuses.length === 0 && (
          <div className="flex items-center justify-center w-full py-4">
            <span className="text-xs text-text-muted italic font-mono uppercase tracking-widest">
              No active status transmissions.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesStrip;
