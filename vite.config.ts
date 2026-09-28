import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { cpSync, createReadStream, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))
const normativaDir = path.join(root, 'normativa')

/** Sirve la carpeta /normativa (PDF oficiales) en desarrollo y la copia al build. */
function normativa(): Plugin {
  return {
    name: 'normativa-pdfs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0])
        const m = url.match(/\/normativa\/([^/]+\.pdf)$/)
        if (!m) return next()
        const file = path.join(normativaDir, m[1])
        if (!existsSync(file)) return next()
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Length', statSync(file).size)
        createReadStream(file).pipe(res)
      })
    },
    closeBundle() {
      const out = path.join(root, 'dist', 'normativa')
      if (existsSync(path.join(root, 'dist'))) cpSync(normativaDir, out, { recursive: true })
    },
  }
}

export default defineConfig({
  base: '/opo-admin-ull/',
  resolve: { alias: { '@': path.join(root, 'src') } },
  plugins: [
    react(),
    tailwindcss(),
    normativa(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Opo ULL · Escala Administrativa',
        short_name: 'Opo ULL',
        description: 'Estudio de la oposición a la Escala Administrativa (C1) de la Universidad de La Laguna',
        lang: 'es',
        theme_color: '#1d3b8b',
        background_color: '#faf7f2',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/normativa\/.*\.pdf$/,
            handler: 'CacheFirst',
            options: { cacheName: 'normativa', expiration: { maxEntries: 60 } },
          },
        ],
      },
    }),
  ],
})
