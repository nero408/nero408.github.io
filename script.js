/* Content remains ordinary HTML. The carousel is a progressive enhancement. */
(() => {
  'use strict';

  const year = document.getElementById('currentYear');
  if (year) year.textContent = new Date().getFullYear();

  // Optional article highlighting and accessible copy fallback.
  if (window.hljs) window.hljs.highlightAll();
  document.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const code = button.closest('.code-block').querySelector('code');
      const selectCode = () => {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = 'select & copy';
      };
      if (!navigator.clipboard) { selectCode(); return; }
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = 'copied!';
        button.classList.add('copied');
        setTimeout(() => { button.textContent = 'copy'; button.classList.remove('copied'); }, 1500);
      } catch { selectCode(); }
    });
  });

  const stage = document.querySelector('.carousel-stage');
  if (!stage) return;

  const rotor = document.querySelector('.carousel-rotor');
  const panels = [...document.querySelectorAll('.carousel-panel')];
  const controls = document.querySelector('.carousel-controls');
  const status = document.getElementById('carousel-status');
  const views = ['home', 'learner', 'builder', 'horse'];
  const names = ['All sides', 'Learner', 'Builder', 'Off duty'];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const aliases = { hero: 'home', about: 'learner', education: 'learner', skills: 'learner', experience: 'builder', work: 'builder', writing: 'builder', personal: 'horse' };
  let active = 0;
  let angle = 0;
  let touchStart;
  let resizeFrame;

  function viewFromHash() {
    const hash = window.location.hash.slice(1);
    return views.includes(hash) ? hash : aliases[hash] || 'home';
  }
  function sizeStage() {
    stage.style.setProperty('--depth', (stage.clientWidth / 2) + 'px');
    stage.style.setProperty('--panel-height', panels[active].offsetHeight + 'px');
  }
  function setView(view, { historyMode = 'push', focus = true } = {}) {
    const next = views.indexOf(view);
    if (next < 0) return;
    // Follow the shortest path, including wrapping from the last side to home.
    let delta = next - active;
    if (delta > 2) delta -= 4;
    if (delta < -2) delta += 4;
    angle -= delta * 90;
    active = next;
    document.body.dataset.view = view;
    controls.hidden = view === 'home';
    rotor.style.setProperty('--rotation', angle + 'deg');
    panels[active].inert = false;
    panels[active].setAttribute('aria-hidden', 'false');
    if (focus) panels[active].querySelector('h1, h2').focus({ preventScroll: true });
    panels.forEach((panel, index) => {
      panel.inert = index !== active;
      panel.setAttribute('aria-hidden', String(index !== active));
    });
    document.querySelectorAll('.side-tabs a').forEach(link => {
      if (link.hash === '#' + view) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    sizeStage();
    if (historyMode && window.location.hash !== '#' + view) {
      const url = '#' + view;
      if (historyMode === 'replace') window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    }
    status.textContent = names[active] + '. ' + (active + 1) + ' of ' + panels.length + '.';
    if (focus && window.scrollY > stage.offsetTop) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function step(amount) { setView(views[(active + amount + views.length) % views.length]); }

  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    panels[active].querySelector('h1, h2').focus({ preventScroll: true });
    stage.scrollIntoView({ block: 'start', behavior: 'instant' });
  });

  document.querySelectorAll('.carousel-link').forEach(link => {
    link.addEventListener('click', event => {
      // Preserve open-in-new-tab, modified clicks, and real hash destinations.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const view = link.hash.slice(1);
      if (!views.includes(view)) return;
      event.preventDefault();
      setView(view);
    });
  });
  document.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => step(Number(button.dataset.step)));
  });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    else if (event.key === 'Escape' && active !== 0) { event.preventDefault(); setView('home'); }
  });
  // Horizontal swipes navigate; vertical gestures keep ordinary page scrolling.
  stage.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { touchStart = undefined; return; }
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  stage.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    touchStart = undefined;
  }, { passive: true });
  stage.addEventListener('touchcancel', () => { touchStart = undefined; }, { passive: true });
  window.addEventListener('popstate', () => setView(viewFromHash(), { historyMode: false }));
  window.addEventListener('hashchange', () => setView(viewFromHash(), { historyMode: false }));
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(sizeStage);
  }).observe(stage);
  panels.forEach(panel => new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(sizeStage);
  }).observe(panel));
  reducedMotion.addEventListener('change', sizeStage);

  // Initialize at the final position without an entrance spin or layout jump.
  rotor.style.transition = 'none';
  stage.style.transition = 'none';
  stage.style.setProperty('--depth', (stage.clientWidth / 2) + 'px');
  document.body.classList.add('carousel-ready');
  setView(viewFromHash(), { historyMode: false, focus: false });
  void rotor.offsetHeight;
  rotor.style.removeProperty('transition');
  stage.style.removeProperty('transition');
  if (document.fonts) document.fonts.ready.then(sizeStage);
  // A section hash chooses a face; avoid the browser scrolling its 3D anchor
  // above the header when someone arrives directly from an article or link.
  window.addEventListener('load', () => {
    if (window.location.hash) requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }, { once: true });
})();
