export const NOTIFICATION_TONES = {
  Default: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  Chime: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  Signal: 'https://assets.mixkit.co/active_storage/sfx/2353/2353-preview.mp3',
  Transmission: 'https://assets.mixkit.co/active_storage/sfx/2352/2352-preview.mp3',
  Cyber: 'https://assets.mixkit.co/active_storage/sfx/2349/2349-preview.mp3',
  Alert: 'https://assets.mixkit.co/active_storage/sfx/2350/2350-preview.mp3',
  Ghost: 'https://assets.mixkit.co/active_storage/sfx/2351/2351-preview.mp3'
};

export type ToneType = keyof typeof NOTIFICATION_TONES | 'Silent';

export const playNotificationSound = (toneName: ToneType) => {
  if (toneName === 'Silent') return;
  
  const url = NOTIFICATION_TONES[toneName as keyof typeof NOTIFICATION_TONES] || NOTIFICATION_TONES.Default;
  const audio = new Audio(url);
  audio.volume = 0.5;
  audio.play().catch(err => console.warn('Audio playback failed:', err));
};
