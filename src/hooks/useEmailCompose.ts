import { useState } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandlers';
import { EmailMessage, EmailThread, EmailAttachment } from './useEmailInbox';

export function useEmailCompose() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  const sendEmail = async (params: {
    accountId: string;
    senderEmail: string;
    senderName: string;
    to: { name: string; email: string }[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    bodyHtml?: string;
    attachments: EmailAttachment[];
    replyToThreadId?: string;
  }) => {
    if (!user) throw new Error("User must be authenticated");
    setSending(true);

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const threadId = params.replyToThreadId || `thread_${Date.now()}`;
    const path = `users/${user.uid}/emailThreads/${threadId}`;

    const newMsg: EmailMessage = {
      id: messageId,
      accountId: params.accountId,
      threadId,
      subject: params.subject,
      from: { name: params.senderName, email: params.senderEmail },
      to: params.to,
      cc: params.cc || [],
      bcc: params.bcc || [],
      body: params.body,
      bodyHtml: params.bodyHtml || `<p>${params.body.replace(/\n/g, '<br>')}</p>`,
      attachments: params.attachments,
      isRead: true, // outgoing messages are read
      isStarred: false,
      labels: ['Sent'],
      receivedAt: new Date()
    };

    try {
      if (params.replyToThreadId) {
        // Appending message to existing thread
        const threadRef = doc(db, `users/${user.uid}/emailThreads`, params.replyToThreadId);
        const threadSnap = await getDoc(threadRef);
        
        if (threadSnap.exists()) {
          const threadData = threadSnap.data() as EmailThread;
          const currentMessages = threadData.messages || [];
          const updatedMessages = [
            ...currentMessages.map((m: any) => ({
              ...m,
              receivedAt: m.receivedAt?.toDate ? m.receivedAt.toDate() : new Date(m.receivedAt)
            })),
            newMsg
          ];
          
          // Ensure sender email is added to participant string list
          const formattedTo = params.to.map(t => `${t.name} <${t.email}>`);
          const currentParticipants = threadData.participants || [];
          const newParticipants = Array.from(new Set([...currentParticipants, ...formattedTo, `${params.senderName} <${params.senderEmail}>`]));

          await updateDoc(threadRef, {
            messages: updatedMessages,
            participants: newParticipants,
            lastMessageAt: serverTimestamp(),
            isUnread: false // Since the user just replied, the thread is read
          });
        }
      } else {
        // Creating a new thread
        const threadRef = doc(db, `users/${user.uid}/emailThreads`, threadId);
        const newThread: EmailThread = {
          id: threadId,
          subject: params.subject,
          participants: [
            `${params.senderName} <${params.senderEmail}>`,
            ...params.to.map(t => `${t.name} <${t.email}>`)
          ],
          messages: [newMsg],
          lastMessageAt: new Date(),
          isUnread: false
        };

        await setDoc(threadRef, newThread);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setSending(false);
    }
  };

  return {
    sendEmail,
    sending
  };
}
