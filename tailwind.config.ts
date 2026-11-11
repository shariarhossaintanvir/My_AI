import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#101114',
          sidebar: '#17191E',
          surface: '#1D2027',
          surfaceHover: '#252932',
          border: '#30333B',
          text: '#F5F5F5',
          textSecondary: '#A1A1AA',
          textMuted: '#71717A',
        },
        light: {
          bg: '#F9F9FB',
          sidebar: '#F2F3F5',
          surface: '#FFFFFF',
          surfaceHover: '#EBECEF',
          border: '#E2E4E8',
          text: '#121316',
          textSecondary: '#646873',
          textMuted: '#9598A2',
        },
        brand: {
          DEFAULT: '#FF8A45',
          hover: '#E57734',
          dark: '#CC6324',
          light: '#FF9E64',
          subtle: 'rgba(255, 138, 69, 0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
