const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile, mkdtemp } = require('node:fs/promises');
const { resolve, extname, join, sep } = require('node:path');
const { tmpdir } = require('node:os');
const { createHash } = require('node:crypto');

const root = resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    response.end(content);
  } catch { response.writeHead(404).end(); }
});

async function accessibility(page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => {
    const results = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, issue: n.failureSummary })) }));
  });
  assert.deepEqual(violations, [], 'Accessibility violations: ' + JSON.stringify(violations));
}
async function loadImages(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach(img => img.loading = 'eager');
    await Promise.all([...document.images].map(img => img.decode()));
  });
}
async function canvasImage(page) { const data = await page.locator('#sculpture').evaluate(c => c.toDataURL()); return createHash('sha256').update(data).digest('hex'); }

async function browserChecks(type, name, origin, artifacts) {
  const browser = await type.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await loadImages(page);
    assert.equal(await page.locator('#experience h3').first().innerText(), 'Staff Product Engineer');
    assert.equal(await page.locator('#skills').count(), 0);
    assert.equal(await page.locator('.art-pause').isVisible(), false);
    const frozen = await canvasImage(page);
    await page.waitForTimeout(250);
    assert.equal(await canvasImage(page), frozen, 'Reduced motion stops the sculpture');
    for (const shape of ['Knot', 'Bloom', 'Orbit']) {
      const before = await canvasImage(page);
      const button = page.getByRole('button', { name: shape, exact: true });
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.notEqual(await canvasImage(page), before, shape + ' changes the sculpture');
    }
    await accessibility(page);
    await page.screenshot({ path: join(artifacts, name + '-desktop.png'), fullPage: true });
    await page.locator('.career-past summary').first().click();
    assert.equal(await page.locator('.career-past').first().getAttribute('open'), '');

    // Every local asset and destination must exist, including the social card.
    const localFiles = await page.evaluate(() => [...new Set([...document.querySelectorAll('[src], a[href], meta[property="og:image"]')].map(el => el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('content')).filter(url => url && !url.startsWith('#') && !/^(https?:|mailto:)/.test(url)))]);
    localFiles.push('/assets/img/social-preview.png');
    for (const file of localFiles) assert.equal((await page.request.get(new URL(file, origin).href)).status(), 200, file);

    for (const slug of ['dawncast-morning-briefing', 'introducing-mdmux']) {
      await page.goto(origin + '/blog/' + slug + '.html', { waitUntil: 'networkidle' });
      assert.equal(await page.locator('h1').count(), 1);
      await accessibility(page);
      const code = page.locator('pre').first();
      await code.focus();
      assert.equal(await code.evaluate(el => el === document.activeElement), true);
      await page.screenshot({ path: join(artifacts, name + '-' + slug + '.png') });
    }
    for (const width of [320, 390, 768, 1024]) {
      const responsive = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
      responsive.on('pageerror', error => errors.push(error.message));
      await responsive.goto(origin, { waitUntil: 'networkidle' });
      await loadImages(responsive);
      assert.equal(await responsive.evaluate(() => document.documentElement.scrollWidth), width, 'Horizontal overflow at ' + width + 'px');
      if (width < 761) {
        const menu = responsive.getByRole('button', { name: 'Menu' });
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await responsive.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        assert.equal(await menu.evaluate(el => el === document.activeElement), true);
        await menu.click();
        await responsive.getByRole('link', { name: 'Off-screen' }).click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        assert.equal(new URL(responsive.url()).hash, '#personal');
      }
      if (width === 390) {
        await responsive.goto(origin, { waitUntil: 'networkidle' });
        await loadImages(responsive);
        await accessibility(responsive);
        await responsive.screenshot({ path: join(artifacts, name + '-mobile.png'), fullPage: true });
      }
      await responsive.close();
    }
    await page.bringToFront();
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(400);
    const moving = await canvasImage(page);
    await page.waitForTimeout(250);
    assert.notEqual(await canvasImage(page), moving, 'The sculpture animates by default');
    await page.locator('.art-pause').click();
    assert.equal(await page.locator('.art-pause').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.site-footer .motion-toggle').getAttribute('aria-pressed'), 'true');
    const paused = await canvasImage(page);
    await page.waitForTimeout(250);
    assert.equal(await canvasImage(page), paused, 'Manual pause stops motion');
    assert.equal(await page.locator('.ticker-track').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
    assert.equal(await page.locator('.project').last().evaluate(el => getComputedStyle(el).opacity), '1');
    assert.equal(await page.evaluate(() => ScrollTrigger.getAll().length), 0, 'Pausing removes scroll animations');
    await accessibility(page);
    await page.locator('.art-pause').click();
    assert.equal(await page.locator('.art-pause').getAttribute('aria-pressed'), 'false');
    await page.waitForTimeout(250);
    const resumed = await canvasImage(page);
    await page.waitForTimeout(250);
    assert.notEqual(await canvasImage(page), resumed, 'Motion resumes');
    // Changing the OS preference while the site is open must also stop motion.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.body.classList.contains('motion-paused') && document.querySelector('.art-pause').hidden && ScrollTrigger.getAll().length === 0).catch(async error => { console.log('Motion state:', await page.evaluate(() => ({paused:document.body.className,hidden:document.querySelector('.art-pause').hidden,triggers:ScrollTrigger.getAll().length,pref:matchMedia('(prefers-reduced-motion: reduce)').matches}))); throw error; });
    const systemPaused = await canvasImage(page);
    await page.waitForTimeout(250);
    assert.equal(await canvasImage(page), systemPaused);
    assert.deepEqual(errors, [], 'Browser runtime errors');
    console.log(name + ': content, controls, keyboard, responsive layout, motion, assets, and accessibility passed');
  } finally { await browser.close(); }
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const artifacts = await mkdtemp(join(tmpdir(), 'jani-browser-'));
  try {
    await browserChecks(chromium, 'chromium', origin, artifacts);
    await browserChecks(firefox, 'firefox', origin, artifacts);
    const browser = await chromium.launch({ headless: true });
    try {
      const nojs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      await nojs.goto(origin);
      assert.equal(await nojs.locator('#experience h3').first().innerText(), 'Staff Product Engineer');
      assert.equal(await nojs.locator('.sculpture-fallback').isVisible(), true);
      assert.equal(await nojs.locator('.art-controls').isVisible(), false);
      assert.equal(await nojs.locator('.site-nav').isVisible(), true);
      const missing = await nojs.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(href => !document.querySelector(href)));
      assert.deepEqual(missing, [], 'Broken section links');
      const fallback = await browser.newPage({ reducedMotion: 'reduce' });
      await fallback.route('**/assets/vendor/gsap/**', route => route.abort());
      const fallbackErrors = [];
      fallback.on('pageerror', error => fallbackErrors.push(error.message));
      await fallback.goto(origin);
      await fallback.getByRole('button', { name: 'Bloom', exact: true }).click();
      assert.deepEqual(fallbackErrors, []);
      console.log('Fallbacks: no-JavaScript navigation and content, local anchors, and unavailable animation library passed');
    } finally { await browser.close(); }
    console.log('Screenshots: ' + artifacts);
  } finally { server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
