import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireAdmin(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  let body: { action?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const nextStatus = body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : null
  if (!nextStatus) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update({ moderation_status: nextStatus })
    .eq('id', id)
    .select('id, moderation_status')
    .single()

  if (error) {
    console.error('[admin/reviews PATCH] update failed:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  return NextResponse.json({ review: data })
}
