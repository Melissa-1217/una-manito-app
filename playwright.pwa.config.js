import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'pwa.spec.js', timeout: 45000,
  use: { baseURL: 'http://127.0.0.1:4173', storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:4173', localStorage: [{ name: 'una-manito-welcome-v2', value: 'seen' }] }] }, viewport: { width: 390, height: 844 } },
  webServer: { command: 'npm run build && npm run preview -- --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
});
