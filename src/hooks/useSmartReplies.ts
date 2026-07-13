import { useState, useEffect } from 'react';
import { getSmartReplies } from '../services/aiService';
import { useComposeSettings } from './useComposeSettings';
import { useAuth } from '../context/AuthContext';

export interface SmartReply {
  id: string;
  text: string;
  confidence: number;
}

export function useSmartReplies(chatId: string, lastMessage: any) {
  const { settings } = useComposeSettings();
  const { user } = useAuth();
  const [replies, setReplies] = useState<SmartReply[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // If smart replies are disabled, clear replies
    if (!settings.smartReplies) {
      setReplies([]);
      return;
    }

    // Do not show replies if there is no last message, or if the current user sent the last message
    if (!lastMessage || !user || lastMessage.senderId === user.uid) {
      setReplies([]);
      return;
    }

    // Do not show replies for system/status messages or attachments-only if they have no text
    if (!lastMessage.text || lastMessage.type === 'system' || lastMessage.type === 'sticker') {
      setReplies([]);
      return;
    }

    let isCancelled = false;
    const fetchReplies = async () => {
      setIsLoading(true);
      try {
        const lastMsgsContext = [{
          text: lastMessage.text,
          senderId: lastMessage.senderId
        }];

        const aiReplies = await getSmartReplies(lastMsgsContext);
        
        if (isCancelled) return;

        if (aiReplies && Array.isArray(aiReplies) && aiReplies.length > 0) {
          const formatted: SmartReply[] = aiReplies.slice(0, 3).map((replyText, idx) => ({
            id: `reply-${idx}-${Date.now()}`,
            text: replyText.trim(),
            confidence: 0.9 - idx * 0.1
          }));
          setReplies(formatted);
        } else {
          // Fallback replies
          setReplies([
            { id: 'fb-1', text: "Sounds good!", confidence: 0.8 },
            { id: 'fb-2', text: "Can we talk later?", confidence: 0.7 },
            { id: 'fb-3', text: "Thanks for letting me know!", confidence: 0.6 }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch smart replies:", err);
        if (!isCancelled) {
          setReplies([
            { id: 'fb-1', text: "Sounds good!", confidence: 0.8 },
            { id: 'fb-2', text: "Can we talk later?", confidence: 0.7 },
            { id: 'fb-3', text: "Thanks for letting me know!", confidence: 0.6 }
          ]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchReplies();

    return () => {
      isCancelled = true;
    };
  }, [chatId, lastMessage?.id, lastMessage?.text, lastMessage?.senderId, settings.smartReplies, user?.uid]);

  return {
    replies,
    isLoading
  };
}
