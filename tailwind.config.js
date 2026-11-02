/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': '#0f172a',
        'app-card': '#1e293b',
        'app-hover': '#334155',
        'app-code': '#0c1222',
        'app-border': '#1e3a5f',
        'accent': '#38bdf8',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
