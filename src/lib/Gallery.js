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
    card.href = `viewer.html?comic=${encodeURIComponent(slug)}`
    card.style.backgroundColor = manifest.bgColor

    const cover = document.createElement('div')
    cover.className = 'comic-card-cover'
    const img = document.createElement('img')
    img.src = `/comics/${encodeURIComponent(slug)}/${manifest.panels[0].src}`
    img.alt = manifest.title
    cover.appendChild(img)

    const body = document.createElement('div')
    body.className = 'comic-card-body'
    const h3 = document.createElement('h3')
    h3.textContent = manifest.title
    const span = document.createElement('span')
    span.textContent = `${manifest.panels.length} panels`
    body.appendChild(h3)
    body.appendChild(span)

    card.appendChild(cover)
    card.appendChild(body)
    return card
  }
}
