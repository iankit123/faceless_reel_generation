/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We can add custom colors here if needed, but standard tailwind colors are usually fine.
        // The user requested a "Dark theme. Clean. Professional."
      }
    },
  },
  plugins: [],
}
