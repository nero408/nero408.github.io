const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile, mkdtemp } = require('node:fs/promises');
const { resolve, extname, join, sep } = require('node:path');
const { tmpdir } = require('node:os');

const root = resolve(__dirname, '..');
const views = ['home', 'learner', 'builder', 'horse'];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
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
async function ready(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll('img').forEach(img => img.loading = 'eager');
    await Promise.all([...document.images].map(img => img.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
async function activeView(page, view, focus = true) {
  await page.waitForFunction(v => document.body.dataset.view === v, view);
  assert.equal(await page.locator('.carousel-panel:not([inert])').getAttribute('id'), view);
  assert.equal(await page.locator('.carousel-panel[aria-hidden="false"]').count(), 1);
  if (focus) assert.equal(await page.evaluate(() => document.activeElement.id), view + '-title');
  assert.equal(await page.locator('.carousel-controls').isVisible(), view !== 'home');
}
async function fits(page, width) {
  await ready(page);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, 'Horizontal overflow at ' + width + 'px');
  const dimensions = await page.evaluate(() => {
    const stage = document.querySelector('.carousel-stage').getBoundingClientRect();
    const panel = document.querySelector('.carousel-panel:not([inert])').getBoundingClientRect();
    return { stage, panel };
  });
  assert.ok(Math.abs(dimensions.stage.height - dimensions.panel.height) < 2, 'Active face must not be vertically clipped');
  assert.ok(Math.abs(dimensions.stage.x - dimensions.panel.x) < 2, 'Active face must line up with the stage after resizing');
}
async function swipe(page, dx, dy) {
  await page.locator('.carousel-stage').evaluate((stage, { dx, dy }) => {
    stage.dispatchEvent(new TouchEvent('touchstart', { touches: [new Touch({ identifier: 1, target: stage, clientX: 200, clientY: 200 })] }));
    stage.dispatchEvent(new TouchEvent('touchend', { changedTouches: [new Touch({ identifier: 1, target: stage, clientX: 200 + dx, clientY: 200 + dy })] }));
  }, { dx, dy });
}

async function browserChecks(type, name, origin, artifacts) {
  const browser = await type.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin, { waitUntil: 'networkidle' });
    await ready(page);
    await activeView(page, 'home', false);
    assert.equal(await page.locator('.avatar-choice').count(), 3);
    assert.equal(await page.locator('.brand-star, #sculpture, canvas').count(), 0);
    await fits(page, 1440);
    await accessibility(page);
    await page.screenshot({ path: join(artifacts, name + '-home.png'), fullPage: true });
    // A real avatar click must reveal only its face, focus its heading, and update the URL.
    for (const view of views.slice(1)) {
      await page.locator('.choice-' + view).click();
      await activeView(page, view);
      assert.equal(new URL(page.url()).hash, '#' + view);
      await fits(page, 1440);
      await accessibility(page);
      await page.screenshot({ path: join(artifacts, name + '-' + view + '.png'), fullPage: true });
      await page.getByRole('link', { name: 'All sides', exact: true }).click();
      await activeView(page, 'home');
    }
    await page.locator('.choice-builder').click();
    assert.match(await page.locator('.current-work').innerText(), /Staff Product Engineer/);
    assert.match(await page.locator('.current-work').innerText(), /Product Deployment Group/);
    assert.match(await page.locator('.role-description').innerText(), /lighthouse customers/);
    await page.locator('.skip-link').focus();
    await page.keyboard.press('Enter');
    await activeView(page, 'builder');
    // Hidden faces must stay out of the keyboard sequence.
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.closest('.carousel-panel').id), 'builder');
    await page.keyboard.press('Escape');
    await activeView(page, 'home');
    await page.keyboard.press('ArrowLeft');
    await activeView(page, 'horse');
    await page.getByRole('button', { name: 'Next side', exact: true }).click();
    await activeView(page, 'home');
    await page.keyboard.press('ArrowRight');
    await activeView(page, 'learner');
    await page.getByRole('button', { name: 'Previous side', exact: true }).click();
    await activeView(page, 'home');

    // Browser navigation restores the selected face, including historical section URLs.
    await page.goto(origin);
    await page.locator('.choice-builder').click();
    await page.getByRole('link', { name: 'Learner', exact: true }).click();
    await page.goBack();
    await activeView(page, 'builder');
    await page.goForward();
    await activeView(page, 'learner');
    for (const [hash, view] of [['horse', 'horse'], ['writing', 'builder'], ['experience', 'builder'], ['education', 'learner'], ['personal', 'horse']]) {
      await page.goto(origin + '/#' + hash);
      await activeView(page, view, false);
      await fits(page, 1440);
      assert.equal(await page.evaluate(() => window.scrollY), 0, 'Deep links keep the header visible');
    }

    // Every local asset and article destination must be available.
    const files = await page.evaluate(() => [...new Set([...document.querySelectorAll('[src], a[href]')].map(el => el.getAttribute('src') || el.getAttribute('href')).filter(url => url && !url.startsWith('#') && !/^(https?:|mailto:)/.test(url)))]);
    files.push('/assets/img/social-preview-v2.png');
    for (const file of files) assert.equal((await page.request.get(new URL(file, origin).href)).status(), 200, file);

    // Resize the same live carousel across breakpoints, then check every face.
    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      for (const view of views) {
        await page.goto(origin + '/#' + view, { waitUntil: 'networkidle' });
        await fits(page, width);
        if (width === 390) {
          await accessibility(page);
          await page.screenshot({ path: join(artifacts, name + '-mobile-' + view + '.png'), fullPage: true });
        }
      }
    }
    // Also resize without reloading, to catch stale 3D face depth.
    await page.setViewportSize({ width: 390, height: 844 });
    await fits(page, 390);
    await page.keyboard.press('Escape');
    await fits(page, 390);
    // A long face must return to the top when navigating away from its bottom.
    await page.locator('.choice-learner').click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByRole('link', { name: 'All sides', exact: true }).click();
    assert.equal(await page.evaluate(() => window.scrollY), 0);

    if (name === 'chromium') {
      await swipe(page, 10, -150);
      await activeView(page, 'home');
      await swipe(page, -120, 10);
      await activeView(page, 'learner');
      await swipe(page, 120, 10);
      await activeView(page, 'home');
    }
    // Motion is user-driven, and OS preferences remove rotation transitions live.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('.choice-learner').click();
    assert.notEqual(await page.locator('.carousel-rotor').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    await page.waitForTimeout(1000);
    const transform = await page.locator('.carousel-rotor').evaluate(el => getComputedStyle(el).transform);
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.carousel-rotor').evaluate(el => getComputedStyle(el).transform), transform, 'No autoplay');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.carousel-rotor').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
    await page.keyboard.press('ArrowRight');
    await activeView(page, 'builder');
    await fits(page, 390);

    for (const slug of ['dawncast-morning-briefing', 'introducing-mdmux']) {
      await page.goto(origin + '/blog/' + slug + '.html', { waitUntil: 'networkidle' });
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('.brand-star, .menu-toggle').count(), 0);
      await accessibility(page);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390, 'Article overflow');
      const code = page.locator('pre').first();
      await code.focus();
      assert.equal(await code.evaluate(el => el === document.activeElement), true);
      await page.screenshot({ path: join(artifacts, name + '-' + slug + '.png') });
      await page.locator('.back-link').first().click();
      await activeView(page, 'builder', false);
    }
    assert.deepEqual(errors, [], 'Browser runtime errors');
    console.log(name + ': carousel, keyboard, touch, history, motion, responsive layout, articles, assets, and accessibility passed');
  } finally { await browser.close(); }
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const artifacts = await mkdtemp(join(tmpdir(), 'jani-carousel-'));
  try {
    await browserChecks(chromium, 'chromium', origin, artifacts);
    await browserChecks(firefox, 'firefox', origin, artifacts);
    const browser = await chromium.launch({ headless: true });
    try {
      const nojs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      await nojs.goto(origin);
      for (const view of views) assert.equal(await nojs.locator('#' + view).isVisible(), true);
      assert.equal(await nojs.locator('.carousel-controls').isVisible(), false);
      await nojs.locator('.choice-builder').click();
      assert.equal(new URL(nojs.url()).hash, '#builder');
      assert.deepEqual(await nojs.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(href => !document.querySelector(href))), [], 'Broken section links');
      const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await fallback.route('**/script.js', route => route.abort());
      await fallback.goto(origin);
      for (const view of views) assert.equal(await fallback.locator('#' + view).isVisible(), true);
      assert.equal(await fallback.evaluate(() => document.documentElement.scrollWidth), 390);
      console.log('Fallbacks: no-JavaScript and failed-script content and navigation passed');
    } finally { await browser.close(); }
    console.log('Screenshots: ' + artifacts);
  } finally { server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
