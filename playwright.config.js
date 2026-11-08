import { defineConfig } from '@playwright/test';
import process from 'node:process';

export default defineConfig({
  testDir: './tests',
  testMatch: ['ui.spec.js', 'auth.spec.js', 'publications.spec.js', 'participants.spec.js', 'lifecycle.spec.js', 'manolito.spec.js', 'accessibility.spec.js', 'experience.spec.js', 'conversations.spec.js', 'emergency.spec.js', 'feed.spec.js', 'menu.spec.js', 'profile.spec.js', 'products.spec.js', 'intents.spec.js', 'alerts.spec.js'],
  use: { baseURL: 'http://127.0.0.1:5173', storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:5173', localStorage: [{ name: 'una-manito-welcome-v2', value: 'seen' }, ...['ana', 'luis', 'ana-uuid', 'luis-uuid'].flatMap(id => [{ name: `una-manito-welcome-v3-${id}`, value: 'seen' }, { name: `una-manito-tutorial-v1-${id}`, value: 'seen' }])] }] } },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
  webServer: { command: 'npm run dev -- --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});
