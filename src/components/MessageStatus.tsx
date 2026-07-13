import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { usePeaceMode } from '../hooks/usePeaceMode';

interface Participant {
  uid: string;
  displayName?: string;
  photoURL?: string;
}

interface MessageStatusProps {
  status: 'sent' | 'delivered' | 'read' | 'sending' | string;
  readBy?: Record<string, any>;
  senderId?: string;
  isGroup?: boolean;
  groupParticipants?: Participant[];
}

export const MessageStatus: React.FC<MessageStatusProps> = ({
  status,
  readBy,
  senderId,
  isGroup = false,
  groupParticipants = [],
}) => {
  const { isEnabled: isPeaceModeActive } = usePeaceMode();

  if (isGroup) {
    const readers = Object.keys(readBy || {}).filter(uid => uid !== senderId);
    if (readers.length === 0) {
      return <Check size={14} className="text-zinc-400" title="Sent" />;
    }
    const displayedReaders = readers.slice(0, 3);
    const extraCount = readers.length - displayedReaders.length;

    return (
      <div className="flex items-center -space-x-1 ml-1" title={`Read by ${readers.length} participant(s)`}>
        {displayedReaders.map((uid) => {
          const profile = groupParticipants.find((p) => p.uid === uid);
          const photoURL = profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName || 'U'}&background=random`;
          return (
            <img
              key={uid}
              src={photoURL}
              alt={profile?.displayName || 'User'}
              className="w-3.5 h-3.5 rounded-full border border-zinc-900/50 object-cover"
              referrerPolicy="no-referrer"
            />
          );
        })}
        {extraCount > 0 && (
          <span className="text-[8px] font-bold text-zinc-900 bg-[#f59e0b] rounded-full px-1 min-w-[12px] text-center border border-zinc-900/50">
            +{extraCount}
          </span>
        )}
      </div>
    );
  }

  // Hide read receipts when Peace Mode is enabled
  if (isPeaceModeActive) {
    return <Check size={14} className="text-zinc-400" title="Sent" />;
  }

  if (status === 'read') {
    return <CheckCheck size={14} className="text-[#3b82f6]" title="Read" />;
  } else if (status === 'delivered') {
    return <CheckCheck size={14} className="text-zinc-400" title="Delivered" />;
  } else {
    return <Check size={14} className="text-zinc-400" title="Sent" />;
  }
};

