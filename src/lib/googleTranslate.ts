// Google Cloud Translation API (v2, REST + API key) — auto-fills a menu
// item's other languages from whichever one the admin typed. Optional: with
// no key set, callers get `null`/empty results and the UI falls back to
// manual entry, same as the source app's Claude-based translate did.
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY
const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2'

export function isTranslateConfigured(): boolean {
  return !!API_KEY
}

// A single text -> single target language. Returns null on any failure
// (missing key, network error, API error) so callers can degrade gracefully.
async function translateOne(text: string, target: string, source: string): Promise<string | null> {
  if (!API_KEY || !text.trim()) return null
  try {
    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, format: 'text' }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const translated = data?.data?.translations?.[0]?.translatedText
    return typeof translated === 'string' ? translated : null
  } catch (err) {
    console.error(`Google Translate failed (${source} -> ${target})`, err)
    return null
  }
}

// One text translated into several target languages in parallel. Targets that
// fail are simply omitted from the result map — the caller decides what to do
// with the gaps (e.g. leave that language for manual entry).
export async function translateToMany(
  text: string,
  source: string,
  targets: readonly string[],
): Promise<Record<string, string>> {
  const pairs = await Promise.all(
    targets.map(async target => [target, await translateOne(text, target, source)] as const),
  )
  return Object.fromEntries(pairs.filter((p): p is [string, string] => p[1] !== null))
}
