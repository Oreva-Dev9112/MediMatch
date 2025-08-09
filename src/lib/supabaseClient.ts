import { createClient } from '@supabase/supabase-js'

// Browser-side Supabase client for future UI features.
// We currently only read through the server API, but this keeps the door open for
// client-side features like realtime or optimistic UI.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep this as a runtime guard without throwing during build
  console.warn('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')


