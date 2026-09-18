import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select(
      `
      id,
      rating_overall,
      rating_affordability,
      rating_visa_ease,
      rating_job_outcomes,
      rating_campus_safety,
      rating_social_life,
      review_text,
      moderation_status,
      created_at,
      user:users ( id, name, email ),
      university:universities ( id, name, country )
    `
    )
    .eq('moderation_status', status)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[admin/reviews GET] query failed:', error)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }

  return NextResponse.json({ reviews: data })
}
