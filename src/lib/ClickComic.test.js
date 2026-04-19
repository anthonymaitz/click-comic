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
    expect(container.style.backgroundColor).toBe('rgb(17, 17, 17)')
  })
})
