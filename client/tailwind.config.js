import { fileURLToPath } from 'node:url'
const dir = fileURLToPath(new URL('.', import.meta.url))
/** @type {import('tailwindcss').Config} */
export default {
  content: [dir + 'index.html', dir + 'src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
