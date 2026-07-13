import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Phone, Compass, Shield, User, Mail, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      id: 'chats',
      label: 'Chats',
      path: '/chats',
      icon: (isActive: boolean) => (
        <MessageSquare 
          size={24} 
          strokeWidth={1.5} 
          className={isActive ? "text-accent" : "text-text-muted"} 
        />
      ),
    },
    {
      id: 'ai',
      label: 'Nexus AI',
      path: '/ai',
      icon: (isActive: boolean) => (
        <Sparkles 
          size={24} 
          strokeWidth={1.5} 
          className={isActive ? "text-accent animate-pulse" : "text-text-muted"} 
        />
      ),
    },
    {
      id: 'inbox',
      label: 'Inbox',
      path: '/inbox',
      icon: (isActive: boolean) => (
        <Mail 
          size={24} 
          strokeWidth={1.5} 
          className={isActive ? "text-accent" : "text-text-muted"} 
        />
      ),
    },
    {
      id: 'calls',
      label: 'Calls',
      path: '/calls',
      icon: (isActive: boolean) => (
        <Phone 
          size={24} 
          strokeWidth={1.5} 
          className={isActive ? "text-accent" : "text-text-muted"} 
        />
      ),
    },
    {
      id: 'reels',
      label: 'Reels',
      path: '/reels',
      icon: (isActive: boolean) => (
        <Compass 
          size={24} 
          strokeWidth={1.5} 
          className={isActive ? "text-accent" : "text-text-muted"} 
        />
      ),
    },
    {
      id: 'vault',
      label: 'Vault',
      path: '/vault',
      icon: (isActive: boolean) => (
        <Shield 
          size={24} 
          strokeWidth={1.5} 
          className={isActive ? "text-accent" : "text-text-muted"} 
        />
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      path: '/profile',
      icon: (isActive: boolean) => (
        <User 
          size={24} 
          strokeWidth={1.5} 
          className={isActive ? "text-accent" : "text-text-muted"} 
        />
      ),
    },
  ];

  return (
    <nav 
      id="nexus_bottom_navigation" 
      className="fixed bottom-0 left-0 right-0 h-16 bg-bg-secondary/90 backdrop-blur-xl border-t border-border-subtle flex items-center justify-around px-2 z-40 select-none pb-safe"
    >
      {navItems.map((item) => {
        // Match active tab
        const isActive = currentPath.startsWith(item.path);

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center py-1.5 px-3 h-full relative focus:outline-none cursor-pointer group"
          >
            {/* Active glow line: 2px top indicator */}
            {isActive && (
              <motion.div
                layoutId="active-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-accent shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}

            {/* Icon & Label container */}
            <div className="flex flex-col items-center gap-0.5">
              <div className={isActive ? 'scale-105 transition-transform' : 'hover:scale-105 transition-transform'}>
                {item.icon(isActive)}
              </div>

              {/* Show label only if active */}
              {isActive && (
                <span className="text-[10px] text-accent font-medium leading-none mt-0.5">
                  {item.label}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
