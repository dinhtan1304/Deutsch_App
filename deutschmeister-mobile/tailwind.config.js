/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Feature accent colors
        reading: '#22C55E',
        writing: '#6366F1',
        listening: '#F59E0B',
        speaking: '#EF4444',
        exam: '#A855F7',
        // Dark theme colors
        dark: {
          bg: '#111827',
          card: '#1F2937',
          secondary: '#374151',
          tertiary: '#4B5563',
          border: '#374151',
        },
        // Light theme colors
        light: {
          bg: '#F9FAFB',
          card: '#FFFFFF',
          secondary: '#F3F4F6',
          tertiary: '#E5E7EB',
          border: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Inter'],
      },
    },
  },
  plugins: [],
};
