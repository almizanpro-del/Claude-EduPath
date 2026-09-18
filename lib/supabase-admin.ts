import 'server-only'
import { createClient } from '@supabase/supabase-js'

// This client uses the SERVICE ROLE key and bypasses Row Level Security
// entirely. It must never be imported from a 'use client' component or
// anything that ends up in the browser bundle -- the `server-only` import
// above makes Next.js throw a build error if that ever happens by mistake.
//
// Because RLS is bypassed, every route that uses this client is
// responsible for doing its own authorization check (see
// lib/admin-auth.ts) before touching the database.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    '[supabase-admin] NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY ' +
      'are not set. Admin API routes will fail until these are configured ' +
      '(Vercel Project Settings -> Environment Variables). ' +
      'SUPABASE_SERVICE_ROLE_KEY is in Supabase Dashboard -> Settings -> API ' +
      '-- treat it like a password, it must NOT have the NEXT_PUBLIC_ prefix.'
  )
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
