import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Currencies the app actually displays (app/calculator/page.tsx). Add here
// if the calculator's currency picker grows.
const TRACKED_QUOTES = ['EUR', 'GBP', 'JOD', 'AED', 'EGP'] as const
const BASE = 'USD'

// exchangerate.host (mentioned in the original plan) now requires a paid
// APILayer account -- it's no longer a no-signup free API. This uses
// @fawazahmed0/currency-api instead: genuinely free, no API key, no rate
// limit, updated daily. It's served from two independent CDNs; if the
// primary fails, fall back to the mirror rather than fail the whole job.
const PRIMARY_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
const FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1/currencies/usd.json'
const SOURCE_NAME = '@fawazahmed0/currency-api'

async function fetchLatestRates(): Promise<Record<string, number>> {
  for (const url of [PRIMARY_URL, FALLBACK_URL]) {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) continue
      const body = await res.json()
      // Response shape: { date: "...", usd: { eur: 0.92, jod: 0.71, ... } }
      if (body?.usd && typeof body.usd === 'object') {
        return body.usd
      }
    } catch {
      // try the next URL
    }
  }
  throw new Error('Both FX rate sources failed')
}

export async function GET(request: Request) {
  // Vercel automatically sends CRON_SECRET as this header when it invokes
  // a scheduled route (see vercel.json). Guard against CRON_SECRET being
  // unset so a missing env var can't accidentally leave this open.
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rates: Record<string, number>
  try {
    rates = await fetchLatestRates()
  } catch (err) {
    console.error('[cron/refresh-fx] fetch failed:', err)
    return NextResponse.json({ error: 'Failed to fetch rates from any source' }, { status: 502 })
  }

  const rows = TRACKED_QUOTES.map((quote) => ({
    base: BASE,
    quote,
    rate: rates[quote.toLowerCase()],
    fetched_at: new Date().toISOString(),
    source: SOURCE_NAME,
  })).filter((row) => typeof row.rate === 'number' && !Number.isNaN(row.rate))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No tracked currencies found in response' }, { status: 502 })
  }

  const { error } = await supabaseAdmin.from('fx_rates').upsert(rows, { onConflict: 'base,quote' })

  if (error) {
    console.error('[cron/refresh-fx] upsert failed:', error)
    return NextResponse.json({ error: 'Failed to store rates' }, { status: 500 })
  }

  return NextResponse.json({ updated: rows.map((r) => r.quote) })
}
