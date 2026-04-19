import { readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

export function comicsIndexPlugin() {
  const comicsDir = resolve(process.cwd(), 'public/comics')

  function getSlugs() {
    try {
      return readdirSync(comicsDir).filter(name => {
        try { return statSync(resolve(comicsDir, name)).isDirectory() }
        catch { return false }
      })
    } catch { return [] }
  }

  return {
    name: 'comics-index',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/comics/index.json') {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify(getSlugs()))
        } else {
          next()
        }
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'comics/index.json',
        source: JSON.stringify(getSlugs())
      })
    }
  }
}
