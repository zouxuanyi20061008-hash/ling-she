import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { build } from 'vite'

const frontend = fileURLToPath(new URL('../', import.meta.url))
const { values } = parseArgs({ options: { output: { type: 'string' }, 'api-url': { type: 'string' } } })
const destination = resolve(values.output ?? resolve(frontend, 'dist/standalone/万象书院.html'))
const api = new URL(values['api-url'] ?? process.env.VITE_API_URL ?? 'https://meihua-yishu-web.onrender.com')
const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname)
if ((api.protocol !== 'https:' && !(loopback && api.protocol === 'http:')) || api.href !== api.origin + '/') {
  throw new Error('API URL must be an HTTPS origin, or HTTP on localhost for testing.')
}

const classics = resolve(frontend, 'public/classics')
const files = (await readdir(classics)).filter(name => name.endsWith('.webp'))
const embeddedImages = Object.fromEntries(await Promise.all(files.map(async name => [
  `classics/${name}`, (await readFile(resolve(classics, name))).toString('base64'),
])))

const built = await build({
  root: frontend,
  base: './',
  publicDir: false,
  define: {
    'import.meta.env.VITE_PACKAGED_APP': '"1"',
    'import.meta.env.VITE_API_URL': JSON.stringify(api.origin),
    __PACKAGED_CLASSIC_IMAGES__: JSON.stringify(embeddedImages),
  },
  build: {
    write: false,
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: () => true,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})

const outputs = built.output
const entry = outputs.find(item => item.type === 'chunk' && item.isEntry)
const styles = outputs.find(item => item.type === 'asset' && item.fileName.endsWith('.css'))
const index = outputs.find(item => item.type === 'asset' && item.fileName === 'index.html')
if (outputs.length !== 3 || !entry || !styles || !index || entry.imports.length || entry.dynamicImports.length) {
  throw new Error(`Expected one HTML, one CSS, and one self-contained JavaScript entry: ${outputs.map(item => item.fileName).join(', ')}`)
}

const scriptTag = /<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/
const styleTag = /<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/
const html = index.source.toString()
if (!html.match(scriptTag)?.[1].endsWith(entry.fileName) || !html.match(styleTag)?.[1].endsWith(styles.fileName)) {
  throw new Error('Vite HTML does not reference the expected JavaScript and CSS.')
}

const standalone = html
  .replace(styleTag, () => `<style>${styles.source.toString().replace(/<\/style/gi, '<\\/style')}</style>`)
  .replace(scriptTag, () => `<script type="module">${entry.code.replace(/<\/script/gi, '<\\/script')}</script>`)

await mkdir(dirname(destination), { recursive: true })
await writeFile(destination, standalone, 'utf8')
console.log(`Built ${destination} (${Buffer.byteLength(standalone)} bytes, ${files.length} embedded illustrations), API ${api.origin}`)
