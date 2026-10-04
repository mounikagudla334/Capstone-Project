import { fileURLToPath } from 'node:url'
const dir = fileURLToPath(new URL('.', import.meta.url))
export default {
  plugins: {
    tailwindcss: { config: dir + 'tailwind.config.js' },
    autoprefixer: {},
  },
}
