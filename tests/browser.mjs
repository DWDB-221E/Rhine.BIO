import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
const port = 4328, base = '/Rhine.BIO/', origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(port), BASE_PATH: base }, stdio: ['ignore', 'pipe', 'inherit'] });
let browser;
try {
  await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('exit', code => reject(new Error(`Server exited ${code}`))); });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.route('**/app.js', route => route.abort());
  await page.goto(origin + base);
  const prefix = `rhine-bio-portal-${Buffer.from(base).toString('hex')}-`;
  const otherBaseCache = `rhine-bio-portal-${Buffer.from('/other/').toString('hex')}-existing`;
  await page.evaluate(async ({ prefix, otherBaseCache }) => { await caches.open('other-site-cache'); await caches.open(otherBaseCache); await caches.open(prefix + 'obsolete'); }, { prefix, otherBaseCache });
  await page.unroute('**/app.js');
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const cacheNames = await page.evaluate(() => caches.keys());
  assert.ok(cacheNames.includes('other-site-cache'));
  assert.ok(cacheNames.includes(otherBaseCache));
  assert.ok(!cacheNames.includes(prefix + 'obsolete'));
  assert.equal(await page.title(), 'Rhine.bio | 从问题出发，认真思考');
  const links = page.locator('.entry');
  assert.equal(await links.count(), 5);
  assert.equal(await links.nth(0).getAttribute('href'), 'https://dwdb-221e.github.io/Lumturo/');
  assert.equal(await links.nth(4).getAttribute('href'), 'https://dwdb-221e.github.io/Tekstaro/');
  for (const [index, id] of [[1, 'lumraketo'], [2, 'kognarkeo'], [3, 'lernomodulo']]) {
    await links.nth(index).click();
    assert.equal(new URL(page.url()).hash, `#${id}`);
    assert.equal(await page.locator(`#${id} .status`).textContent(), '筹备中');
  }
  await page.goto(origin + base);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.textContent), '跳到主要内容');
  await page.keyboard.press('Enter');
  assert.equal(new URL(page.url()).hash, '#main');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
  assert.equal(await page.locator('link[rel="apple-touch-icon"]').getAttribute('href'), base + 'icons/icon-192.png');
  assert.deepEqual(await links.locator('strong').allTextContents(), ['逻辑科普 灯塔 · Lumturo', '论证分析 照明弹 · Lumraketo', '认知研究 认知方舟 · Kognarkeo', '学习笔记 学习模块 · Lernomodulo', '原文阅读 原文库 · Tekstaro']);
  const manifest = await (await page.request.get(origin + base + 'manifest.webmanifest')).json();
  for (const key of ['id', 'start_url', 'scope']) assert.equal(manifest[key], base);
  assert.equal(manifest.display, 'standalone');
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(icon => icon.sizes === `${size}x${size}`);
    const png = PNG.sync.read(await (await page.request.get(origin + icon.src)).body());
    assert.equal(png.width, size); assert.equal(png.height, size);
  }
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.ready).scope), origin + base);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  server.kill();
  await new Promise(resolve => server.once('exit', resolve));
  await context.setOffline(true);
  await page.goto(origin + base, { waitUntil: 'load' });
  assert.equal(await page.locator('h1').innerText(), 'Rhine.bio');
  const offlineResponse = await page.goto(origin + base + 'missing', { waitUntil: 'load' });
  assert.equal(offlineResponse.status(), 503);
  assert.equal(await page.locator('h1').innerText(), '页面离线不可用');
  await page.locator('a').click();
  assert.equal(await page.locator('h1').innerText(), 'Rhine.bio');
  await context.setOffline(false);
  console.log('PASS: five navigation links, keyboard, manifest, PNG icons, service worker scope, offline homepage, mobile overflow');
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null && server.signalCode === null) { server.kill(); await new Promise(resolve => server.once('exit', resolve)); }
}
