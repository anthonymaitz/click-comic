const ADVANCE_KEYS = ['Space', 'ArrowRight', 'ArrowDown']
const SWIPE_THRESHOLD = 50

const CONTAINER_STYLES = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
}

const IMG_STYLES = {
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
  display: 'block',
  userSelect: 'none',
  webkitUserSelect: 'none',
  pointerEvents: 'none'
}

export class ClickComic {
  constructor({ container, src, onComplete = null }) {
    this.container = container
    this.src = src
    this.onComplete = onComplete
    this.manifest = null
    this.currentIndex = 0
    this.autoAdvanceTimer = null
    this._bound = {}
    this._basePath = src.slice(0, src.lastIndexOf('/') + 1)
  }

  async start() {
    this.manifest = await fetch(this.src).then(r => r.json())
    await this._preloadImages()
    this._render()
    this._setupListeners()
    this._showPanel(0)
  }

  _preloadImages() {
    return Promise.all(
      this.manifest.panels.map(panel => new Promise(resolve => {
        const img = new Image()
        img.onload = img.onerror = resolve
        img.src = this._basePath + panel.src
      }))
    )
  }

  _render() {
    this.container.innerHTML = ''
    Object.assign(this.container.style, CONTAINER_STYLES)
    this._img = document.createElement('img')
    this._img.draggable = false
    Object.assign(this._img.style, IMG_STYLES)
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
    const next = this.currentIndex + 1
    if (next < this.manifest.panels.length) {
      this._showPanel(next)
    } else if (this.onComplete) {
      this.onComplete()
    } else {
      this._showPanel(0)
    }
  }

  _setupListeners() {
    let touchStartX = 0
    const b = this._bound
    b.click = () => this._advance()
    b.keydown = e => {
      if (ADVANCE_KEYS.includes(e.code)) {
        e.preventDefault()
        this._advance()
      }
    }
    b.touchstart = e => { touchStartX = e.touches[0].clientX }
    b.touchend = e => {
      if (touchStartX - e.changedTouches[0].clientX > SWIPE_THRESHOLD) this._advance()
    }
    this.container.addEventListener('click', b.click)
    document.addEventListener('keydown', b.keydown)
    this.container.addEventListener('touchstart', b.touchstart, { passive: true })
    this.container.addEventListener('touchend', b.touchend, { passive: true })
  }

  destroy() {
    clearTimeout(this.autoAdvanceTimer)
    const b = this._bound
    this.container.removeEventListener('click', b.click)
    document.removeEventListener('keydown', b.keydown)
    this.container.removeEventListener('touchstart', b.touchstart)
    this.container.removeEventListener('touchend', b.touchend)
    this.container.innerHTML = ''
    for (const key of Object.keys(CONTAINER_STYLES)) this.container.style[key] = ''
    this.container.style.backgroundColor = ''
    this._img = null
    this.manifest = null
  }
}
