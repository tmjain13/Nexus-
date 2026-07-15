import { useState } from 'react';
import { secureFetch } from '../lib/secureFetch';

export interface OCRResult {
  text: string;
  confidence: number;
  documentType: 'receipt' | 'contract' | 'note' | 'business_card' | 'id' | 'whiteboard' | 'other';
  structure?: {
    headers?: string[];
    tables?: string[][];
  };
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
    signatureUrl?: string;
    name?: string;
    idNumber?: string;
    expiryDate?: string;
    confidence?: number;
  };
}

export function useOCR() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);

  const runOCR = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<OCRResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await secureFetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image, mimeType }),
      });

      if (!response.ok) {
        throw new Error(`OCR request failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      return data;
    } catch (err: any) {
      console.error('useOCR error:', err);
      const msg = err.message || 'An error occurred during text extraction.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    runOCR,
    loading,
    error,
    result,
    clearResult,
  };
}
