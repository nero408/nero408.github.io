# Jani’s little corner of the internet

An editorial personal site for Jan-Eric Gaidusch, Staff Product Engineer at Parloa. Product stories, small experiments, and life beyond the screen.

## Run locally

The published site is plain HTML, CSS, and JavaScript. There is no production install or build step.

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173. With the optional test dependencies installed, `npm run dev` does the same thing.

## Browser checks

Node dependencies are only for development checks:

```sh
npm ci
npx playwright install chromium firefox
npm run check
npm test
```

The tests start their own temporary local server. They exercise desktop and mobile layouts, sculpture modes, keyboard navigation, career disclosures, live changes to motion preferences, manual pause/resume, local assets, both articles, no-JavaScript content, and animation-library failure. Axe checks WCAG A/AA rules. Screenshots go into a temporary directory printed by the test runner.

## Content and motion

- `index.html` contains the homepage content, including experience and projects. Essential information renders without JavaScript.
- `styles.css` is the shared visual system. `blog/blog.css` adds article typography.
- `script.js` handles navigation, scroll effects, the projected 3D sculpture, motion controls, and article code copying.
- `assets/vendor/gsap/` contains GSAP 3.15.0 and ScrollTrigger, pinned and served locally. Copyright notices are retained; terms are in `LICENSE.txt` and at https://gsap.com/standard-license/.
- `assets/img/{horse,dogs,farm}.jpg` are smaller copies of the existing personal photographs. Original photographs are retained.
- `assets/img/social-preview.png` is a browser capture of the redesigned hero, used for social previews.
- `data.json` and `assets/resume.json` are retained as supplementary profile/resume data. They do not drive homepage rendering.

The sculpture responds to pointer movement and morphs between Orbit, Knot, and Bloom. It stops rendering continuously when off-screen or when the tab is hidden. The OS reduced-motion setting disables automatic motion; the pause buttons in the hero and footer stop motion on demand. Content and a static illustration remain available without JavaScript or GSAP. Fonts use Google Fonts with local system fallbacks. Article syntax highlighting is optional and has a plain-code fallback.

## Design references

The direction draws on experiential portfolios such as [Bruno Simon’s](https://bruno-simon.com/), translated into a readable editorial page: warm paper, oversized typography, acid green accents, real photographs, and interactive artwork. Product stories replace the technology inventory.

[GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) supplies scroll choreography; [GSAP’s responsive-motion guidance](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/) informed motion preference handling. The canvas artwork is original procedural geometry, with no external 3D model, WebGL requirement, or production framework.

## Publishing

Pushes to `master` run the existing FTP deployment workflow and GitHub Pages deployment. `CNAME` retains `jani.gaidus.ch`. This update does not require new hosting, secrets, or recurring services.
