# Click Comic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite-based click comic viewer — a static website with a comic gallery and panel-by-panel viewer, plus a reusable ESM module that games can import for cutscene playback.

**Architecture:** One Vite project produces two outputs: a static site (gallery + viewer pages) built with MPA rollup config, and a standalone ESM library (`click-comic.js`) built with a separate library config. Comics live in `public/comics/<slug>/` as numbered PNGs plus a `comic.json` manifest. A Vite plugin scans that folder at build time and in dev to serve `comics/index.json` automatically.

**Tech Stack:** Vite 5, Vitest 2 (jsdom environment), vanilla JS (no framework), plain CSS

---

## File Map

| File | Purpose |
| --- | --- |
| `src/lib/ClickComic.js` | Core viewer class — manifest fetch, preload, panel display, input, auto-advance, loop/complete |
| `src/lib/ClickComic.test.js` | Vitest unit tests for ClickComic |
| `src/lib/Gallery.js` | Gallery — fetches comics index, renders cover grid |
| `src/lib/Gallery.test.js` | Vitest unit tests for Gallery |
| `src/main.js` | Gallery site entry point |
| `src/viewer.js` | Viewer page entry point |
| `src/gallery.css` | Gallery page styles |
| `src/viewer.css` | Viewer page styles |
| `public/comics/shadows-of-lilim/comic.json` | Shadows of Lilim manifest |
| `public/comics/shadows-of-lilim/01.png … 45.png` | Shadows of Lilim panel images (copied from existing folder) |
| `index.html` | Gallery page HTML template |
| `viewer.html` | Viewer page HTML template |
| `vite.config.js` | Site build config + Vitest config |
| `vite.lib.config.js` | Library-only build config |
| `vite-plugin-comics-index.js` | Vite plugin that generates/serves `comics/index.json` |
| `package.json` | Dependencies and npm scripts |
| `.gitignore` | Ignore node_modules, dist, .superpowers |

---

### Task 1: Scaffold project

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `src/lib/` (directory)
- Create: `public/comics/` (directory)

- [ ] **Step 1: Initialize npm project**

```bash
cd "/Users/anthonymaitz/Repositories/click comic experiment"
npm init -y
```

Expected: `package.json` created.

- [ ] **Step 2: Install dependencies**

```bash
npm install -D vite@^5.4.0 vitest@^2.1.0 @vitest/coverage-v8@^2.1.0
```

Expected: `node_modules/` created, `package.json` updated with devDependencies.

- [ ] **Step 3: Replace package.json contents**

`package.json`:
```json
{
  "name": "click-comic",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && vite build --config vite.lib.config.js",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^2.1.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 4: Create folder structure**

```bash
mkdir -p src/lib public/comics
```

- [ ] **Step 5: Create .gitignore**

`.gitignore`:
```
node_modules/
dist/
.superpowers/
```

- [ ] **Step 6: Commit**

```bash
git init
git add package.json .gitignore
git commit -m "chore: initialize click-comic project"
```

---

### Task 2: Vite config and comics index plugin

**Files:**
- Create: `vite-plugin-comics-index.js`
- Create: `vite.config.js`
- Create: `vite.lib.config.js`

- [ ] **Step 1: Create the comics index Vite plugin**

`vite-plugin-comics-index.js`:
```js
import { readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

export function comicsIndexPlugin() {
  const comicsDir = resolve(process.cwd(), 'public/comics')

  function getSlugs() {
    try {
      return readdirSync(comicsDir).filter(name => {
        try { return statSync(resolve(comicsDir, name)).isDirectory() }
        catch { return false }
      })
    } catch { return [] }
  }

  return {
    name: 'comics-index',
    configureServer(server) {
      server.middlewares.use('/comics/index.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(getSlugs()))
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'comics/index.json',
        source: JSON.stringify(getSlugs())
      })
    }
  }
}
```

- [ ] **Step 2: Create vite.config.js (site build + Vitest)**

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { comicsIndexPlugin } from './vite-plugin-comics-index.js'

export default defineConfig({
  plugins: [comicsIndexPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        viewer: fileURLToPath(new URL('./viewer.html', import.meta.url))
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
```

- [ ] **Step 3: Create vite.lib.config.js (library build)**

