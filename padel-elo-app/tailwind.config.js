/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {// tailwind.config.js
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Outfit", "ui-sans-serif", "system-ui"] },
      colors: {
        brand: {
          50:"#ecfeff",100:"#cffafe",200:"#a5f3fc",300:"#67e8f9",
          400:"#22d3ee",500:"#06b6d4",600:"#0891b2",700:"#0e7490",
          800:"#155e75",900:"#164e63"
        }
      },
      boxShadow: { soft: "0 10px 25px -5px rgba(0,0,0,0.08)" }
    }
  },
  plugins: []
};
},
  },
  plugins: [],
}
