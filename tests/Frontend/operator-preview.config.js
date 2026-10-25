import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
    root: path.join(repository, 'tests/Frontend/operator-preview'),
    resolve: {alias: {'@': path.join(repository, 'resources/js')}},
    plugins: [react()],
    server: {host: '127.0.0.1', port: 4179, strictPort: true},
});
