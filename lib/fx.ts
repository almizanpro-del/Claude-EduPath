import { supabase } from '@/lib/supabase'

// Fallback rates: used only if the fx_rates cache is empty (e.g. the daily
// cron hasn't run yet on a brand new deployment) or the query fails. These
// go stale the moment they're written, same as the old hardcoded constants
// this replaces -- they exist purely so the calculator degrades gracefully
// instead of breaking, not as a rate source to rely on.
export const FALLBACK_FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JOD: 0.71,
  AED: 3.67,
  EGP: 30.8,
}

export async function getLatestFxRates(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('fx_rates').select('quote, rate').eq('base', 'USD')

  if (error || !data || data.length === 0) {
    if (error) console.error('Error fetching FX rates, using fallback:', error)
    return FALLBACK_FX_RATES
  }

  const rates: Record<string, number> = { USD: 1 }
  for (const row of data) {
    rates[row.quote] = Number(row.rate)
  }
  // Fill in anything the cache doesn't have yet with the fallback, rather
  // than showing a blank/broken value for that one currency.
  return { ...FALLBACK_FX_RATES, ...rates }
}
