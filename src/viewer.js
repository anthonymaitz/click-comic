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
