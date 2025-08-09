import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Server-side Supabase client factory.
// Team notes:
// - We prefer the service role key when available to avoid surprises with RLS during reads.
//   Only use the service key on the server — never expose it to the client.
// - If the service role key is not set, we fall back to the anon key which still works when
//   RLS policies permit public reads.
export function getSupabaseServerClient(): SupabaseClient<any, any, any> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    console.warn('Supabase URL missing: set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  }

  const keyToUse = serviceKey || anonKey || ''
  if (!keyToUse) {
    console.warn('Supabase key missing: set SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(url, keyToUse)
}


