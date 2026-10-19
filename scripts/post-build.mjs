import { copyFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const dist = resolve('dist')

await copyFile(resolve(dist, 'index.html'), resolve(dist, '404.html'))
await writeFile(resolve(dist, '.nojekyll'), '')

console.log('post-build: wrote dist/404.html and dist/.nojekyll')
