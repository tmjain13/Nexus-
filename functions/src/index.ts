import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();

export const onNewMessage = onDocumentCreated(
  'chats/{chatId}/messages/{messageId}',
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const chatDoc = await admin.firestore().doc(`chats/${event.params.chatId}`).get();
    const participants: string[] = chatDoc.data()?.participants || [];
    const recipientId = participants.find(p => p !== message.senderId);
    if (!recipientId) return;

    const recipientDoc = await admin.firestore().doc(`users/${recipientId}`).get();
    const token = recipientDoc.data()?.fcmToken;
    if (!token) return;

    await admin.messaging().send({
      token,
      notification: {
        title: message.senderName || 'New message',
        body: message.text || (message.type ? `Sent an ${message.type}` : 'New activity'),
      },
      webpush: { fcmOptions: { link: `/chats/${event.params.chatId}` } },
    });
  }
);

export const onNewGroupMessage = onDocumentCreated(
  'groupChat/{chatId}/messages/{messageId}',
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const chatDoc = await admin.firestore().doc(`groupChat/${event.params.chatId}`).get();
    const participants: string[] = chatDoc.data()?.participants || [];
    
    for (const recipientId of participants) {
      if (recipientId === message.senderId) continue;
      
      const recipientDoc = await admin.firestore().doc(`users/${recipientId}`).get();
      const token = recipientDoc.data()?.fcmToken;
      if (!token) continue;

      try {
        await admin.messaging().send({
          token,
          notification: {
            title: message.senderName || 'New group message',
            body: message.text || (message.type ? `Sent an ${message.type}` : 'New activity'),
          },
          webpush: { fcmOptions: { link: `/chats/${event.params.chatId}` } },
        });
      } catch (err) {
        console.warn('Failed to send group push to token', token, err);
      }
    }
  }
);
