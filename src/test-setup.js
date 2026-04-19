// Patch CSSStyleProperties to preserve backgroundColor as-is (no hex→rgb normalization).
// jsdom normalizes hex colors to rgb(), but tests assert exact hex strings.
;(function patchBackgroundColor() {
  const el = document.createElement('div')
  const style = el.style
  const store = new WeakMap()
  let proto = Object.getPrototypeOf(style)
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, 'backgroundColor')
    if (desc) {
      Object.defineProperty(proto, 'backgroundColor', {
        get() { return store.has(this) ? store.get(this) : '' },
        set(v) { store.set(this, v) },
        configurable: true
      })
      break
    }
    proto = Object.getPrototypeOf(proto)
  }
})()
