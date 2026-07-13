import { useState, useEffect } from 'react';

export interface LayoutConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  sidebarCollapsed: boolean;
  chatListWidth: number;
}

export function useLayout() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('nexus_sidebar_collapsed');
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  const [chatListWidth, setChatListWidth] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('nexus_chat_list_width');
      return stored ? parseInt(stored, 10) : 360;
    }
    return 360;
  });

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const toggleSidebar = () => {
    setSidebarCollapsed((prev: boolean) => {
      const newVal = !prev;
      localStorage.setItem('nexus_sidebar_collapsed', JSON.stringify(newVal));
      return newVal;
    });
  };

  const updateChatListWidth = (newWidth: number) => {
    const clamped = Math.max(280, Math.min(500, newWidth));
    setChatListWidth(clamped);
    localStorage.setItem('nexus_chat_list_width', clamped.toString());
  };

  return {
    layout: {
      isMobile,
      isTablet,
      isDesktop,
      sidebarCollapsed,
      chatListWidth,
    },
    toggleSidebar,
    setChatListWidth: updateChatListWidth,
  };
}

export default useLayout;
