import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, HelpCircle } from 'lucide-react';
import { ReelFeed } from '../components/ReelFeed';
import { ReelCreator } from '../components/ReelCreator';

export const ReelsPage: React.FC = () => {
  const navigate = useNavigate();
  const [creatorActive, setCreatorActive] = useState(false);

  return (
    <div id="enclave_reels_page" className="h-screen w-full bg-black text-white flex flex-col select-none relative">
      
      {/* Top sticky back-button strip (desktop layout helpers) */}
      <div className="absolute top-4 left-4 z-40 pointer-events-auto">
        <button
          onClick={() => navigate('/chats')}
          className="flex items-center gap-1.5 px-3 py-2 bg-black/60 backdrop-blur-md hover:bg-black/80 text-zinc-300 hover:text-white text-xs font-bold rounded-xl border border-zinc-800/40 transition-all cursor-pointer shadow-lg"
          title="Return to secure messenger"
        >
          <ArrowLeft size={14} />
          Chats
        </button>
      </div>

      {/* Main vertical viewer */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <ReelFeed 
          onCreateReelClick={() => setCreatorActive(true)}
        />
      </div>

      {/* Full-screen Studio camera uploader/editor overlay */}
      {creatorActive && (
        <ReelCreator 
          onClose={() => setCreatorActive(false)}
          onPublishSuccess={() => {
            setCreatorActive(false);
            // Refresh feed or trigger simple state update alert
            alert("✨ Secure video packet transmitted successfully to Enclave Node!");
          }}
        />
      )}

    </div>
  );
};

export default ReelsPage;
