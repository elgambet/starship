import { defineConfig } from 'vite';

// Relative base so the same build works at any URL path, e.g. https://<namespace>.gitlab.io/<project>/.
// Override with VITE_BASE=/custom/path/ if a fixed absolute base is ever needed.
export default defineConfig({
  base: process.env.VITE_BASE ?? './',
  build: { chunkSizeWarningLimit: 1500 },
});
