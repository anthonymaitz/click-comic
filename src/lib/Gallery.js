export class Gallery {
  constructor(container) {
    this.container = container
  }

  async render() {
    const slugs = await fetch('/comics/index.json').then(r => r.json())
    const entries = await Promise.all(slugs.map(async slug => {
      const manifest = await fetch(`/comics/${slug}/comic.json`).then(r => r.json())
      return { slug, manifest }
    }))
    this.container.innerHTML = ''
    for (const entry of entries) {
      this.container.appendChild(createCard(entry))
    }
  }
}

function createCard({ slug, manifest }) {
  const encodedSlug = encodeURIComponent(slug)
  const card = document.createElement('a')
  card.className = 'comic-card'
  card.href = `viewer.html?comic=${encodedSlug}`
  card.style.backgroundColor = manifest.bgColor
  card.innerHTML = `
    <div class="comic-card-cover">
      <img src="/comics/${encodedSlug}/${manifest.panels[0].src}" alt="">
    </div>
    <div class="comic-card-body">
      <h3></h3>
      <span></span>
    </div>
  `
  card.querySelector('img').alt = manifest.title
  card.querySelector('h3').textContent = manifest.title
  card.querySelector('span').textContent = `${manifest.panels.length} panels`
  return card
}
