/* A static page first; animation is a progressive enhancement. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const motionButtons = document.querySelectorAll('.motion-toggle');
  let manuallyPaused = false;
  let motionContext;
  let motionMedia;
  let hasEntered = false;
  let sculpture;
  const motionAllowed = () => !reducedMotion.matches && !manuallyPaused;

  const year = document.getElementById('currentYear');
  if (year) year.textContent = new Date().getFullYear();

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

  // A disclosure menu keeps the native keyboard and touch behavior of links.
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  const closeMenu = (returnFocus = false) => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    if (returnFocus) menuButton.focus();
  };
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true);
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.site-header')) closeMenu();
    });
    nav.addEventListener('focusout', event => {
      if (event.relatedTarget && !event.relatedTarget.closest('.site-header')) closeMenu();
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', () => closeMenu());
  }

  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.reading-progress');
  let scrollPending = false;
  function updateScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 20);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
    scrollPending = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollPending) {
      scrollPending = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScroll);
  updateScroll();

  const waveform = document.querySelector('.waveform');
  if (waveform) {
    for (let i = 0; i < 32; i++) {
      const bar = document.createElement('span');
      bar.style.setProperty('--bar-height', (15 + Math.abs(Math.sin(i * .7) * Math.cos(i * .23)) * 85) + '%');
      bar.style.setProperty('--bar-delay', (-i * .057) + 's');
      waveform.appendChild(bar);
    }
  }

  // A tiny projected 3D mesh: no WebGL requirement, texture downloads, or renderer dependency.
  function createSculpture() {
    const canvas = document.getElementById('sculpture');
    const stage = document.querySelector('.sculpture-stage');
    if (!canvas || !stage) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const loops = window.innerWidth < 761 ? 22 : 32;
    const segments = 160;
    const stride = segments + 1;
    const shapes = [new Float32Array(loops * stride * 3), new Float32Array(loops * stride * 3), new Float32Array(loops * stride * 3)];
    const points = new Float32Array(shapes[0].length);
    const screen = new Float32Array(loops * stride * 3);
    const tau = Math.PI * 2;
    const model = { morph: 1, angle: -.45, tilt: -.55, x: 0, y: 0, targetX: 0, targetY: 0 };
    let width = 1;
    let height = 1;
    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let visible = true;

    function knotCenter(u) {
      const ring = .72 + .3 * Math.cos(3 * u);
      return [ring * Math.cos(2 * u), ring * Math.sin(2 * u), .38 * Math.sin(3 * u)];
    }
    for (let j = 0; j < loops; j++) {
      const v = j / loops * tau;
      for (let i = 0; i <= segments; i++) {
        const u = i / segments * tau;
        const p = (j * stride + i) * 3;
        // Orbit: a thick, gently undulating torus.
        const r = .88 + .33 * Math.cos(v);
        shapes[0][p] = r * Math.cos(u);
        shapes[0][p + 1] = r * Math.sin(u);
        shapes[0][p + 2] = .33 * Math.sin(v) + .1 * Math.sin(3 * u);
        // Knot: a tube around a trefoil, with a local perpendicular frame.
        const c = knotCenter(u);
        const next = knotCenter(u + .001);
        const tx = next[0] - c[0], ty = next[1] - c[1], tz = next[2] - c[2];
        const tlen = Math.hypot(tx, ty, tz);
        const tangent = [tx / tlen, ty / tlen, tz / tlen];
        const nlen = Math.hypot(tangent[0], tangent[1]);
        const normal = [-tangent[1] / nlen, tangent[0] / nlen, 0];
        const binormal = [-tangent[2] * normal[1], tangent[2] * normal[0], tangent[0] * normal[1] - tangent[1] * normal[0]];
        for (let k = 0; k < 3; k++) shapes[1][p + k] = c[k] + .22 * (normal[k] * Math.cos(v) + binormal[k] * Math.sin(v));
        // Bloom: a folded, five-petal spherical surface.
        const latitude = (j / (loops - 1) - .5) * Math.PI;
        const petals = 1 + .27 * Math.cos(5 * u) * Math.pow(Math.cos(latitude), 2);
        shapes[2][p] = petals * Math.cos(latitude) * Math.cos(u);
        shapes[2][p + 1] = petals * Math.cos(latitude) * Math.sin(u);
        shapes[2][p + 2] = .72 * Math.sin(latitude) + .12 * Math.sin(5 * u) * Math.cos(latitude);
      }
    }
    points.set(shapes[0]);

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const angle = model.angle + model.x * .35;
      const tilt = model.tilt + model.y * .25;
      const ca = Math.cos(angle), sa = Math.sin(angle), ct = Math.cos(tilt), st = Math.sin(tilt);
      const scale = Math.min(width, height) * .31;
      const verticalFloat = motionAllowed() ? Math.sin(elapsed * .7) * height * .012 : 0;
      for (let p = 0; p < points.length; p += 3) {
        const x = points[p] * ca - points[p + 1] * sa;
        const ry = points[p] * sa + points[p + 1] * ca;
        const y = ry * ct - points[p + 2] * st;
        const z = ry * st + points[p + 2] * ct;
        const perspective = 3.8 / (3.8 - z);
        screen[p] = width * .5 + x * scale * perspective;
        screen[p + 1] = height * .5 + y * scale * perspective + verticalFloat;
        screen[p + 2] = z;
      }
      ctx.lineWidth = width < 450 ? .7 : .85;
      // Far lines are softer; the wire structure remains legible as it rotates.
      const order = Array.from({ length: loops }, (_, j) => j).sort((a, b) => screen[a * stride * 3 + 2] - screen[b * stride * 3 + 2]);
      for (const j of order) {
        const offset = j * stride * 3;
        let zSum = 0;
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const p = offset + i * 3;
          if (i === 0) ctx.moveTo(screen[p], screen[p + 1]);
          else ctx.lineTo(screen[p], screen[p + 1]);
          zSum += screen[p + 2];
        }
        const depth = zSum / stride;
        ctx.strokeStyle = 'rgba(190,66,35,' + Math.max(.16, Math.min(.85, .42 + depth * .3)) + ')';
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(190,66,35,.20)';
      ctx.lineWidth = .6;
      for (let i = 0; i < segments; i += 6) {
        ctx.beginPath();
        for (let j = 0; j <= loops; j++) {
          const p = ((j % loops) * stride + i) * 3;
          if (j === 0) ctx.moveTo(screen[p], screen[p + 1]);
          else ctx.lineTo(screen[p], screen[p + 1]);
        }
        ctx.stroke();
      }
    }
    function tick(now) {
      // Some browsers delay the media-query change event. Check the live
      // preference here too, and stop the entire choreography immediately.
      if (!motionAllowed()) {
        frame = 0;
        last = 0;
        syncMotion();
        return;
      }
      if (document.hidden || !visible) {
        frame = 0;
        last = 0;
        draw();
        return;
      }
      const delta = last ? Math.min((now - last) / 1000, .05) : 0;
      last = now;
      elapsed += delta;
      model.angle += delta * .12;
      model.x += (model.targetX - model.x) * .06;
      model.y += (model.targetY - model.y) * .06;
      draw();
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (visible && !document.hidden && motionAllowed()) frame = requestAnimationFrame(tick);
      else draw();
    }
    function resize() {
      const bounds = stage.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      sync();
    }, { rootMargin: '80px' });
    observer.observe(stage);
    new ResizeObserver(resize).observe(stage);
    document.addEventListener('visibilitychange', sync);
    stage.addEventListener('pointermove', event => {
      if (!finePointer.matches || !motionAllowed()) return;
      const bounds = stage.getBoundingClientRect();
      model.targetX = (event.clientX - bounds.left) / width * 2 - 1;
      model.targetY = (event.clientY - bounds.top) / height * 2 - 1;
    });
    stage.addEventListener('pointerleave', () => { model.targetX = 0; model.targetY = 0; });

    let morphTween;
    const buttons = document.querySelectorAll('[data-shape]');
    buttons.forEach(button => button.addEventListener('click', () => {
      if (morphTween) morphTween.kill();
      const target = shapes[Number(button.dataset.shape)];
      const start = points.slice();
      model.morph = 0;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      const morph = () => {
        const t = model.morph;
        for (let p = 0; p < points.length; p++) points[p] = start[p] + (target[p] - start[p]) * t;
        if (!frame) draw();
      };
      if (window.gsap && motionAllowed()) {
        morphTween = gsap.to(model, { morph: 1, duration: 1.25, ease: 'power2.inOut', onUpdate: morph });
      } else { model.morph = 1; morph(); }
    }));
    document.querySelector('.sculpture-fallback').hidden = true;
    document.querySelector('.art-controls').hidden = false;
    resize();
    sync();
    return { sync: () => {
      if (!motionAllowed() && morphTween) morphTween.progress(1).kill();
      sync();
    } };
  }
  sculpture = createSculpture();

  function setupMotion() {
    // Explicitly remove media registrations so a later preference change cannot
    // recreate responsive effects after the main animation context was reverted.
    if (motionMedia) motionMedia.revert();
    motionMedia = undefined;
    if (motionContext) motionContext.revert();
    motionContext = undefined;
    if (!window.gsap || !window.ScrollTrigger || !motionAllowed()) return;
    gsap.registerPlugin(ScrollTrigger);
    motionContext = gsap.context(() => {
      if (!hasEntered) {
        hasEntered = true;
        gsap.from('.title-line', { yPercent: 35, opacity: 0, duration: 1.15, stagger: .12, ease: 'power3.out', clearProps: 'all' });
        gsap.from('.hero-intro, .hero-link', { y: 15, opacity: 0, duration: .7, stagger: .1, delay: .35, clearProps: 'all' });
        gsap.from('.playground', { scale: .86, opacity: 0, duration: 1.4, ease: 'power3.out', delay: .15, clearProps: 'all' });
      }
      gsap.utils.toArray('.section-heading, .experience-heading, .writing-layout > h2, .community').forEach(element => {
        gsap.from(element, { y: 30, opacity: 0, duration: .85, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 91%', once: true } });
      });
      gsap.utils.toArray('.project').forEach((element, index) => {
        gsap.from(element, { y: 45 + index * 20, opacity: 0, duration: .95, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 90%', once: true } });
      });
      const manifesto = document.querySelector('.manifesto');
      if (manifesto) {
        if (!manifesto.querySelector('.word')) {
          // Text nodes only, preserving the emphasis and the accessible heading text.
          const walker = document.createTreeWalker(manifesto, NodeFilter.SHOW_TEXT);
          const nodes = [];
          while (walker.nextNode()) nodes.push(walker.currentNode);
          nodes.forEach(node => {
            const fragment = document.createDocumentFragment();
            node.textContent.split(/(\s+)/).forEach(part => {
              if (/^\s*$/.test(part)) fragment.appendChild(document.createTextNode(part));
              else {
                const word = document.createElement('span');
                word.className = 'word';
                word.textContent = part;
                fragment.appendChild(word);
              }
            });
            node.replaceWith(fragment);
          });
        }
        gsap.fromTo(manifesto.querySelectorAll('.word'), { opacity: .5 }, { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: manifesto, start: 'top 85%', end: 'bottom 48%', scrub: .4 } });
      }
      gsap.to('.brand-star', { rotation: 180, ease: 'none', scrollTrigger: { trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: .5 } });
      motionMedia = gsap.matchMedia();
      motionMedia.add('(min-width: 761px)', () => {
        gsap.to('.art-sticker', { rotation: -18, y: -25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 } });
        gsap.fromTo('.photo-horse', { rotation: -8, y: 25 }, { rotation: -3, y: -15, ease: 'none', scrollTrigger: { trigger: '.photo-grid', start: 'top bottom', end: 'bottom 20%', scrub: .7 } });
        gsap.fromTo('.photo-dogs', { rotation: 8, y: 45 }, { rotation: 2, y: -25, ease: 'none', scrollTrigger: { trigger: '.photo-grid', start: 'top bottom', end: 'bottom 20%', scrub: .7 } });
        gsap.fromTo('.photo-farm', { rotation: -6, y: 10 }, { rotation: -1, y: -30, ease: 'none', scrollTrigger: { trigger: '.photo-grid', start: 'top bottom', end: 'bottom 20%', scrub: .7 } });
      });
    });
    ScrollTrigger.refresh();
  }

  function syncMotion() {
    document.body.classList.toggle('motion-paused', !motionAllowed());
    document.documentElement.style.scrollBehavior = motionAllowed() ? '' : 'auto';
    motionButtons.forEach(button => {
      button.hidden = reducedMotion.matches;
      button.setAttribute('aria-pressed', String(manuallyPaused));
      if (button.classList.contains('art-pause')) {
        button.textContent = manuallyPaused ? '▷' : 'Ⅱ';
        const label = manuallyPaused ? 'Resume motion' : 'Pause motion';
        button.setAttribute('aria-label', label);
        button.title = label;
      } else {
        button.innerHTML = manuallyPaused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
      }
    });
    setupMotion();
    if (sculpture) sculpture.sync();
  }
  motionButtons.forEach(button => button.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    syncMotion();
  }));
  reducedMotion.addEventListener('change', syncMotion);
  // Fonts can change line breaks; refresh measurements once they have settled.
  if (document.fonts) document.fonts.ready.then(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  if (document.getElementById('hero')) syncMotion();
})();
