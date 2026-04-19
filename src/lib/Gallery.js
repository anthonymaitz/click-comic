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
