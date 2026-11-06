import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    // Dev only: lets a phone on the same Wi-Fi use the API without CORS changes.
    // Run `npm run dev -- --host`, set VITE_API_URL=/api in web/.env.local and
    // open http://<pc-ip>:5173 on the phone. Requests to /api go to the backend.
    proxy: {
      '/api': {
        target: process.env.DEV_API_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        rewrite: path => path.replace(/^\/api/, ''),
        // The browser's Origin is the dev server (e.g. http://192.168.0.10:5173),
        // which the backend's CORS rule rejects. The proxy talks server to server,
        // so the header is dropped and no CORS change is needed.
        configure: proxy => {
          proxy.on('proxyReq',   req => { req.removeHeader('origin') })
          proxy.on('proxyReqWs', req => { req.removeHeader('origin') })
        },
      },
    },
  },
})
