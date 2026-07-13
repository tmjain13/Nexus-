import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export interface ScannedDocument {
  id: string;
  pages: {
    id: string;
    imageUrl: string;      // Original download URL
    processedUrl: string;  // Filtered download URL
    filter: string;
    rotation: number;
  }[];
  extractedText: string;
  documentType: 'receipt' | 'contract' | 'note' | 'business_card' | 'id' | 'whiteboard' | 'other';
  createdAt: any;
  createdBy: string;
  chatId?: string;
  metadata?: {
    merchant?: string;
    total?: number;
    date?: string;
    contact?: {
      name?: string;
      phone?: string;
      email?: string;
      company?: string;
    };
    keyTerms?: string[];
    dates?: string[];
    signaturesFound?: boolean;
    name?: string;
    idNumber?: string;
    expiryDate?: string;
  };
}

export function useDocumentManager() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'scanned_documents'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: ScannedDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        docs.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt : null,
        } as ScannedDocument);
      });
      setDocuments(docs);
      setLoading(false);
    }, (err) => {
      console.error("Firestore listening error in useDocumentManager:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Helper to convert base64 image data to a Blob to upload to Storage
  const uploadBase64Page = async (base64Data: string, filename: string): Promise<string> => {
    try {
      const response = await fetch(base64Data);
      const blob = await response.blob();
      const storageRef = ref(storage, `documents/${user?.uid}/${filename}_${Date.now()}.jpg`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (err) {
      console.error("Failed to upload page to Firebase Storage:", err);
      throw err;
    }
  };

  const saveDocument = async (
    rawPages: { id: string; imageUrl: string; processedUrl: string; filter: string; rotation: number }[],
    extractedText: string,
    documentType: ScannedDocument['documentType'],
    metadata?: any,
    chatId?: string
  ): Promise<string | null> => {
    if (!user) return null;
    setLoading(true);
    try {
      // 1. Upload pages to Firebase Storage to get reliable remote download URLs
      const uploadedPages = await Promise.all(
        rawPages.map(async (page, index) => {
          let imageUrl = page.imageUrl;
          let processedUrl = page.processedUrl;

          if (page.imageUrl.startsWith('data:')) {
            imageUrl = await uploadBase64Page(page.imageUrl, `page_${index}_orig`);
          }
          if (page.processedUrl.startsWith('data:')) {
            processedUrl = await uploadBase64Page(page.processedUrl, `page_${index}_proc`);
          } else if (page.processedUrl === page.imageUrl) {
            processedUrl = imageUrl;
          }

          return {
            id: page.id,
            imageUrl,
            processedUrl,
            filter: page.filter,
            rotation: page.rotation,
          };
        })
      );

      // 2. Write ScannedDocument to Firestore
      const docData = {
        pages: uploadedPages,
        extractedText,
        documentType,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        metadata: metadata || {},
        chatId: chatId || null,
      };

      const docRef = await addDoc(collection(db, 'scanned_documents'), docData);
      return docRef.id;
    } catch (err: any) {
      console.error("Failed to save document:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, 'scanned_documents', id));
      return true;
    } catch (err: any) {
      console.error("Failed to delete document:", err);
      setError(err.message);
      return false;
    }
  };

  return {
    documents,
    loading,
    error,
    saveDocument,
    deleteDocument
  };
}
