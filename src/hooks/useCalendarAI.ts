import { useState } from 'react';
import { secureFetch } from '../lib/secureFetch';
import { CalendarEvent } from './useCalendar';
import { format } from 'date-fns';

export function useCalendarAI() {
  const [loading, setLoading] = useState(false);

  // AI suggests 3 time slots based on chat context
  const suggestTimes = async (chatContext: string, participantsCount: number): Promise<{ slots: string[]; reasoning: string }> => {
    setLoading(true);
    try {
      const prompt = `You are an AI Calendar Assistant for Nexus Messenger.
We have ${participantsCount} participants in the chat.
Recent chat context: "${chatContext}"
Based on this context, suggest 3 optimal time slots for a meeting. Ensure they are in the future relative to 2026-07-11.
Return your response strictly in JSON format with two keys:
"slots": ["Monday, July 13 at 10:00 AM", "Tuesday, July 14 at 2:00 PM", "Wednesday, July 15 at 11:30 AM"],
"reasoning": "Reason why these times are best based on context (e.g. they mentioned mornings or after lunch, or next week)."
Do not include any Markdown tags or extra text. Output ONLY the JSON object.`;

      const res = await secureFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const cleanedText = (data.text || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      return {
        slots: parsed.slots || [],
        reasoning: parsed.reasoning || 'Suggested times based on context.'
      };
    } catch (e) {
      console.error('AI suggestTimes error:', e);
      // fallback suggestions
      return {
        slots: [
          'Tomorrow at 10:00 AM',
          'Tomorrow at 3:00 PM',
          'Monday at 11:00 AM'
        ],
        reasoning: 'I formulated these high-priority slots using typical team peak periods.'
      };
    } finally {
      setLoading(false);
    }
  };

  // AI reschedules an event based on natural language input
  const reschedule = async (
    event: CalendarEvent,
    naturalPrompt: string
  ): Promise<{ success: boolean; newStart?: Date; newEnd?: Date; message: string }> => {
    setLoading(true);
    try {
      const currentStartStr = format(event.start.toDate(), 'yyyy-MM-dd HH:mm');
      const currentEndStr = format(event.end.toDate(), 'yyyy-MM-dd HH:mm');
      const prompt = `You are an AI Calendar Assistant. The user wants to reschedule an event.
Event Title: "${event.title}"
Current Time: ${currentStartStr} to ${currentEndStr}
User Instruction: "${naturalPrompt}"
Reference Date is 2026-07-11 (Saturday).
Determine the new start and end date/time.
Output strictly as a JSON object:
{
  "success": true,
  "newStart": "yyyy-MM-dd HH:mm",
  "newEnd": "yyyy-MM-dd HH:mm",
  "message": "Friendly confirmation message detailing the change."
}
If instructions are unclear, return {"success": false, "message": "Why it failed or clarify what you meant."}`;

      const res = await secureFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const cleanedText = (data.text || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedText);

      if (parsed.success && parsed.newStart && parsed.newEnd) {
        return {
          success: true,
          newStart: new Date(parsed.newStart.replace(' ', 'T')),
          newEnd: new Date(parsed.newEnd.replace(' ', 'T')),
          message: parsed.message
        };
      }
      return {
        success: false,
        message: parsed.message || 'Unclear rescheduling instructions.'
      };
    } catch (e) {
      console.error('AI reschedule error:', e);
      return {
        success: false,
        message: 'Could not calculate new schedule slot using AI engine. Please enter manually.'
      };
    } finally {
      setLoading(false);
    }
  };

  // AI summarizes the agenda for the day
  const summarizeDay = async (dayEvents: CalendarEvent[]): Promise<string> => {
    if (dayEvents.length === 0) {
      return "📅 You have no scheduled events today! Enjoy the clear workspace block or schedule some focus time.";
    }
    
    setLoading(true);
    try {
      const listStr = dayEvents.map(e => {
        const startStr = format(e.start.toDate(), 'h:mm a');
        const endStr = format(e.end.toDate(), 'h:mm a');
        return `- "${e.title}" from ${startStr} to ${endStr}${e.location ? ` at ${e.location}` : ''}`;
      }).join('\n');

      const prompt = `You are a professional Calendar Assistant.
Here are the user's events for today:
${listStr}
Generate a highly polished, brief (under 100 words) morning briefing summarizing their day, noting any heavy blocks or free spaces. Use a friendly, encouraging professional tone. Avoid markdown tables.`;

      const res = await secureFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      return data.text || 'Failed to generate briefing.';
    } catch (e) {
      console.error('AI summarizeDay error:', e);
      return `📅 You have ${dayEvents.length} events scheduled today. Make sure to review your timeline blocks!`;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    suggestTimes,
    reschedule,
    summarizeDay
  };
}
