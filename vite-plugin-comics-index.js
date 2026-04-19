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
      server.middlewares.use('/comics/index.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(getSlugs()))
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
