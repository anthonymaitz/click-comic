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

describe('ClickComic — panel display', () => {
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
    expect(container.style.backgroundColor).toBe('rgb(34, 34, 34)')
  })

  it('falls back to manifest bgColor when panel has no override', async () => {
    const comic = new ClickComic({ container, src: '/comics/test/comic.json' })
    await comic.start()
    container.click()
    container.click()
    expect(container.style.backgroundColor).toBe('rgb(17, 17, 17)')
  })
})

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
    expect(container.style.backgroundColor).toBe('rgb(17, 17, 17)')
  })
})

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
