/**
 * Image optimization script.
 *
 * Scans `public/sliders/**` for source raster images (.jpg/.jpeg/.png) and, for
 * each one, produces two web-ready files next to it:
 *   - a compressed progressive JPG (mozjpeg)
 *   - a WebP
 *
 * The script is idempotent: it records a hash of each output it writes in
 * `.optimize-cache.json`, and skips files that are already optimized so repeated
 * runs never re-compress (and progressively degrade) an already-processed JPG.
 *
 * Usage:
 *   node scripts/optimize-images.mjs            # process public/sliders
 *   node scripts/optimize-images.mjs public/foo # process a different folder
 *   node scripts/optimize-images.mjs --force    # ignore the cache, reprocess all
 *
 * Requires `sharp` (already installed as a transitive dependency of Next.js).
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, renameSync } from 'node:fs'
import { join, extname, basename, dirname, relative } from 'node:path'
import sharp from 'sharp'

// ---- config ---------------------------------------------------------------

const JPEG_QUALITY = 82
const WEBP_QUALITY = 80
const SOURCE_EXTS = new Set(['.jpg', '.jpeg', '.png'])

const args = process.argv.slice(2)
const force = args.includes('--force')
const rootArg = args.find((a) => !a.startsWith('--'))
const ROOT = join(process.cwd(), rootArg || 'public/sliders')
const CACHE_FILE = join(ROOT, '.optimize-cache.json')

// ---- helpers --------------------------------------------------------------

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (SOURCE_EXTS.has(extname(entry.name).toLowerCase())) out.push(full)
  }
  return out
}

function sha1(buf) {
  return createHash('sha1').update(buf).digest('hex')
}

function loadCache() {
  if (force || !existsSync(CACHE_FILE)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function human(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`
}

// ---- main -----------------------------------------------------------------

async function main() {
  if (!existsSync(ROOT)) {
    console.error(`✗ Folder not found: ${ROOT}`)
    process.exit(1)
  }

  const cache = loadCache()
  const sources = walk(ROOT)

  if (sources.length === 0) {
    console.log(`No source images (${[...SOURCE_EXTS].join(', ')}) found under ${ROOT}`)
    return
  }

  let processed = 0
  let skipped = 0
  let savedBytes = 0

  for (let src of sources) {
    // Normalize the extension to lowercase so output names are predictable and
    // consistent across case-sensitive and case-insensitive file systems.
    const ext = extname(src)
    if (ext !== ext.toLowerCase()) {
      const lowered = join(dirname(src), basename(src, ext) + ext.toLowerCase())
      renameSync(src, lowered)
      src = lowered
    }

    const dir = dirname(src)
    const stem = basename(src, extname(src))
    const outJpg = join(dir, `${stem}.jpg`)
    const outWebp = join(dir, `${stem}.webp`)
    const key = relative(ROOT, outJpg).replace(/\\/g, '/')

    // Skip if we've already optimized this exact output and both files exist.
    if (!force && existsSync(outJpg) && existsSync(outWebp)) {
      const currentHash = sha1(readFileSync(outJpg))
      if (cache[key] && cache[key].jpgHash === currentHash) {
        skipped++
        continue
      }
    }

    const input = readFileSync(src)
    const originalSize = input.length

    const jpgBuf = await sharp(input)
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
      .toBuffer()

    const webpBuf = await sharp(input)
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toBuffer()

    writeFileSync(outJpg, jpgBuf)
    writeFileSync(outWebp, webpBuf)

    cache[key] = { jpgHash: sha1(jpgBuf) }
    processed++
    savedBytes += originalSize - jpgBuf.length

    const rel = relative(process.cwd(), outJpg).replace(/\\/g, '/')
    console.log(
      `✓ ${rel}\n    jpg  ${human(originalSize)} → ${human(jpgBuf.length)}` +
        `   webp ${human(webpBuf.length)}`,
    )
  }

  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n')

  console.log(
    `\nDone. ${processed} optimized, ${skipped} up-to-date.` +
      (processed ? `  JPG bytes saved: ${human(savedBytes)}` : ''),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
