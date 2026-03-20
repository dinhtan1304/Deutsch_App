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
        // Zen Focus primary
        primary: '#8EAD92',
        accent: '#D4B483',
        background: '#1A2421',
        surface: '#25332E',
        'surface-elevated': '#2D3E38',
        // Semantic
        correct: '#7BC88C',
        wrong: '#D4838E',
        // Feature accent colors (muted)
        reading: '#7BC88C',
        writing: '#8BB5CF',
        listening: '#D4B483',
        speaking: '#D4838E',
        exam: '#B8A9D4',
        // Dark theme colors (Zen Focus)
        dark: {
          bg: '#1A2421',
          card: '#25332E',
          secondary: '#2D3E38',
          tertiary: '#354842',
          border: '#2D3E38',
        },
        // Light theme colors (kept for reference)
        light: {
          bg: '#F9FAFB',
          card: '#FFFFFF',
          secondary: '#F3F4F6',
          tertiary: '#E5E7EB',
          border: '#E5E7EB',
        },
        // Text
        'zen-text': '#E1E8E4',
        'zen-muted': '#4A5D57',
      },
      fontFamily: {
        heading: ['Quicksand'],
        body: ['Nunito'],
      },
      borderRadius: {
        stone: '24px',
      },
    },
  },
  plugins: [],
};
