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
