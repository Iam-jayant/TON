/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ton: {
          primary: "#0098EA",
          dark: "#0077B5",
          accent: "#8FE1FF",
        },
      },
    },
  },
  plugins: [],
};

