/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        background: 'var(--background)',
        surface: 'var(--surface)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'pastel-red': 'var(--pastel-red)',
        'pastel-orange': 'var(--pastel-orange)',
        'pastel-green': 'var(--pastel-green)',
        'pastel-purple': 'var(--pastel-purple)',
      }
    },
  },
  plugins: [],
}
