import { defineConfig } from 'vite';
import path from 'path';

// Separate Vite config to build the Electron preload script as CommonJS.
// Electron requires preload scripts to be CJS — NOT ES modules.
export default defineConfig({
    build: {
        lib: {
            entry: path.resolve(__dirname, 'electron/preload.ts'),
            formats: ['cjs'],
            fileName: () => 'preload.js',
        },
        outDir: 'dist-electron',
        emptyOutDir: false, // Don't wipe main.js when building preload
        rollupOptions: {
            external: ['electron'],
            output: {
                // Ensure output is CJS, not ESM
                format: 'cjs',
                entryFileNames: 'preload.js',
            },
        },
        // Don't minify so logs are readable in DevTools
        minify: false,
        sourcemap: false,
    },
});