`vite.lib.config.js`:
```js
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/lib/ClickComic.js', import.meta.url)),
      name: 'ClickComic',
      fileName: 'click-comic',
      formats: ['es']
    },
    outDir: 'dist/lib',
    emptyOutDir: false
  }
})
```

- [ ] **Step 4: Verify config loads without error**

```bash
npm test 2>&1 | head -10
```

Expected: Vitest starts and reports "no test files found" — no config errors.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js vite.lib.config.js vite-plugin-comics-index.js
git commit -m "chore: add Vite config, library config, and comics index plugin"
```

---

### Task 3: Organize Shadows of Lilim assets

**Files:**
- Create: `public/comics/shadows-of-lilim/comic.json`
- Create: `public/comics/shadows-of-lilim/01.png … 45.png` (copied from existing folder)

- [ ] **Step 1: Create comic folder and copy images**

```bash
mkdir -p "public/comics/shadows-of-lilim"
cp "Shadows of Lilim Test/"*.png "public/comics/shadows-of-lilim/"
```

- [ ] **Step 2: Verify 45 images were copied**

```bash
ls public/comics/shadows-of-lilim/*.png | wc -l
```

Expected: `45`

- [ ] **Step 3: Create comic.json**

`public/comics/shadows-of-lilim/comic.json`:
```json
{
  "title": "Shadows of Lilim",
  "bgColor": "#1a1a2e",
  "panels": [
    { "src": "01.png" },
    { "src": "02.png" },
    { "src": "03.png" },
    { "src": "04.png" },
    { "src": "05.png" },
    { "src": "06.png" },
    { "src": "07.png" },
    { "src": "08.png" },
    { "src": "09.png" },
    { "src": "10.png" },
    { "src": "11.png" },
    { "src": "12.png" },
    { "src": "13.png" },
    { "src": "14.png" },
    { "src": "15.png" },
    { "src": "16.png" },
    { "src": "17.png" },
    { "src": "18.png" },
    { "src": "19.png" },
    { "src": "20.png" },
    { "src": "21.png" },
    { "src": "22.png" },
    { "src": "23.png" },
    { "src": "24.png" },
    { "src": "25.png" },
    { "src": "26.png" },
    { "src": "27.png" },
    { "src": "28.png" },
    { "src": "29.png" },
    { "src": "30.png" },
    { "src": "31.png" },
    { "src": "32.png" },
    { "src": "33.png" },
    { "src": "34.png" },
    { "src": "35.png" },
    { "src": "36.png" },
    { "src": "37.png" },
    { "src": "38.png" },
    { "src": "39.png" },
    { "src": "40.png" },
    { "src": "41.png" },
    { "src": "42.png" },
    { "src": "43.png" },
    { "src": "44.png" },
    { "src": "45.png" }
  ]
}
```

Note: `bgColor` is a starting value — update it to match the actual background color in your panels. To mark a panel as auto-advancing, add `"autoAdvanceMs": <milliseconds>` to that panel object.

- [ ] **Step 4: Commit**

```bash
git add "public/comics/shadows-of-lilim/"
git commit -m "chore: add Shadows of Lilim assets and manifest"
```

---

### Task 4: ClickComic — manifest loading and mount

**Files:**
- Create: `src/lib/ClickComic.js`
- Create: `src/lib/ClickComic.test.js`

- [ ] **Step 1: Write the failing tests**

`src/lib/ClickComic.test.js`:
```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClickComic } from './ClickComic.js'

const MANIFEST = {
  title: 'Test Comic',
  bgColor: '#111111',
  panels: [
    { src: '01.png' },
    { src: '02.png', bgColor: '#222222' },
    { src: '03.png', autoAdvanceMs: 500 }
  ]
}

function mockFetch(manifest = MANIFEST) {
  global.fetch = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(manifest)
  })
}

function mockImage() {
  global.Image = class {
    constructor() { this.onload = null }
    set src(_) { this.onload?.() }
  }
}

describe('ClickComic — manifest loading and mount', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    mockFetch()
    mockImage()
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  it('fetches comic.json from src', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    expect(fetch).toHaveBeenCalledWith('/comics/test/comic.json')
  })

  it('mounts an img element inside the container', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    expect(container.querySelector('img')).not.toBeNull()
  })

  it('shows panel 0 image after start', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    expect(container.querySelector('img').src).toContain('01.png')
  })

  it('sets container bgColor from manifest root for panel 0', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    expect(container.style.backgroundColor).toBe('#111111')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: 4 failing tests — "Cannot find module './ClickComic.js'" or similar.

- [ ] **Step 3: Implement ClickComic**

`src/lib/ClickComic.js`:
```js
export class ClickComic {
  constructor({ container, src, onComplete = null }) {
    this.container = container
    this.src = src
    this.onComplete = onComplete
    this.manifest = null
    this.currentIndex = 0
    this.autoAdvanceTimer = null
    this._bound = {}
    this._basePath = src.substring(0, src.lastIndexOf('/') + 1)
  }

  async start() {
    const res = await fetch(this.src)
    this.manifest = await res.json()
    await this._preloadImages()
    this._render()
    this._setupListeners()
    this._showPanel(0)
  }

  async _preloadImages() {
    return Promise.all(
      this.manifest.panels.map(
        panel =>
          new Promise(resolve => {
            const img = new Image()
            img.onload = img.onerror = resolve
            img.src = this._basePath + panel.src
          })
      )
    )
  }

  _render() {
    this.container.innerHTML = ''
    Object.assign(this.container.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    })
    this._img = document.createElement('img')
    Object.assign(this._img.style, {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      display: 'block',
      userSelect: 'none',
      pointerEvents: 'none'
    })
    this.container.appendChild(this._img)
  }

  _showPanel(index) {
    clearTimeout(this.autoAdvanceTimer)
    const panel = this.manifest.panels[index]
    this.currentIndex = index
    this.container.style.backgroundColor = panel.bgColor ?? this.manifest.bgColor
    this._img.src = this._basePath + panel.src
    if (panel.autoAdvanceMs != null) {
      this.autoAdvanceTimer = setTimeout(() => this._advance(), panel.autoAdvanceMs)
    }
  }

  _advance() {
    clearTimeout(this.autoAdvanceTimer)
    const next = this.currentIndex + 1
    if (next >= this.manifest.panels.length) {
      if (this.onComplete) {
        this.onComplete()
      } else {
        this._showPanel(0)
      }
    } else {
      this._showPanel(next)
    }
  }

  _setupListeners() {
    let touchStartX = 0
    this._bound.click = () => this._advance()
    this._bound.keydown = e => {
      if (['Space', 'ArrowRight', 'ArrowDown'].includes(e.code)) {
        e.preventDefault()
        this._advance()
      }
    }
    this._bound.touchstart = e => { touchStartX = e.touches[0].clientX }
    this._bound.touchend = e => {
      if (touchStartX - e.changedTouches[0].clientX > 50) this._advance()
    }
    this.container.addEventListener('click', this._bound.click)
    document.addEventListener('keydown', this._bound.keydown)
    this.container.addEventListener('touchstart', this._bound.touchstart, { passive: true })
    this.container.addEventListener('touchend', this._bound.touchend, { passive: true })
  }

  destroy() {
    clearTimeout(this.autoAdvanceTimer)
    this.container.removeEventListener('click', this._bound.click)
    document.removeEventListener('keydown', this._bound.keydown)
    this.container.removeEventListener('touchstart', this._bound.touchstart)
    this.container.removeEventListener('touchend', this._bound.touchend)
    this.container.innerHTML = ''
    ;['display', 'alignItems', 'justifyContent', 'overflow', 'backgroundColor'].forEach(
      k => { this.container.style[k] = '' }
    )
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test
```

Expected: 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ClickComic.js src/lib/ClickComic.test.js
git commit -m "feat: ClickComic manifest loading, preload, and panel mount"
```

---

### Task 5: ClickComic — panel display tests

**Files:**
- Modify: `src/lib/ClickComic.test.js`

- [ ] **Step 1: Append panel display tests to ClickComic.test.js**

Add after the last `})` closing the first describe block:

```js
describe('ClickComic — panel display', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    mockFetch()
    mockImage()
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  it('updates img src on advance', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    container.click()
    expect(container.querySelector('img').src).toContain('02.png')
  })

  it('applies panel bgColor override', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    container.click()
    expect(container.style.backgroundColor).toBe('#222222')
  })

  it('falls back to manifest bgColor when panel has no override', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    container.click()
    container.click()
    expect(container.style.backgroundColor).toBe('#111111')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All 7 tests pass — panel display is handled by the existing `_showPanel` implementation.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ClickComic.test.js
git commit -m "test: ClickComic panel display and bgColor override"
```

---

### Task 6: ClickComic — input handling tests

**Files:**
- Modify: `src/lib/ClickComic.test.js`

- [ ] **Step 1: Append input handling tests**

```js
describe('ClickComic — input handling', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    mockFetch()
    mockImage()
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  it('advances on click', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    container.click()
    expect(container.querySelector('img').src).toContain('02.png')
  })

  it('advances on Spacebar', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    expect(container.querySelector('img').src).toContain('02.png')
  })

  it('advances on ArrowRight', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))
    expect(container.querySelector('img').src).toContain('02.png')
  })

  it('advances on ArrowDown', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }))
    expect(container.querySelector('img').src).toContain('02.png')
  })

  it('does not advance on unrelated keys', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' }))
    expect(container.querySelector('img').src).toContain('01.png')
  })

  it('advances on left swipe greater than 50px', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    comic._bound.touchstart({ touches: [{ clientX: 300 }] })
    comic._bound.touchend({ changedTouches: [{ clientX: 240 }] })
    expect(container.querySelector('img').src).toContain('02.png')
  })

  it('does not advance on swipe shorter than 50px', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    comic._bound.touchstart({ touches: [{ clientX: 300 }] })
    comic._bound.touchend({ changedTouches: [{ clientX: 260 }] })
    expect(container.querySelector('img').src).toContain('01.png')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All 14 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ClickComic.test.js
git commit -m "test: ClickComic input handling — click, keyboard, swipe"
```

---

### Task 7: ClickComic — auto-advance and end behavior tests

**Files:**
- Modify: `src/lib/ClickComic.test.js`

- [ ] **Step 1: Append auto-advance and end behavior tests**

```js
describe('ClickComic — auto-advance and end behavior', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    mockFetch()
    mockImage()
    vi.useFakeTimers()
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('auto-advances after autoAdvanceMs', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    container.click() // → panel 1
    container.click() // → panel 2 (autoAdvanceMs: 500)
    vi.advanceTimersByTime(500)
    expect(container.querySelector('img').src).toContain('01.png')
  })

  it('calls onComplete once after last panel', async () => {
    const onComplete = vi.fn()
    const comic = new ClickComic({ container, src: '/comics/test/comic.json', onComplete })
    await comic.start()
    container.click()
    container.click()
    vi.advanceTimersByTime(500)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('loops to panel 0 when no onComplete', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    container.click()
    container.click()
    vi.advanceTimersByTime(500)
    expect(container.querySelector('img').src).toContain('01.png')
    expect(container.style.backgroundColor).toBe('#111111')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All 17 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ClickComic.test.js
git commit -m "test: ClickComic auto-advance and loop/complete behavior"
```

---

### Task 8: ClickComic — destroy tests

**Files:**
- Modify: `src/lib/ClickComic.test.js`

- [ ] **Step 1: Append destroy tests**

```js
describe('ClickComic — destroy', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    mockFetch()
    mockImage()
    vi.useFakeTimers()
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('clears the container innerHTML', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    comic.destroy()
    expect(container.innerHTML).toBe('')
  })

  it('cancels a pending auto-advance timer', async () => {
    const onComplete = vi.fn()
    const comic = new ClickComic({ container, src: '/comics/test/comic.json', onComplete })
    await comic.start()
    container.click()
    container.click()
    comic.destroy()
    vi.advanceTimersByTime(500)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('does not throw when clicked after destroy', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    comic.destroy()
    expect(() => container.click()).not.toThrow()
  })

  it('does not throw on keydown after destroy', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    comic.destroy()
    expect(() =>
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))
    ).not.toThrow()
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All 21 tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ClickComic.test.js
git commit -m "test: ClickComic destroy cleanup"
```

---

### Task 9: Gallery

**Files:**
- Create: `src/lib/Gallery.js`
- Create: `src/lib/Gallery.test.js`

- [ ] **Step 1: Write Gallery tests**

`src/lib/Gallery.test.js`:
```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Gallery } from './Gallery.js'

const INDEX = ['shadows-of-lilim', 'another-comic']
const MANIFESTS = {
  'shadows-of-lilim': {
    title: 'Shadows of Lilim',
    bgColor: '#1a1a2e',
    panels: [{ src: '01.png' }, { src: '02.png' }]
  },
  'another-comic': {
    title: 'Another Comic',
    bgColor: '#2a1e1e',
    panels: [{ src: '01.png' }]
  }
}

function mockFetch() {
  global.fetch = vi.fn(url => {
    if (url === '/comics/index.json') {
      return Promise.resolve({ json: () => Promise.resolve(INDEX) })
    }
    const slug = url.match(/\/comics\/(.+)\/comic\.json/)?.[1]
    return Promise.resolve({ json: () => Promise.resolve(MANIFESTS[slug]) })
  })
}

describe('Gallery', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    mockFetch()
  })

  afterEach(() => {
    container.remove()
    vi.restoreAllMocks()
  })

  it('renders one card per comic', async () => {
    const gallery = new Gallery(container)
    await gallery.render()
    expect(container.querySelectorAll('.comic-card').length).toBe(2)
  })

  it('sets card background to comic bgColor', async () => {
    const gallery = new Gallery(container)
    await gallery.render()
    expect(container.querySelector('.comic-card').style.backgroundColor).toBeTruthy()
  })

  it('shows comic title in each card', async () => {
    const gallery = new Gallery(container)
    await gallery.render()
    const titles = [...container.querySelectorAll('.comic-card h3')].map(el => el.textContent)
    expect(titles).toContain('Shadows of Lilim')
    expect(titles).toContain('Another Comic')
  })

  it('shows panel count', async () => {
    const gallery = new Gallery(container)
    await gallery.render()
    const spans = container.querySelectorAll('.comic-card span')
    expect(spans[0].textContent).toBe('2 panels')
    expect(spans[1].textContent).toBe('1 panels')
  })

  it('links each card to viewer.html with the comic slug', async () => {
    const gallery = new Gallery(container)
    await gallery.render()
    const cards = container.querySelectorAll('.comic-card')
    expect(cards[0].getAttribute('href')).toContain('shadows-of-lilim')
    expect(cards[1].getAttribute('href')).toContain('another-comic')
  })

  it('uses first panel as cover image', async () => {
    const gallery = new Gallery(container)
    await gallery.render()
    const img = container.querySelector('.comic-card img')
    expect(img.getAttribute('src')).toContain('shadows-of-lilim/01.png')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test
```

Expected: 6 failing Gallery tests — "Cannot find module './Gallery.js'".

- [ ] **Step 3: Implement Gallery**

`src/lib/Gallery.js`:
```js
export class Gallery {
  constructor(container) {
    this.container = container
  }

  async render() {
    const slugs = await fetch('/comics/index.json').then(r => r.json())
    const entries = await Promise.all(
      slugs.map(slug =>
        fetch(`/comics/${slug}/comic.json`)
          .then(r => r.json())
          .then(manifest => ({ slug, manifest }))
      )
    )
    this.container.innerHTML = ''
    for (const { slug, manifest } of entries) {
      this.container.appendChild(this._createCard(slug, manifest))
    }
  }

  _createCard(slug, manifest) {
    const card = document.createElement('a')
    card.className = 'comic-card'
    card.href = `viewer.html?comic=${slug}`
    card.style.backgroundColor = manifest.bgColor
    card.innerHTML = `
      <div class="comic-card-cover">
        <img src="/comics/${slug}/${manifest.panels[0].src}" alt="${manifest.title}">
      </div>
      <div class="comic-card-body">
        <h3>${manifest.title}</h3>
        <span>${manifest.panels.length} panels</span>
      </div>
    `
    return card
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: All 27 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/Gallery.js src/lib/Gallery.test.js
git commit -m "feat: Gallery fetches comics index and renders cover grid"
```

---

### Task 10: HTML, CSS, and entry points

**Files:**
- Create: `index.html`
- Create: `viewer.html`
- Create: `src/gallery.css`
- Create: `src/viewer.css`
- Create: `src/main.js`
- Create: `src/viewer.js`

- [ ] **Step 1: Create index.html**

`index.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Click Comics</title>
</head>
<body>
  <header class="gallery-header">
    <h1>Click Comics</h1>
  </header>
  <main class="comic-grid" id="gallery"></main>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create viewer.html**

`viewer.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Click Comic</title>
</head>
<body>
  <div id="comic-container"></div>
  <script type="module" src="/src/viewer.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create src/gallery.css**

`src/gallery.css`:
```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #0d0d0d;
  color: #eee;
  font-family: system-ui, -apple-system, sans-serif;
  min-height: 100vh;
}

.gallery-header {
  text-align: center;
  padding: 48px 24px 32px;
}

.gallery-header h1 {
  letter-spacing: 4px;
  text-transform: uppercase;
  font-weight: 300;
  font-size: 1.1rem;
}

.comic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 0 24px 48px;
  max-width: 1200px;
  margin: 0 auto;
}

.comic-card {
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  text-decoration: none;
  display: block;
  transition: transform 0.15s ease;
}

.comic-card:hover {
  transform: scale(1.02);
}

.comic-card-cover img {
  width: 100%;
  display: block;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}

.comic-card-body {
  padding: 10px 12px 14px;
}

.comic-card-body h3 {
  font-size: 0.85rem;
  font-weight: 500;
  color: #ddd;
  margin-bottom: 4px;
}

.comic-card-body span {
  font-size: 0.75rem;
  color: #666;
}
```

- [ ] **Step 4: Create src/viewer.css**

`src/viewer.css`:
```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#comic-container {
  width: 100vw;
  height: 100vh;
  cursor: pointer;
}
```

- [ ] **Step 5: Create src/main.js**

`src/main.js`:
```js
import './gallery.css'
import { Gallery } from './lib/Gallery.js'

new Gallery(document.getElementById('gallery')).render()
```

- [ ] **Step 6: Create src/viewer.js**

`src/viewer.js`:
```js
import './viewer.css'
import { ClickComic } from './lib/ClickComic.js'

const slug = new URLSearchParams(window.location.search).get('comic')

if (slug) {
  const comic = new ClickComic({
    container: document.getElementById('comic-container'),
    src: `/comics/${slug}/comic.json`
  })
  comic.start()
}
```

- [ ] **Step 7: Start dev server and verify in browser**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:

- Gallery shows "CLICK COMICS" header
- "Shadows of Lilim" card appears with cover image and its bgColor background
- Clicking the card opens `viewer.html?comic=shadows-of-lilim`
- Viewer shows panel 1 filling the screen
- Click/spacebar/arrow keys advance through panels
- After panel 45, loops back to panel 1
- Swipe left on a touch device or touch-enabled browser advances panels

- [ ] **Step 8: Commit**

```bash
git add index.html viewer.html src/main.js src/viewer.js src/gallery.css src/viewer.css
git commit -m "feat: gallery and viewer pages with styles and entry points"
```

---

### Task 11: Build verification

**Files:** No new files — verifies build outputs are correct.

- [ ] **Step 1: Run the full build**

```bash
npm run build
```

Expected: No errors. `dist/` folder created.

- [ ] **Step 2: Verify comics/index.json was generated**

```bash
cat dist/comics/index.json
```

Expected: `["shadows-of-lilim"]`

- [ ] **Step 3: Verify library output exists**

```bash
ls dist/lib/
```

Expected: `click-comic.js` is present.

```bash
head -3 dist/lib/click-comic.js
```

Expected: ES module content — starts with `class ClickComic` or a similar ES module declaration (no `require(`, no CommonJS).

- [ ] **Step 4: Preview the built site**

```bash
npm run preview
```

Open `http://localhost:4173`. Verify gallery and viewer work identically to dev mode.

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: All 27 tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: verified production build — site and ESM module output correct"
```

---

## Embedding in a Game (reference)

After building, copy `dist/lib/click-comic.js` into your game project and use it like this:

```js
import { ClickComic } from './click-comic.js'

function playCutscene(slug, onDone) {
  const layer = document.getElementById('cutscene-layer')
  layer.style.display = 'block'

  const comic = new ClickComic({
    container: layer,
    src: `/comics/${slug}/comic.json`,
    onComplete: () => {
      comic.destroy()
      layer.style.display = 'none'
      onDone()
    }
  })

  comic.start()
}
```

The module has no external dependencies and no side effects outside the container element.
