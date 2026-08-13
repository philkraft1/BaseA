import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'public', 'og.svg'))
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1280 },
  font: { loadSystemFonts: true },
}).render().asPng()

writeFileSync(join(root, 'public', 'og.png'), png)
console.log(`Wrote public/og.png (${png.length} bytes)`)
