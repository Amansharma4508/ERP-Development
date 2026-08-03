import { supabase, supabaseAdmin } from '@/lib/supabase/client';

export async function getSession() {
  return supabase.auth.getSession();
}

export async function createAdminUser(payload: {
  email: string;
  password: string;
  email_confirm?: boolean;
  user_metadata?: Record<string, unknown>;
}) {
  return supabaseAdmin.auth.admin.createUser(payload);
}

export async function deleteAdminUser(userId: string) {
  return supabaseAdmin.auth.admin.deleteUser(userId);
}

export async function signInWithPassword(credentials: {
  email: string;
  password: string;
}) {
  return supabase.auth.signInWithPassword(credentials);
}

export async function resetPasswordForEmail(email: string, redirectTo?: string) {
  return supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
}

export async function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getUserByToken(token: string) {
  return supabaseAdmin.auth.getUser(token);
}
