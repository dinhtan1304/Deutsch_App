import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // QUAN TRỌNG: Bật dark mode bằng class
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors nếu cần
      },
    },
  },
  plugins: [],
};

export default config;