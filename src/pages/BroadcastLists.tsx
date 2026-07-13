import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BroadcastListManager } from '../components/BroadcastListManager';

export default function BroadcastLists() {
  const navigate = useNavigate();
  
  return (
    <div className="h-full w-full bg-black">
      <BroadcastListManager onBack={() => navigate('/chats')} />
    </div>
  );
}
