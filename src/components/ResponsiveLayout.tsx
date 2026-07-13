import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLayout } from '../hooks/useLayout';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDragDrop } from '../hooks/useDragDrop';
import SideNav from './SideNav';
import BottomNav from './BottomNav';
import ResizablePanel from './ResizablePanel';
import KeyboardShortcuts from './KeyboardShortcuts';
import DragDropZone from './DragDropZone';

interface ResponsiveLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  isChatView: boolean;
  isFullPageWithoutNav: boolean;
}

export function ResponsiveLayout({
  leftPanel,
  rightPanel,
  isChatView,
  isFullPageWithoutNav,
}: ResponsiveLayoutProps) {
  const { layout, toggleSidebar, setChatListWidth } = useLayout();
  const { isMobile, isTablet, isDesktop, sidebarCollapsed, chatListWidth } = layout;

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Initialize keyboard shortcuts
  const { showHelp, setShowHelp } = useKeyboardShortcuts();

  // Combine showHelp state with local shortcuts panel
  const currentShortcutsOpen = isShortcutsOpen || showHelp;
  const setShortcutsOpen = (val: boolean) => {
    setIsShortcutsOpen(val);
    setShowHelp(val);
  };

  // Drag-and-drop state
  const {
    isDragging,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useDragDrop((files) => {
    // Notify the app of files dropped
    console.log('Files dropped:', files);
    const event = new CustomEvent('nexus-files-dropped', { detail: { files } });
    window.dispatchEvent(event);
  });

  // Mobile Swipe Reply / Archive Simulation Cues
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipeLeft = distance > 80;
    const isSwipeRight = distance < -80;

    if (isSwipeLeft) {
      // Dispatch swiped left (e.g. gesture for reply)
      window.dispatchEvent(new CustomEvent('nexus-gesture-swipe-left'));
    } else if (isSwipeRight) {
      // Dispatch swiped right (e.g. gesture for archive)
      window.dispatchEvent(new CustomEvent('nexus-gesture-swipe-right'));
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      className="h-screen w-screen flex bg-zinc-950 text-zinc-100 overflow-hidden select-none font-sans relative"
      onDragEnter={(e) => handleDragEnter(e, 'global-layout')}
      onDragOver={handleDragOver}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {/* 1. Global Drag & Drop High Contrast Overlay */}
      <DragDropZone
        isDragging={isDragging}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'global-layout')}
      />

      {/* 2. Global Keyboard Shortcuts Modal Panel */}
      <KeyboardShortcuts
        isOpen={currentShortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* 3. SIDE SIDEBAR (Tablets and Desktops only) */}
      {!isFullPageWithoutNav && (isTablet || isDesktop) && (
        <SideNav
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onOpenShortcuts={() => setShortcutsOpen(true)}
        />
      )}

      {/* 4. MAIN CHAT / APP WORKSPACE CORE PANEL */}
      <div className="flex-1 flex h-full overflow-hidden relative">
        {isMobile ? (
          /* MOBILE (Smartphone) FLOW: Single view switcher */
          <div className="w-full h-full flex flex-col pb-16 relative">
            <div className="flex-1 overflow-hidden">
              {isChatView ? rightPanel : leftPanel}
            </div>

            {/* Bottom bar inside mobile view wrapper */}
            {!isFullPageWithoutNav && !isChatView && <BottomNav />}
          </div>
        ) : (
          /* TABLET & DESKTOP FLOW: Persistent split visual panels */
          <div className="w-full h-full flex overflow-hidden">
            {/* Left Hand Split: Chats / Inbox Lists */}
            <div
              style={{ width: `${chatListWidth}px` }}
              className="h-full border-r border-zinc-900 bg-zinc-950 flex flex-col shrink-0 overflow-hidden"
            >
              {leftPanel}
            </div>

            {/* Panel slider handle */}
            <ResizablePanel
              width={chatListWidth}
              onResize={setChatListWidth}
            />

            {/* Right Hand Split: Active Conversation Detail */}
            <div className="flex-1 h-full bg-zinc-900/40 flex flex-col overflow-hidden">
              {rightPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResponsiveLayout;
