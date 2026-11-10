import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { browserExecutable } from '../tests/support/runtime.mjs';

const label = process.argv[2] || 'current';
const [view, hash, ready] = {
  lab: ['lab', '#/practica', '.practice-list'],
  progress: ['progress', '#/progreso', '#progress-file'],
}[process.argv[3]] || ['home', '', '.hero'];
if (!/^[a-z0-9-]+$/.test(label)) throw Error('Usa una etiqueta simple para la revisión.');
const origin = process.env.REVIEW_ORIGIN || 'http://127.0.0.1:3000';
const output = resolve('coverage/ui-review', label);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: browserExecutable(),
  args: ['--no-sandbox'],
});
const samples = [];
try {
  for (const width of [1440, 390]) {
    for (let sample = 0; sample < 3; sample++) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      // Measure the learning view as a returning visitor, independently of the intro download.
      await context.addInitScript(() => sessionStorage.setItem('teslacode:intro:v1', '1'));
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.reviewMetrics = { lcp: 0, cls: 0, longTasks: 0 };
        for (const [type, record] of [
          [
            'largest-contentful-paint',
            (entry) => {
              window.reviewMetrics.lcp = entry.startTime;
            },
          ],
          [
            'layout-shift',
            (entry) => {
              if (!entry.hadRecentInput) window.reviewMetrics.cls += entry.value;
            },
          ],
          [
            'longtask',
            () => {
              window.reviewMetrics.longTasks++;
            },
          ],
        ])
          new PerformanceObserver((list) => list.getEntries().forEach(record)).observe({
            type,
            buffered: true,
          });
      });
      await page.goto(origin + '/' + hash);
      await page.locator(ready).waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images]
            .filter((image) => image.getClientRects().length)
            .map((image) => image.decode().catch(() => {})),
        );
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
      });
      const metrics = await page.evaluate(async () => {
        const frames = [];
        await new Promise((done) => {
          let previous;
          const frame = (now) => {
            if (previous) frames.push(now - previous);
            previous = now;
            if (frames.length === 120) done();
            else requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
        const resources = performance.getEntriesByType('resource');
        return {
          ...window.reviewMetrics,
          documentMs: performance.getEntriesByType('navigation')[0].duration,
          transferredBytes: resources.reduce((sum, resource) => sum + resource.transferSize, 0),
          jsBytes: resources
            .filter((resource) => /\.js(?:\?|$)/.test(resource.name))
            .reduce((sum, resource) => sum + resource.decodedBodySize, 0),
          requests: resources.length,
          frameP95Ms: frames.toSorted((a, b) => a - b)[Math.floor(frames.length * 0.95)],
          framesOver32Ms: frames.filter((time) => time > 32).length,
          overflow: document.documentElement.scrollWidth > innerWidth,
          pyodideRequests: resources.filter((resource) => /pyodide/.test(resource.name)).length,
        };
      });
      samples.push({ view, width, sample, ...metrics });
      if (!sample) {
        await page.screenshot({
          path: resolve(output, `${view}-viewport-${width}.png`),
          animations: 'disabled',
        });
        await page.screenshot({
          path: resolve(output, `${view}-${width}.png`),
          fullPage: true,
          animations: 'disabled',
        });
        for (const [name, hash, selector] of view === 'home'
          ? [
              ['routes', '#/rutas', '.routes-grid'],
              ['lesson', '#/leccion/fundamentos/tu-primer-paso/aprender', '#lesson'],
            ]
          : []) {
          await page.goto(origin + '/' + hash);
          await page.locator(selector).waitFor();
          await page.screenshot({
            path: resolve(output, `${name}-${width}.png`),
            fullPage: true,
            animations: 'disabled',
          });
        }
      }
      await context.close();
    }
  }
  await writeFile(
    resolve(output, 'report.json'),
    JSON.stringify(
      {
        browser: browser.version(),
        conditions:
          'Local static HTTP; three fresh contexts per viewport; warm browser/OS caches; normal motion; 120 rAF samples. Not field CWV.',
        samples,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ output, samples }));
} finally {
  await browser.close();
}
