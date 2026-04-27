import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 토스 시그니처 블루 - 가이드 톤에 맞춘 베이스 팔레트
        toss: {
          50: '#E8F3FF',
          100: '#C9E2FF',
          200: '#9CC9FF',
          300: '#6BAEFF',
          400: '#4593FC',
          500: '#3182F6', // 메인
          600: '#1B64DA',
          700: '#1849AF',
          800: '#173282',
          900: '#0E1F52',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F2F4F6',
          muted: '#E5E8EB',
        },
        ink: {
          DEFAULT: '#191F28',
          muted: '#4E5968',
          subtle: '#8B95A1',
        },
      },
      spacing: {
        // safe-area 토큰 — globals.css에서 env(safe-area-inset-*)로 채움
        'safe-t': 'var(--safe-area-top)',
        'safe-b': 'var(--safe-area-bottom)',
        'safe-l': 'var(--safe-area-left)',
        'safe-r': 'var(--safe-area-right)',
      },
      padding: {
        safe: 'var(--safe-area-bottom)',
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'tile-pop': 'tilePop 220ms cubic-bezier(0.4, 0, 0.2, 1)',
        'shake': 'shake 320ms cubic-bezier(0.36, 0.07, 0.19, 0.97)',
      },
      keyframes: {
        tilePop: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
