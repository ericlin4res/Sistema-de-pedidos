/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        crema: "#FBF7EF",       // fondo cálido
        tinta: "#20241F",       // texto principal, casi negro verdoso
        basil: {
          DEFAULT: "#2F5233",   // acento primario (listo / éxito)
          light: "#3E6B44"
        },
        azafran: {
          DEFAULT: "#E8A33D",   // acento secundario (en preparación)
          light: "#F0BC6C"
        },
        brasa: "#C1443C",       // urgente / recién llegado
        arena: "#EFE8D8"        // superficies, tarjetas
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-worksans)", "sans-serif"]
      },
      borderRadius: {
        plato: "2rem"
      }
    }
  },
  plugins: []
};
