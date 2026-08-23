import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA, type ManifestOptions } from 'vite-plugin-pwa'
import { MODULE_SHORTCUTS } from './src/shared/appShortcuts'

const shortcutEntries: NonNullable<ManifestOptions['shortcuts']> = MODULE_SHORTCUTS.map(
    (shortcut) => ({
        name: shortcut.label,
        url: shortcut.path,
        icons: [
            {
                src: shortcut.iconPath,
                sizes: '192x192',
                type: 'image/png',
            },
        ],
    })
)

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'src',
            filename: 'service-worker.ts',
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}']
            },
            manifest: {
                name: 'Sistema Operativo Personal',
                short_name: 'PersonOS',
                description: 'Tu sistema operativo personal para gestión de hábitos, tareas y más',
                lang: 'es',
                id: '/',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                shortcuts: shortcutEntries,
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    build: {
        chunkSizeWarningLimit: 1600,
    },
})