import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'public', 'app-icon.svg'))
const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1024 },
  font: { loadSystemFonts: true },
}).render().asPng()

writeFileSync(join(root, 'public', 'app-icon.png'), png)
console.log(`Wrote public/app-icon.png (${png.length} bytes)`)
