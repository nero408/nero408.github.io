# Jani’s little corner of the internet

A dark, compact personal site for Jan-Eric Gaidusch, Staff Product Engineer at Parloa. Three illustrated entry points lead to learning, building, and life off-screen.

## Run locally

The published site is plain HTML, CSS, and JavaScript. There is no production install or build step.

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open http://127.0.0.1:4173. With the optional test dependencies installed, `npm run dev` does the same thing.

## Browser checks

```sh
npm ci
npx playwright install chromium firefox
npm run check
npm test
```

Development dependencies are only for browser checks. The tests start their own server and exercise carousel selection, wrapping, keyboard and touch navigation, browser history, deep links, motion preferences, responsive layouts, local assets, both articles, and the no-JavaScript fallback. Axe checks WCAG A/AA rules. Screenshots go into a temporary directory printed by the test runner.

## Content and interaction

- `index.html` contains the four carousel faces: the three-avatar introduction, Learner, Builder, and Off duty. The Builder face describes the Product Deployment Group at Parloa and links to the articles.
- `styles.css` supplies the shared dark palette, typography, responsive layout, and CSS 3D rotation. `blog/blog.css` adds article typography.
- `script.js` progressively enhances the ordinary sections into a carousel. It handles hash URLs, history, focus, arrow keys, Escape, swipes, resizing, and article code copying.
- `assets/avatars/{learner,builder,horse}.webp` are custom manga-style cutouts generated using the built-in imagegen tool and existing personal photographs. [Prompts and provenance](assets/avatars/PROMPTS.md) record how the set was created. Transparency is preserved in the WebP exports.
- `assets/img/{horse,dogs,farm}.jpg` are smaller copies of the existing personal photographs. Originals are retained.
- `assets/img/social-preview-v2.png` is a browser capture of the new landing page for social previews. The previous preview remains available.
- `data.json` and `assets/resume.json` are supplementary profile data; they do not drive homepage rendering.

Rotation happens only after user input. Reduced-motion preferences disable transitions, including when the preference changes while the page is open. Inactive faces are inert and excluded from accessibility navigation; selecting a face focuses its heading. Without JavaScript, every section remains visible and the avatar links behave as ordinary anchors. Fonts have system fallbacks; article syntax highlighting is optional. The homepage needs no animation library. Previously vendored GSAP files and their upstream license remain in `assets/vendor/gsap/`.

Interaction follows the [WAI-ARIA carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/), using native links and buttons. Rotation uses CSS [`transform-style: preserve-3d`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style), with [`inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert) to keep hidden faces out of the keyboard sequence.

## Publishing

Pushes to `master` run the existing FTP deployment workflow and GitHub Pages deployment. Preserve `CNAME` (`jani.gaidus.ch`) and the existing deployment configuration. This design uses the existing hosting and adds no recurring service.
