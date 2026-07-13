import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { encryptText } from '../lib/e2ee';

export interface MessageEdit {
  text: string;
  encryptedData?: string;
  editedAt: any;
  editedBy: string;
  editNumber: number;
  editedByAdmin?: boolean;
}

export function useMessageEdit(chatId: string, messageId: string, isGroup: boolean = false) {
  const targetCollection = isGroup ? 'groupChat' : 'chats';

  const edit = async (
    newText: string,
    userId: string,
    sharedKey: any = null,
    isAdminEdit: boolean = false,
    hideHistoryFromMembers: boolean = false
  ) => {
    try {
      const msgRef = doc(db, targetCollection, chatId, 'messages', messageId);
      const msgSnap = await getDoc(msgRef);

      if (!msgSnap.exists()) {
        throw new Error("Message does not exist.");
      }

      const msgData = msgSnap.data();

      // Enforce edit limit (max 5 edits)
      const currentEdits: MessageEdit[] = msgData.edits || [];
      if (currentEdits.length >= 5) {
        throw new Error("Edit limit reached");
      }

      // Check ownership (only sender can edit, or admin in group)
      const isSender = msgData.senderId === userId;
      if (!isSender && !isAdminEdit) {
        throw new Error("Unauthorized to edit this message");
      }

      // Handle E2EE if message is encrypted
      let encryptedData: any;
      let textToStore = newText;

      if (msgData.isEncrypted && sharedKey) {
        encryptedData = await encryptText(newText, sharedKey);
        textToStore = "[Encrypted Message]";
      }

      // Filter existing edits to auto-delete edits older than 90 days
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const validEdits = currentEdits.filter((edit) => {
        const editTime = edit.editedAt?.toDate 
          ? edit.editedAt.toDate().getTime() 
          : new Date(edit.editedAt).getTime();
        return editTime >= ninetyDaysAgo;
      });

      // Prepare original content fields if first edit
      const updatePayload: any = {};
      if (!msgData.originalText) {
        updatePayload.originalText = msgData.text || '';
        if (msgData.isEncrypted && msgData.encryptedData) {
          updatePayload.originalEncryptedData = msgData.encryptedData;
        }
      }

      // Construct the new edit log entry
      const newEdit: MessageEdit = {
        text: msgData.isEncrypted ? "[Encrypted Message]" : msgData.text,
        editedAt: serverTimestamp(),
        editedBy: userId,
        editNumber: validEdits.length + 1,
      };

      if (msgData.isEncrypted && msgData.encryptedData) {
        newEdit.encryptedData = msgData.encryptedData;
      }

      if (isAdminEdit) {
        newEdit.editedByAdmin = true;
      }

      const updatedEdits = [...validEdits, newEdit];

      updatePayload.text = textToStore;
      updatePayload.isEdited = true;
      updatePayload.editedAt = serverTimestamp();
      updatePayload.edits = updatedEdits;

      if (encryptedData) {
        updatePayload.encryptedData = encryptedData;
      }

      if (isAdminEdit) {
        updatePayload.editedByAdmin = true;
        if (hideHistoryFromMembers) {
          updatePayload.hideHistory = true;
        }
      }

      await updateDoc(msgRef, updatePayload);

      // Create a subtle "Message edited" system notification message
      try {
        const systemMsgRef = doc(db, targetCollection, chatId, 'messages', `${messageId}_edited_sys`);
        await updateDoc(systemMsgRef, {
          text: `Message edited`,
          type: 'system',
          createdAt: serverTimestamp()
        }).catch(() => {});
      } catch (e) {
        // Ignore if system message document doesn't exist
      }

      return { success: true };
    } catch (error: any) {
      console.error("useMessageEdit error:", error);
      throw error;
    }
  };

  const restoreOriginal = async (userId: string, isAdmin: boolean = false) => {
    try {
      const msgRef = doc(db, targetCollection, chatId, 'messages', messageId);
      const msgSnap = await getDoc(msgRef);

      if (!msgSnap.exists()) {
        throw new Error("Message does not exist.");
      }

      const msgData = msgSnap.data();

      // Access control: admin only in groups, or original sender in 1:1
      const isSender = msgData.senderId === userId;
      if (!isSender && !isAdmin) {
        throw new Error("Unauthorized to restore original message");
      }

      if (!msgData.originalText) {
        throw new Error("No original version to restore");
      }

      const updatePayload: any = {
        text: msgData.originalText,
        isEdited: false,
        editedAt: null,
        edits: [],
        originalText: null,
      };

      if (msgData.originalEncryptedData) {
        updatePayload.encryptedData = msgData.originalEncryptedData;
        updatePayload.originalEncryptedData = null;
      }

      if (msgData.editedByAdmin) {
        updatePayload.editedByAdmin = null;
      }
      if (msgData.hideHistory) {
        updatePayload.hideHistory = null;
      }

      await updateDoc(msgRef, updatePayload);
      return { success: true };
    } catch (error: any) {
      console.error("Restore original error:", error);
      throw error;
    }
  };

  return { edit, restoreOriginal };
}
