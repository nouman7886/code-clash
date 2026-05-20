/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        clash: {
          bg:      '#080c14',   // near-black background
          surface: '#0d1424',   // card / panel surface
          border:  '#1a2540',   // subtle borders
          muted:   '#1e2d4a',   // muted surface
          cyan:    '#00e5ff',   // primary accent
          green:   '#00ff88',   // success / online
          amber:   '#ffb700',   // warning / intermediate
          red:     '#ff3860',   // danger / advanced
          purple:  '#a855f7',   // secondary accent
          text:    '#e2e8f0',   // body text
          dim:     '#64748b',   // dimmed text
        },
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"Fira Code"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'slide-up':   'slideUp 0.4s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 5px #00e5ff40' },
          '100%': { boxShadow: '0 0 20px #00e5ff80, 0 0 40px #00e5ff30' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};