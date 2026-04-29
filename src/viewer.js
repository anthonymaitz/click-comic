import './viewer.css'
import { ClickComic } from './lib/ClickComic.js'

const slug = new URLSearchParams(window.location.search).get('comic')
const container = document.getElementById('comic-container')

if (slug) {
  const comic = new ClickComic({
    container,
    src: `${import.meta.env.BASE_URL}comics/${encodeURIComponent(slug)}/comic.json`
  })
  comic.start().catch(() => {
    container.textContent = 'Failed to load comic.'
  })
} else {
  window.location.replace(import.meta.env.BASE_URL)
}
