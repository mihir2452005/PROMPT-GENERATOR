/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#050816',
        accent: '#7c3aed',
        glass: 'rgba(255, 255, 255, 0.05)',
      },
    },
  },
  plugins: [],
}
