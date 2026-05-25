/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
          600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b',
        },
        gold: {
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706',
        },
        surface: {
          950: '#030712', 900: '#111827', 800: '#1f2937',
          700: '#374151', 600: '#4b5563',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'gradient-dark': 'linear-gradient(135deg, #030712 0%, #111827 50%, #0a1628 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-top': 'slideInTop 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'count-up': 'countUp 0.6s ease-out',
      },
      keyframes: {
        slideInRight: { from: { transform: 'translateX(100%)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        slideInTop: { from: { transform: 'translateY(-10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        glow: { from: { boxShadow: '0 0 10px #10b98140' }, to: { boxShadow: '0 0 25px #10b98180, 0 0 50px #10b98130' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        countUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'card': '0 0 0 1px rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 0 0 1px rgba(16,185,129,0.3), 0 8px 32px rgba(0,0,0,0.5)',
        'brand': '0 4px 20px rgba(16,185,129,0.35)',
        'gold': '0 4px 20px rgba(251,191,36,0.3)',
        'glow-sm': '0 0 15px rgba(16,185,129,0.4)',
      },
    },
  },
  plugins: [],
};
