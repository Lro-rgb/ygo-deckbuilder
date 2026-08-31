import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // Die ~14'000 Kartenbilder ändern sich nie. Ohne diese Ausnahme indexiert
      // der Dateiwächter sie alle und blockiert dabei das Ausliefern.
      ignored: ['**/public/cards/**'],
    },
  },
})
