import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { decryptText } from '../lib/e2ee';
import { MessageEdit } from './useMessageEdit';

export interface FormattedEditHistory {
  original: string;
  edits: {
    text: string;
    editedAt: any;
    editedBy: string;
    editNumber: number;
    editedByAdmin?: boolean;
  }[];
  current: string;
  isLoading: boolean;
  error: string | null;
}

export function useEditHistory(
  messageId: string,
  chatIdParam?: string,
  isGroupParam?: boolean,
  sharedKey?: any
) {
  const { chatId: urlChatId } = useParams<{ chatId: string }>();
  const chatId = chatIdParam || urlChatId || '';
  
  // Group chats usually have separate collection target, detect or pass it
  const isGroup = isGroupParam !== undefined ? isGroupParam : false;
  const targetCollection = isGroup ? 'groupChat' : 'chats';

  const [history, setHistory] = useState<FormattedEditHistory>({
    original: '',
    edits: [],
    current: '',
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!chatId || !messageId) {
      setHistory((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Missing chatId or messageId',
      }));
      return;
    }

    const msgRef = doc(db, targetCollection, chatId, 'messages', messageId);

    const unsubscribe = onSnapshot(
      msgRef,
      async (docSnap) => {
        if (!docSnap.exists()) {
          setHistory((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Message not found',
          }));
          return;
        }

        const data = docSnap.data();

        // If history is hidden by admin, we don't show the edits
        if (data.hideHistory) {
          setHistory({
            original: '[History Hidden by Administrator]',
            edits: [],
            current: data.text || '',
            isLoading: false,
            error: null,
          });
          return;
        }

        try {
          // Decrypt current text if encrypted
          let currentText = data.text || '';
          if (data.isEncrypted && data.encryptedData && sharedKey) {
            try {
              currentText = await decryptText(data.encryptedData as any, sharedKey as any);
            } catch (err) {
              currentText = '[Decryption Failed]';
            }
          }

          // Decrypt original text if encrypted
          let originalText = data.originalText || '';
          if (data.isEncrypted && data.originalEncryptedData && sharedKey) {
            try {
              originalText = await decryptText(data.originalEncryptedData as any, sharedKey as any);
            } catch (err) {
              originalText = '[Decryption Failed]';
            }
          } else if (data.originalText) {
            originalText = data.originalText;
          }

          // Decrypt each edit's text in history
          const rawEdits: MessageEdit[] = data.edits || [];
          const decryptedEdits = await Promise.all(
            rawEdits.map(async (edit) => {
              let editText = edit.text || '';
              if (data.isEncrypted && edit.encryptedData && sharedKey) {
                try {
                  editText = await decryptText(edit.encryptedData as any, sharedKey as any);
                } catch (err) {
                  editText = '[Decryption Failed]';
                }
              } else if (edit.text) {
                editText = edit.text;
              }

              return {
                text: editText,
                editedAt: edit.editedAt,
                editedBy: edit.editedBy,
                editNumber: edit.editNumber,
                editedByAdmin: edit.editedByAdmin,
              };
            })
          );

          setHistory({
            original: originalText || currentText,
            edits: decryptedEdits,
            current: currentText,
            isLoading: false,
            error: null,
          });
        } catch (err: any) {
          console.error("Error processing edit history:", err);
          setHistory((prev) => ({
            ...prev,
            isLoading: false,
            error: err.message || 'Error processing history',
          }));
        }
      },
      (err) => {
        console.error("Subscription error in useEditHistory:", err);
        setHistory((prev) => ({
          ...prev,
          isLoading: false,
          error: err.message,
        }));
      }
    );

    return () => unsubscribe();
  }, [chatId, messageId, targetCollection, sharedKey]);

  return history;
}
