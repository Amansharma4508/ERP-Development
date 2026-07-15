import { createClient } from '@supabase/supabase-js'

// export const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

const supabaseUrl = 'https://ffpetzczpewaptgpjwvz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmcGV0emN6cGV3YXB0Z3Bqd3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjAzMDgsImV4cCI6MjA5OTU5NjMwOH0.-GKS1wNwO17BPg0s2yWwwVE5tjLhXT0hNz_1d7r-49g' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)