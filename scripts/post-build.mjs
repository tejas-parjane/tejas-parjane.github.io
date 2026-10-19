import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const dist = resolve('dist')
const indexHtml = resolve(dist, 'index.html')

// Routes are emitted as real directories so GitHub Pages serves them with HTTP 200
// instead of falling back to the 404 document.
const routes = [
  'projects',
  'projects/jaheeratech',
  'projects/attention-os',
  'projects/forecasting-engine',
  'projects/agentci',
  'cognitive-os',
  'cognitive-os/business-diagnosis',
  'cognitive-os/agent-autopsy',
  'cognitive-os/hypothesis-arena',
  'engineering',
  'experience',
  'about',
]

for (const route of routes) {
  const target = resolve(dist, route, 'index.html')
  await mkdir(dirname(target), { recursive: true })
  await copyFile(indexHtml, target)
}

// Fallback for unknown paths so the client router can render the 404 view.
await copyFile(indexHtml, resolve(dist, '404.html'))
await writeFile(resolve(dist, '.nojekyll'), '')

console.log(`post-build: emitted ${routes.length} routes, 404.html, and .nojekyll`)
