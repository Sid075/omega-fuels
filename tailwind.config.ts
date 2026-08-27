import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary
          700: '#1d4ed8', // Primary hover
          800: '#1e40af',
          900: '#1e3a8a',
        },
        surface: {
          light: '#FFFFFF',
          'light-subtle': '#F1F3F8',
          'light-hover': '#EAEFF6',
          dark: '#111827',
          'dark-subtle': '#1F2937',
          'dark-hover': '#283548',
        },
        canvas: {
          light: '#F6F7FB',
          dark: '#0F172A',
        },
        border: {
          light: '#E5E7EB',
          dark: '#273449',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};

export default config;
