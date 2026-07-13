// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0e1a',
        'bg-secondary': '#111827',
        'bg-elevated': '#1e293b',
        'bg-card': '#1a1f2e',
        'accent': '#f59e0b',
        'accent-glow': 'rgba(245, 158, 11, 0.15)',
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'text-muted': '#64748b',
        'border-subtle': 'rgba(30, 41, 59, 0.8)',
        'success': '#10b981',
        'error': '#ef4444',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'accent-glow': '0 0 20px rgba(245, 158, 11, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
