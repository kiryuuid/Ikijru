/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
        },
        accent: {
          red: '#f43f5e',       // Vibrant Electric Crimson Rose (modern, glowing)
          redDark: '#e11d48',   // Deep Royal Ruby
          orange: '#f97316',    // Vibrant Sunset Orange
          gold: '#fbbf24',      // Vibrant Warm Amber Gold
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: 'var(--border)',
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-nunito)', 'sans-serif'],
      },
      boxShadow: {
        'glow-red': '0 0 25px -4px rgba(244, 63, 94, 0.45)',
        'glow-red-sm': '0 0 12px -2px rgba(244, 63, 94, 0.3)',
        'card-hover': '0 16px 32px -12px rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(180deg, transparent 35%, rgba(18, 19, 24, 0.98) 100%)',
        'gradient-hero': 'linear-gradient(135deg, #070709 0%, #12141c 50%, #070709 100%)',
        'gradient-red': 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRed: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(244, 63, 94, 0.45)' },
          '50%': { boxShadow: '0 0 0 10px rgba(244, 63, 94, 0)' },
        },
      },
    },
  },
  plugins: [],
};
