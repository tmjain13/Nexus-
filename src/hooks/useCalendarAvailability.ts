import { useState, useEffect } from 'react';
import { useCalendar, CalendarEvent } from './useCalendar';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { addDays, startOfDay, endOfDay, format, isWithinInterval, parseISO } from 'date-fns';

export interface TimeSlot {
  start: Date;
  end: Date;
  status: 'free' | 'busy' | 'tentative';
}

export function useCalendarAvailability() {
  const { user } = useAuth();
  const { events } = useCalendar();
  const [freeSlots, setFreeSlots] = useState<TimeSlot[]>([]);

  // Calculate free slots for the next 7 days in 30-minute intervals from 9 AM to 5 PM (working hours)
  useEffect(() => {
    if (!events) return;

    const slots: TimeSlot[] = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const day = addDays(now, i);
      const startOfWork = new Date(day);
      startOfWork.setHours(9, 0, 0, 0);

      const endOfWork = new Date(day);
      endOfWork.setHours(17, 0, 0, 0);

      let current = new Date(startOfWork);
      while (current < endOfWork) {
        const slotEnd = new Date(current);
        slotEnd.setMinutes(current.getMinutes() + 30);

        // Check if there is any overlap with existing events
        let status: 'free' | 'busy' | 'tentative' = 'free';

        for (const evt of events) {
          const evtStart = evt.start.toDate();
          const evtEnd = evt.end.toDate();

          // Overlap condition
          if (
            (current >= evtStart && current < evtEnd) ||
            (slotEnd > evtStart && slotEnd <= evtEnd) ||
            (evtStart >= current && evtStart < slotEnd)
          ) {
            status = 'busy';
            // Mark tentative if any attendee or note suggests it (e.g., status is tentative)
            const myAttendee = evt.attendees.find(a => a.userId === user?.uid || a.email === user?.email);
            if (myAttendee?.status === 'tentative' || myAttendee?.status === 'pending') {
              status = 'tentative';
            }
            break;
          }
        }

        slots.push({
          start: new Date(current),
          end: slotEnd,
          status
        });

        current = slotEnd;
      }
    }

    setFreeSlots(slots);
  }, [events, user]);

  // Share availability with other participants as a chat message
  const shareAvailability = async (chatId: string) => {
    if (!user) return;

    // Filter free slots to show elegant suggestions for tomorrow and day after
    const tomorrow = addDays(new Date(), 1);
    const options = freeSlots
      .filter(slot => slot.status === 'free' && slot.start.getDate() === tomorrow.getDate())
      .slice(0, 3);

    const formattedList = options.map(opt => 
      `• ${format(opt.start, 'EEEE, MMM d @ h:mm a')} - ${format(opt.end, 'h:mm a')}`
    ).join('\n');

    const availabilityText = `📅 Here are my upcoming available time slots for tomorrow:\n\n${formattedList || "• No work hour slots available. Please suggest another time!"}\n\nTap on a slot in our availability grid to book directly!`;

    const isGroupColl = false; // check in ChatRoom
    // Add message with availability payload
    const msgRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(msgRef, {
      senderId: user.uid,
      text: availabilityText,
      type: 'text',
      status: 'sent',
      createdAt: serverTimestamp(),
      readBy: [user.uid],
      availabilityPayload: {
        slots: options.map(o => ({ start: o.start.toISOString(), end: o.end.toISOString() }))
      }
    });
  };

  // Find mutual free time across calendars of participants in a chat
  const findMutualTime = async (participantIds: string[]): Promise<TimeSlot[]> => {
    try {
      // Gather events from all participants
      const allParticipantsEvents: CalendarEvent[] = [];
      
      for (const uid of participantIds) {
        if (uid === user?.uid) {
          allParticipantsEvents.push(...events);
          continue;
        }
        // Fetch public events for user from Firestore
        const pEventsRef = collection(db, 'users', uid, 'events');
        const snap = await getDocs(pEventsRef);
        snap.forEach(d => {
          const data = d.data();
          allParticipantsEvents.push({
            id: d.id,
            ...data,
            start: data.start,
            end: data.end
          } as CalendarEvent);
        });
      }

      // Intersect free slots using gathered events
      const mutualSlots: TimeSlot[] = [];
      const now = new Date();

      for (let i = 0; i < 7; i++) {
        const day = addDays(now, i);
        const startOfWork = new Date(day);
        startOfWork.setHours(9, 0, 0, 0);
        const endOfWork = new Date(day);
        endOfWork.setHours(17, 0, 0, 0);

        let current = new Date(startOfWork);
        while (current < endOfWork) {
          const slotEnd = new Date(current);
          slotEnd.setMinutes(current.getMinutes() + 30);

          let isBusy = false;
          let isTentative = false;

          for (const evt of allParticipantsEvents) {
            const evtStart = evt.start.toDate();
            const evtEnd = evt.end.toDate();

            if (
              (current >= evtStart && current < evtEnd) ||
              (slotEnd > evtStart && slotEnd <= evtEnd) ||
              (evtStart >= current && evtStart < slotEnd)
            ) {
              isBusy = true;
              break;
            }
          }

          mutualSlots.push({
            start: new Date(current),
            end: slotEnd,
            status: isBusy ? 'busy' : 'free'
          });

          current = slotEnd;
        }
      }

      return mutualSlots;
    } catch (e) {
      console.error('Error finding mutual free slots:', e);
      return [];
    }
  };

  return {
    freeSlots,
    shareAvailability,
    findMutualTime
  };
}
