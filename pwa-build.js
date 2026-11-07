import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Cache only this build's public files, never auth, API or Supabase responses.
export default function pwaBuild() {
  return {
    name: 'una-manito-pwa', enforce: 'post', apply: 'build',
    generateBundle(_options, bundle) {
      const publicFiles = ['manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png','manolito-avatar.png','manolito-ayuda.png','manolito-barrio.png'];
      const assets = Object.keys(bundle).filter(name => /\.(js|css|woff2)$/.test(name));
      const files = ['/index.html', ...assets.map(name => `/${name}`), ...publicFiles.map(name => `/${name}`)];
      const hash = createHash('sha256').update(readFileSync('index.html'));
      for (const asset of Object.values(bundle)) hash.update(asset.type === 'chunk' ? asset.code : asset.source);
      for (const name of publicFiles) hash.update(readFileSync(`public/${name}`));
      const source = readFileSync('src/pwa-worker.js', 'utf8')
        .replace('/* __FILES__ */ []', JSON.stringify(files))
        .replace('__VERSION__', hash.digest('hex').slice(0, 16));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
