import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { VitePWA } from 'vite-plugin-pwa';



export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        base: 'dev-toolbox-aggregator',
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',
                devOptions: {
                    enabled: true
                },
                manifest: {
                    name: 'Dev Toolbox Aggregator',
                    short_name: 'DevToolbox',
                    description: 'A collection of useful developer tools.',
                    theme_color: '#020617',
                    icons: [
                        {
                            src: 'favicon.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ]
                },
                workbox: {
                    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                }
            }),
            react(),
            viteStaticCopy({
                targets: [
                    {
                        src: 'node_modules/pdfjs-dist/cmaps/', // 注意末尾的斜杠
                        dest: '' // 默认会复制到 dist/cmaps
                    }
                ]
            })
        ],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },

    };
});
