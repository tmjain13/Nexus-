import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  toggleTheme: () => void;
  messageLayout: 'expanded' | 'compact';
  setMessageLayout: (layout: 'expanded' | 'compact') => void;
  bubbleColor: string | null;
  setBubbleColor: (color: string | null) => void;
  primaryAccent: string;
  setPrimaryAccent: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'dark', 
  themeMode: 'dark',
  setThemeMode: () => {},
  toggleTheme: () => {},
  messageLayout: 'expanded',
  setMessageLayout: () => {},
  bubbleColor: null,
  setBubbleColor: () => {},
  primaryAccent: '#f59e0b',
  setPrimaryAccent: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('themeMode') as 'system' | 'light' | 'dark') || 'dark';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [messageLayout, setMessageLayoutState] = useState<'expanded' | 'compact'>(() => {
    return (localStorage.getItem('messageLayout') as 'expanded' | 'compact') || 'expanded';
  });

  const [bubbleColor, setBubbleColorState] = useState<string | null>(() => {
    return localStorage.getItem('bubbleColor');
  });

  const [primaryAccent, setPrimaryAccentState] = useState<string>(() => {
    return localStorage.getItem('primaryAccent') || '#f59e0b';
  });

  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      };
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setTheme(themeMode);
    }
  }, [themeMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--color-wa-primary', primaryAccent);
    
    // Parse hex to compute rgba equivalents
    try {
      const hex = primaryAccent.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 37;
      const g = parseInt(hex.substring(2, 4), 16) || 211;
      const b = parseInt(hex.substring(4, 6), 16) || 102;
      root.style.setProperty('--color-wa-primary-glow', `rgba(${r}, ${g}, ${b}, 0.15)`);
      root.style.setProperty('--color-wa-primary-glow-strong', `rgba(${r}, ${g}, ${b}, 0.3)`);
      root.style.setProperty('--color-wa-primary-rgb', `${r}, ${g}, ${b}`);
    } catch (e) {
      root.style.setProperty('--color-wa-primary-glow', 'rgba(37, 211, 102, 0.15)');
      root.style.setProperty('--color-wa-primary-glow-strong', 'rgba(37, 211, 102, 0.3)');
      root.style.setProperty('--color-wa-primary-rgb', '37, 211, 102');
    }
    
    localStorage.setItem('primaryAccent', primaryAccent);
  }, [primaryAccent]);

  const setMessageLayout = (layout: 'expanded' | 'compact') => {
    setMessageLayoutState(layout);
    localStorage.setItem('messageLayout', layout);
  };

  const setBubbleColor = (color: string | null) => {
    setBubbleColorState(color);
    if (color) {
      localStorage.setItem('bubbleColor', color);
    } else {
      localStorage.removeItem('bubbleColor');
    }
  };

  const setPrimaryAccent = (color: string) => {
    setPrimaryAccentState(color);
  };

  const setThemeMode = (mode: 'system' | 'light' | 'dark') => {
    setThemeModeState(mode);
    localStorage.setItem('themeMode', mode);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode,
      setThemeMode,
      toggleTheme: () => setThemeMode(theme === 'light' ? 'dark' : 'light'),
      messageLayout,
      setMessageLayout,
      bubbleColor,
      setBubbleColor,
      primaryAccent,
      setPrimaryAccent
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
