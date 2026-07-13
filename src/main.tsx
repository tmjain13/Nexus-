import React, { StrictMode, Suspense } from 'react';
import {createRoot} from 'react-dom/client';

// Robust safety fallback for iframe/sandbox environments with blocked storage
let safeStorage: Storage;
const memoryStore: Record<string, string> = {};

safeStorage = {
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
  },
  setItem(key: string, value: string): void {
    memoryStore[key] = String(value);
  },
  removeItem(key: string): void {
    delete memoryStore[key];
  },
  clear(): void {
    for (const key in memoryStore) {
      delete memoryStore[key];
    }
  },
  key(index: number): string | null {
    const keys = Object.keys(memoryStore);
    return keys[index] || null;
  },
  get length(): number {
    return Object.keys(memoryStore).length;
  }
};

try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn("localStorage is blocked or unavailable. Registering in-memory fallback store:", e);
  
  // Try defining it on Window.prototype first (spec compliant place for getters)
  try {
    Object.defineProperty(Window.prototype, 'localStorage', {
      get() {
        return safeStorage;
      },
      configurable: true,
      enumerable: true
    });
  } catch (err) {
    console.warn("Unable to define Window.prototype.localStorage:", err);
  }

  // Try defining it on window instance
  try {
    Object.defineProperty(window, 'localStorage', {
      value: safeStorage,
      writable: true,
      configurable: true,
      enumerable: true
    });
  } catch (err) {
    console.warn("Unable to define window.localStorage property:", err);
  }

  // Also define on globalThis just in case some scripts access it directly
  try {
    (globalThis as any).localStorage = safeStorage;
  } catch (err) {
    console.warn("Unable to assign globalThis.localStorage:", err);
  }
}

// Empty fallback to prevent any runtime modification of getter-only window.fetch


import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-zinc-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"/></div>}>
      <App />
    </Suspense>
  </StrictMode>,
);

