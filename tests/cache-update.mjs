// Exercises a real HTTP cache across documents, without intercepting requests.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { chromium } from 'playwright';
const root = process.cwd(),
  read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const legacyProgress = {
  version: 2,
  xp: 180,
  completed: ['fundamentos/tu-primer-paso', 'fundamentos/editor-y-ejecucion'],
  streak: { count: 1, lastDay: '2026-11-06' },
  goal: 'backend',
};
let legacy = true,
  hits = [];
const oldMain = `import {legacy} from './features/catalog.js'; import {legacy as gate} from './domain/curriculum.js'; await fetch('/content/curriculum/index.json').then(r=>r.json()); localStorage.setItem('teslacode:progress:v2',${JSON.stringify(JSON.stringify(legacyProgress))}); document.getElementById('legacy').textContent=legacy+gate; document.body.dataset.cached='yes';`;
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  hits.push(url.pathname + url.search);
  if (url.pathname.startsWith('/legacy')) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.end(
      '<html><head><link rel="stylesheet" href="/css/studio.css"></head><body><div id="legacy"></div><script type="module" src="/js/main.js"></script></body></html>',
    );
    return;
  }
  const stale = {
    '/js/main.js': oldMain,
    '/js/features/catalog.js': "export const legacy='old-view';",
    '/js/domain/curriculum.js': "export const legacy='old-lock';",
    '/css/studio.css': 'body {background:rgb(250,0,0)}',
    '/content/curriculum/index.json': '{"routes":["fundamentos"]}',
  };
  const extension = url.pathname.split('.').at(-1);
  const types = {
    js: 'text/javascript',
    css: 'text/css',
    json: 'application/json',
    png: 'image/png',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    html: 'text/html',
  };
  res.setHeader('Content-Type', types[extension] ?? 'application/octet-stream');
  res.setHeader(
    'Cache-Control',
    extension === 'html' ? 'no-store' : 'public, max-age=31536000, immutable',
  );
  if (legacy && Object.hasOwn(stale, url.pathname)) {
    res.end(stale[url.pathname]);
    return;
  }
  const target = resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!target.startsWith(root + sep) || !existsSync(target)) {
    res.statusCode = 404;
    res.end('Missing');
    return;
  }
  res.end(readFileSync(target));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()),
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
      viewport: { width: 1672, height: 1040 },
      reducedMotion: 'reduce',
    }),
    page = await context.newPage();
  await page.goto(origin + '/legacy.html');
  await page.locator('body[data-cached=yes]').waitFor();
  assert.ok(hits.includes('/js/features/catalog.js'));
  hits = [];
  await page.goto(origin + '/legacy-second.html');
  await page.locator('body[data-cached=yes]').waitFor();
  assert.equal(
    hits.filter((p) => p.startsWith('/js/') || p.startsWith('/css/')).length,
    0,
    'legacy modules and styles really remain cached',
  );
  legacy = false;
  hits = [];
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(origin + '/index.html#/inicio');
  await page.locator('.studio-home').waitFor();
  assert.match(await page.locator('h1').innerText(), /Construye lo que imaginas/);
  assert.equal(
    await page.locator('#studio-route-select option').count(),
    6,
    'JSON must bypass the old single-route catalog',
  );
  assert.ok(hits.some((p) => p.startsWith('/content/curriculum/index.json?v=')));
  const snapshot = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('teslacode:progress:v2')));
  for (const rid of read('content/curriculum/index.json').routes) {
    const r = read(`content/curriculum/${rid}.json`),
      first = r.levels.flatMap((l) => l.lessons).find((l) => l.status === 'published');
    await page.goto(`${origin}/index.html#/leccion/${rid}/${first.id}/aprender`);
    await page.locator('#lesson').waitFor();
    assert.equal(await page.locator('h1').innerText(), first.title);
  }
  const state = await snapshot();
  assert.equal(state.xp, 180);
  assert.deepEqual(state.completed, legacyProgress.completed);
  await page.goto(origin + '/index.html#/leccion/frontend/http-y-https/aprender');
  await page.getByText('Completa el paso anterior', { exact: true }).waitFor();
  await page.goto(origin + '/index.html#/practica');
  await page.locator('[data-step]').waitFor();
  const release = await page.locator('html').getAttribute('data-release');
  assert.notEqual(
    await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgb(250, 0, 0)',
    'the cached legacy stylesheet must not survive',
  );
  assert.ok(
    hits
      .filter((p) => p.startsWith('/css/') || p.startsWith('/assets/') || p.startsWith('/content/'))
      .every((p) => new URL(p, origin).searchParams.get('v') === release),
    'styles, images and content share the module edition',
  );
  assert.ok(
    hits
      .filter((p) => p.startsWith('/js/'))
      .every((p) => new URL(p, origin).searchParams.get('v') === release),
    'including lazy widgets, every module belongs to the same edition',
  );
  await page.goto(origin + '/index.html#/inicio');
  await page.locator('.studio-home').waitFor();
  await page.locator('#studio-route-select').selectOption('backend');
  await page.getByText('Tu ruta: Backend', { exact: true }).waitFor();
  await page.locator('#studio-form button').click();
  await page.screenshot({ path: '/tmp/teslacode-warm-cache-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: '/tmp/teslacode-warm-cache-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  await context.close();
  console.log(
    'PASS: real legacy HTTP cache replaced coherently; all six routes open, 180 XP and previous completions preserved, internal sequence enforced, lazy modules versioned.',
  );
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
