import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
    plugins: [
        react(),
        svgr({
            svgrOptions: {
                icon: true,
                svgoConfig: {
                  plugins: [
                    { name: 'removeViewBox', active: false },
                    { name: 'removeDimensions', active: true },
                  ],
                },
            },
        }),
    ],
    resolve: {
        alias: {
            'app': path.resolve(__dirname, './src/app'),
            'widgets': path.resolve(__dirname, './src/widgets'),
            'pages': path.resolve(__dirname, './src/pages'),
            'shared': path.resolve(__dirname, './src/shared'),
        }
    },
    build: {
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    quill: ['quill'],
                },
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts'
    }
});