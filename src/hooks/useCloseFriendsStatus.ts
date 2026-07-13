import { useCallback } from 'react';
import { useCloseFriends } from './useCloseFriends';
import { usePeaceMode } from './usePeaceMode';

export function useCloseFriendsStatus() {
  const { isCloseFriend, list: closeFriendsList } = useCloseFriends();
  const { isEnabled: isPeaceModeActive, settings: peaceSettings } = usePeaceMode();

  // Checks if a friend should bypass Peace Mode when sending a message to me
  const bypassPeaceMode = useCallback((senderId: string) => {
    // If Peace Mode is not active, no auto-replies or blocking happen anyway
    if (!isPeaceModeActive) return true;

    // Close friends ALWAYS bypass Peace Mode auto-reply
    const isFriendCF = isCloseFriend(senderId);
    if (isFriendCF) return true;

    // If Peace Mode is configured to ONLY allow close friends, others DO NOT bypass
    if (peaceSettings?.onlyCloseFriendsMessage) {
      return false;
    }

    return false;
  }, [isPeaceModeActive, isCloseFriend, peaceSettings]);

  // Checks if we can view another user's story based on their visibility rules
  const canViewStory = useCallback((storyOwnerId: string, audience?: 'public' | 'close-friends', visibleTo?: string[], currentUserId?: string) => {
    // If it's my own story, I can always view it
    if (storyOwnerId === currentUserId) return true;

    // If audience is public or not specified, anyone can view
    if (!audience || audience === 'public') return true;

    // If audience is close friends, current user must be in visibleTo
    if (audience === 'close-friends') {
      return Array.isArray(visibleTo) && !!currentUserId && visibleTo.includes(currentUserId);
    }

    return true;
  }, []);

  return {
    isCloseFriend,
    bypassPeaceMode,
    canViewStory,
    closeFriendsCount: closeFriendsList.length
  };
}
