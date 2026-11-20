import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub supplies the actual repository name, including a possible free-name suffix.
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' && repository && !repository.endsWith('.github.io') ? `/${repository}/` : '/',
}))
