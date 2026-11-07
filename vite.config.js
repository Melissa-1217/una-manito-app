import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import pwaBuild from './pwa-build.js';
import handler from './api/prepare-publication.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), pwaBuild(), {
      name: 'local-publication-api',
      configureServer(server) {
        server.middlewares.use('/api/prepare-publication', (req, res) => {
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (body) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); return res; };
          void handler(req, res, { apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL });
        });
      },
    }],
  };
});
