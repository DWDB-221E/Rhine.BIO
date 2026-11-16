import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
const base = process.env.BASE_PATH || '/Rhine.BIO/';
if (!/^\/(?:[A-Za-z0-9._~-]+\/)*$/.test(base)) throw new Error('BASE_PATH must be an absolute path ending in /');
await mkdir('dist/icons', { recursive: true });
for (const name of ['index.html', 'offline.html', 'app.js']) await writeFile(`dist/${name}`, (await readFile(`src/${name}`, 'utf8')).replaceAll('__BASE__', base));
await copyFile('src/style.css', 'dist/style.css');
for (const size of [192, 512]) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = x - size / 2, dy = y - size / 2, r = Math.sqrt(dx * dx + dy * dy) / size;
    const ring = Math.abs(r - .29) < .008 || Math.abs(r - .20) < .006;
    const line = Math.abs(dy + dx * .48) < size * .005 && Math.abs(dx) < size * .36;
    const color = r < .065 ? [234, 200, 120] : ring || line ? [164, 202, 185] : [23, 79, 75];
    png.data.set([...color, 255], (y * size + x) * 4);
  }
  await writeFile(`dist/icons/icon-${size}.png`, PNG.sync.write(png));
}
const manifest = { id: base, start_url: base, scope: base, name: 'Rhine.bio 思考与阅读', short_name: 'Rhine.bio', description: '逻辑、论证、认知、学习与原文阅读。', lang: 'zh-CN', display: 'standalone', background_color: '#f7f8f5', theme_color: '#174f4b', icons: [192, 512].map(size => ({ src: `${base}icons/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png' })) };
await writeFile('dist/manifest.webmanifest', JSON.stringify(manifest, null, 2));
const files = ['', 'index.html', 'offline.html', 'style.css', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
const hash = createHash('sha256');
for (const name of files.slice(1)) hash.update(await readFile(`dist/${name}`));
const prefix = `rhine-bio-portal-${Buffer.from(base).toString('hex')}-`;
const cache = `${prefix}${hash.digest('hex').slice(0, 12)}`;
await writeFile('dist/sw.js', `const CACHE = ${JSON.stringify(cache)};\nconst PREFIX = ${JSON.stringify(prefix)};\nconst BASE = ${JSON.stringify(base)};\nconst FILES = ${JSON.stringify(files.map(file => base + file))};\nself.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));\nself.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));\nself.addEventListener('fetch', event => {\n  const url = new URL(event.request.url);\n  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;\n  if (event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(async () => {\n    const cache = await caches.open(CACHE);\n    if (url.pathname === BASE || url.pathname === BASE + 'index.html') return cache.match(BASE);\n    const offline = await cache.match(BASE + 'offline.html');\n    return new Response(await offline.blob(), { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });\n  }));\n  else if (FILES.includes(url.pathname)) event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request)).then(cached => cached || fetch(event.request)));\n});\n`);
console.log(`Built dist for ${base} (${cache})`);
