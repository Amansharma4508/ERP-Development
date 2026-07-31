import { createClient } from '@supabase/supabase-js';
// Ya agar aap standard @supabase/supabase-js use kar rahe hain:
// import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables in .env.local');
}

// SSR package ke sath (Aam taur par Next.js mein yehi use hota hai):
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Agar aap standard client use kar rahe hain toh yeh likhein:
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);