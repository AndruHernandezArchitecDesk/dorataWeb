/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#1C1B1A",
        cream: "#FFF8ED",
        paper: "#FFFDF8",
        flame: "#FF5A1F",
        yolk: "#FFC93C",
        chile: "#D62828",
        ink: "#2A2622",
        mute: "#9A9187",
        line: "#EDE4D3",
        green: "#3F7D4E",
      },
      fontFamily: {
        display: ["'Arial Black'", "Arial", "sans-serif"],
        body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
