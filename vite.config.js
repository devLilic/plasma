import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    resolve: {
        dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
        // Avoid a slow cold-start crawl through every Inertia page; keep this list aligned with current browser dependencies.
        noDiscovery: true,
        include: [
            '@fortawesome/free-brands-svg-icons',
            '@fortawesome/react-fontawesome',
            '@headlessui/react',
            '@heroicons/react/24/outline',
            '@heroicons/react/24/solid',
            '@inertiajs/react',
            '@material-tailwind/react',
            '@reduxjs/toolkit',
            'axios',
            'file-saver',
            'laravel-vite-plugin/inertia-helpers',
            'react',
            'react-dom',
            'react-dom/client',
            'react-image-crop',
            'react-redux',
            'react/jsx-dev-runtime',
            'react/jsx-runtime',
        ],
    },
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            refresh: true,
        }),
        react(),
    ],
});
