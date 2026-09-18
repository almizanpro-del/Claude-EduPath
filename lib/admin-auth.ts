import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Verifies the request's bearer token against Supabase Auth, then checks
 * the users table (via the service-role client, since RLS on `users` only
 * lets a row read itself) for is_admin = true.
 *
 * This is the ONLY thing standing between the admin API routes and anyone
 * on the internet, since those routes use the service-role client (which
 * bypasses RLS). Every admin route must call this before doing anything.
 */
export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return { authorized: false as const, status: 401, message: 'Missing bearer token' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return { authorized: false as const, status: 500, message: 'Server misconfigured' }
  }

  // A fresh client scoped to just this token -- do not reuse a shared
  // client here, that would risk leaking one request's identity into
  // another concurrent request.
  const supabaseForToken = createClient(supabaseUrl, anonKey)
  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseForToken.auth.getUser(token)

  if (authError || !authUser) {
    return { authorized: false as const, status: 401, message: 'Invalid or expired session' }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, is_admin')
    .eq('id', authUser.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return { authorized: false as const, status: 403, message: 'Admin access required' }
  }

  return { authorized: true as const, userId: authUser.id }
}
