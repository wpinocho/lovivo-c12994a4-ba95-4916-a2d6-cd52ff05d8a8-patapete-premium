import { createClient } from '@supabase/supabase-js'

// User's own Supabase project (connected via Dashboard > Settings > Database)
// For: custom tables, custom edge functions, user-specific backend
// DO NOT confuse with src/lib/supabase.ts (Lovivo shared platform)

const SUPABASE_URL = 'https://vqmqdhsajdldsraxsqba.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbXFkaHNhamRsZHNyYXhzcWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjAzODAsImV4cCI6MjA4NTAzNjM4MH0.oNuhcGyw4Pe1CcZkhLMJ1G4iZ2rOP448lBfWy8ENbwo'

export const userSupabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
export { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY }
