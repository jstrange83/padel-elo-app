// tailwind.config.cjs
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#effef8",
          100: "#d9fbea",
          200: "#b4f6d7",
          300: "#82edc1",
          400: "#4fdea7",
          500: "#2ecc90",     // primær grøn
          600: "#1ea976",
          700: "#17865f",
          800: "#166a4e",
          900: "#145743",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(0,0,0,.15)",
      }
    },
  },
  plugins: [],
}
