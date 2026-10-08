# This repository

- This is a buildless HTML/CSS/JavaScript personal site. Keep production simple; do not introduce a framework or a build requirement for routine updates.
- Homepage content lives in `index.html`; both articles in `blog/` use the shared stylesheet and script. Update all three pages when changing navigation.
- Preserve the original personal photographs. Use smaller web copies on the homepage.
- GSAP and ScrollTrigger are vendored under `assets/vendor/gsap/`; retain copyright notices and the upstream license when updating them.
- Essential content and navigation must work without JavaScript. Motion must honor reduced-motion preferences and both manual pause controls. Stop canvas rendering when off-screen or hidden.
- Development preview: `python3 -m http.server 4173 --bind 127.0.0.1` or `npm run dev`.
- Validation: `npm ci`, `npx playwright install chromium firefox`, `npm run check`, and `npm test`. The browser test starts its own server and writes screenshots to a temporary directory.
- Publishing is through the existing workflows triggered by `master`. Preserve `CNAME` and the FTP configuration. Check both deployment workflows after an authorized push.
- Keep unrelated local `.DS_Store` and `.claude/` edits out of commits.
