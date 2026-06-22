import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base must match the GitHub repo name so assets resolve correctly on
// GitHub Pages (served from https://<user>.github.io/<repo>/)
export default defineConfig({
  plugins: [react()],
  base: '/Job-opportunities-in-college-/',
})
