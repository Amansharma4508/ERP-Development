// scripts/create-root-admin.mjs
//
// Run this ONCE, manually, from your terminal — never expose this as an API route.
// Usage:
//   node scripts/create-root-admin.mjs you@yourcompany.com "Your Name" "StrongPassword123"
//
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your .env.local
// (load them with `node -r dotenv/config scripts/create-root-admin.mjs ...` if needed,
// or just paste the values directly below for a one-off run).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const [, , email, fullName, password] = process.argv;

if (!email || !fullName || !password) {
  console.error('Usage: node scripts/create-root-admin.mjs <email> <fullName> <password>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('Creating root admin auth user for:', email);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'admin' },
  });

  if (authError) {
    console.error('❌ Failed to create auth user:', authError.message);
    process.exit(1);
  }

  console.log('✅ Auth user created:', authData.user.id);

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    full_name: fullName,
    email,
    account_type: 'admin',
    is_approved: true,
  });

  if (profileError) {
    console.error('❌ Failed to create profile:', profileError.message);
    console.log('🧹 Rolling back auth user...');
    await supabase.auth.admin.deleteUser(authData.user.id);
    process.exit(1);
  }

  console.log('✅ Root admin profile created. You can now log in with this email/password.');
}

main();



// Email: admin123@email.com
// Password: Admin@123
// Role: admin (auto-approved)