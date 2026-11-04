import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server forwards /api/* to the backend.
// By default that is the live Render backend. To test against a backend
// running on your own computer, create frontend/.env.local containing:
//   BACKEND_URL=http://localhost:8000
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.BACKEND_URL || 'https://timetap-backend.onrender.com'

  return {
    plugins: [react()],

    server: {
      host: '0.0.0.0',

      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: target.startsWith('https'),
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
