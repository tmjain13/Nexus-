import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScheduledMessagesScreen } from '../components/ScheduledMessagesScreen';

export default function ScheduledMessages() {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full bg-black">
      <ScheduledMessagesScreen onBack={() => navigate('/chats')} />
    </div>
  );
}
