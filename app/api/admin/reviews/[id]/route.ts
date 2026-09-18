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

  const { data: before } = await supabaseAdmin
    .from('reviews')
    .select('id, moderation_status')
    .eq('id', id)
    .single()

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

  // Best-effort: an audit log failure shouldn't undo or block a moderation
  // decision that already succeeded, but it's worth knowing about.
  const { error: auditError } = await supabaseAdmin.from('audit_log').insert({
    user_id: auth.userId,
    action: nextStatus === 'approved' ? 'review.approve' : 'review.reject',
    entity_type: 'review',
    entity_id: id,
    before,
    after: data,
  })
  if (auditError) {
    console.error('[admin/reviews PATCH] audit log insert failed:', auditError)
  }

  return NextResponse.json({ review: data })
}
