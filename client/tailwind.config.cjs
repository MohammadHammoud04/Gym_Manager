/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "gym-black": "#1a1a1a",
        "gym-dark": "#242424",
        "gym-gray": "#3a3a3a",
        "gym-yellow": "#facc15",
        "gym-yellowSoft": "#fef3c7",
      }
    }
  },
  plugins: [],
}
