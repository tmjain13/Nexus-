import { useState } from 'react';
import { useSubscription } from './useSubscription';

export interface PremiumFeature {
  id: string;
  name: string;
  icon: string;
  isPremium: boolean;
  description: string;
}

export function usePremiumFeature(featureId: string) {
  const { isPremium } = useSubscription();
  const [showUpsell, setShowUpsell] = useState(false);

  // We define which feature IDs require premium.
  // By default, if the user has premium, nothing is locked.
  // If user does not have premium, these features are locked.
  const premiumFeatureIds = [
    'stickers',
    'custom-icon',
    'custom-theme',
    'ringtone',
    'chat-folders',
    'extra-pins'
  ];

  const isLocked = premiumFeatureIds.includes(featureId) && !isPremium;

  const triggerUpsell = () => {
    if (isLocked) {
      setShowUpsell(true);
      return true;
    }
    return false;
  };

  return {
    isLocked,
    showUpsell,
    setShowUpsell,
    triggerUpsell
  };
}
