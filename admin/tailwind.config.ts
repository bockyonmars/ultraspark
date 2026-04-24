import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f5f7f4',
        foreground: '#102117',
        card: '#ffffff',
        border: '#dbe5dc',
        muted: '#eef3ee',
        primary: '#1f6b47',
        secondary: '#e8f3ed',
        accent: '#d8eadb',
        success: '#166534',
        warning: '#a16207',
        danger: '#b91c1c',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(16, 33, 23, 0.06)',
      },
      borderRadius: {
        xl: '1rem',
      },
      fontFamily: {
        sans: ['"Avenir Next"', 'Avenir', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
