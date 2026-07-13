import { useState, useEffect } from 'react';

export interface ComposeSettings {
  enabled: boolean;
  smartReplies: boolean;
  learnStyle: boolean;
  applyTo: 'all' | 'work' | 'personal';
}

const DEFAULT_SETTINGS: ComposeSettings = {
  enabled: true,
  smartReplies: true,
  learnStyle: false,
  applyTo: 'all',
};

export function useComposeSettings() {
  const [settings, setSettings] = useState<ComposeSettings>(() => {
    try {
      const saved = localStorage.getItem('nexus_compose_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to read compose settings:", e);
    }
    return DEFAULT_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<ComposeSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('nexus_compose_settings', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save compose settings:", e);
      }
      return updated;
    });
  };

  return { settings, updateSettings };
}
