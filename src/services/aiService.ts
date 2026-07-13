import { secureFetch } from '../lib/secureFetch';

const MODEL_NAME = "gemini-3.5-flash";

export const getAIResponse = async (prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], chatType?: string) => {
  try {
    const res = await secureFetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, history, chatType }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Disconnected from My Messenger Core. Please try again later.";
  }
};

export const moderateContent = async (content: string): Promise<{ isToxic: boolean, reason: string }> => {
  try {
    const res = await secureFetch("/api/ai/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return { isToxic: data.isToxic, reason: data.reason };
  } catch (error) {
    console.error("Content moderation error:", error);
    return { isToxic: false, reason: "unavailable" };
  }
};

export const getSmartCompose = async (prompt: string): Promise<string> => {
  try {
    const res = await secureFetch("/api/ai/smart-compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.suggestion;
  } catch (error) {
    console.error("Smart Compose error:", error);
    return "";
  }
};

export const getSmartReplies = async (lastMessages: { text: string, senderId: string }[]): Promise<string[]> => {
  try {
    const res = await secureFetch("/api/ai/smart-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lastMessages }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("Smart replies error:", error);
    return ["Okay", "Cool", "Got it"];
  }
};

export const scanMessageForScams = async (text: string): Promise<{ isScam: boolean, riskLevel: string, reason: string }> => {
  try {
    const res = await secureFetch("/api/ai/scan-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("Scan message error:", error);
    return { isScam: false, riskLevel: "low", reason: "error" };
  }
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const res = await secureFetch("/api/ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLanguage }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.translation;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};

export interface ChatSummary {
  tldr: string;
  topics: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgency: 'high' | 'medium' | 'low';
  participationInfo?: string;
}

export const summarizeChat = async (messages: { senderId: string, senderName?: string, text: string }[]): Promise<ChatSummary> => {
  try {
    const res = await secureFetch("/api/ai/summarize-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("Summarize chat error:", error);
    throw error;
  }
};



