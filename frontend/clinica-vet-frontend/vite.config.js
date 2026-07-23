import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Configuración de Vite (migrado desde create-react-app).
 *
 * - Los componentes con JSX viven en archivos .jsx (renombrados desde la
 *   estructura CRA original). Los .js restantes son JS puro (api.js,
 *   constantes.js), así que NO se les fuerza el loader jsx.
 * - outDir 'build': misma carpeta que producía CRA, para no romper
 *   .claude/launch.json ni scripts de despliegue existentes.
 * - server.port 3000: mismo puerto que usaba CRA en desarrollo.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'build',
  },
});
