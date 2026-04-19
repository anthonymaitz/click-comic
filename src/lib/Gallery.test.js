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
