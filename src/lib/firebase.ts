import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Resilient loader for firebase configuration to prevent build failures when file is omitted
const configs = (import.meta as any).glob('../../firebase-applet-config.json', { eager: true });
const rawConfig = (configs['../../firebase-applet-config.json'] as any)?.default || {};

const firebaseConfig = {
  apiKey: rawConfig.apiKey || "AIzaSyDummyKey_RequiredForInitialization",
  authDomain: rawConfig.authDomain || "peaceos-mock.firebaseapp.com",
  projectId: rawConfig.projectId || "peaceos-mock",
  storageBucket: rawConfig.storageBucket || "peaceos-mock.appspot.com",
  messagingSenderId: rawConfig.messagingSenderId || "123456789",
  appId: rawConfig.appId || "1:123456789:web:abcdef123456",
  measurementId: rawConfig.measurementId || "G-MOCK123456"
};

const app = initializeApp(firebaseConfig);

// Silence benign connection logs (like falling back to local offline cache mode)
setLogLevel('error');

// Initialize Firestore with basic persistence and highly stable long polling
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
});

export const auth = getAuth(app);
export const storage = getStorage(app);

// Messaging initialization
export let messaging: any = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
}).catch(() => {});

