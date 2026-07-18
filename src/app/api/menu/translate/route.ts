import { NextRequest } from 'next/server'
import { requireDashboard } from '@/lib/session'
import { MENU_LANGS } from '@/lib/menu'
import { translateToMany, isTranslateConfigured } from '@/lib/googleTranslate'

// POST /api/menu/translate — translate one text from its source language into
// the rest of MENU_LANGS (minus any the caller says to skip, e.g. languages
// the admin has locked to the original text).
export async function POST(req: NextRequest) {
  const session = await requireDashboard()
  if (session instanceof Response) return session

  if (!isTranslateConfigured()) {
    return Response.json({ error: 'Translation is not configured' }, { status: 501 })
  }

  const body = await req.json().catch(() => ({}))
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const sourceLang = (MENU_LANGS as readonly string[]).includes(body.sourceLang) ? body.sourceLang : 'en'
  const skip = new Set(Array.isArray(body.skip) ? body.skip : [])
  if (!text) return Response.json({ error: 'Text is required' }, { status: 400 })

  const targets = MENU_LANGS.filter(l => l !== sourceLang && !skip.has(l))
  const translations = await translateToMany(text, sourceLang, targets)
  return Response.json({ translations })
}
