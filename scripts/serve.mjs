import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const base = process.env.BASE_PATH || '/Rhine.BIO/';
const port = Number(process.env.PORT || 4327);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };
http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (!pathname.startsWith(base)) { res.writeHead(404).end('Not found'); return; }
  const relative = pathname.slice(base.length) || 'index.html';
  if (relative.includes('..') || relative.includes('\\')) { res.writeHead(400).end('Bad path'); return; }
  try { const data = await readFile(path.join('dist', relative)); res.writeHead(200, { 'Content-Type': types[path.extname(relative)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(data); }
  catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Serving http://127.0.0.1:${port}${base}`));
