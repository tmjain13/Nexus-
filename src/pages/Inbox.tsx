import React from 'react';
import { UnifiedInbox } from '../components/email/UnifiedInbox';

export default function Inbox() {
  return (
    <div className="h-full w-full bg-slate-950" id="inbox-page-wrapper">
      <UnifiedInbox />
    </div>
  );
}
