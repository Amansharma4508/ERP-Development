import { supabase, supabaseAdmin } from '@/lib/supabase/client';

export async function getProfilesForUserList() {
  return supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone_number, photo_url, account_type, is_blocked, created_at, amount_given, amount_used')
    .eq('account_type', 'user')
    .order('created_at', { ascending: false });
}

export async function insertProfile(payload: Record<string, unknown>) {
  return supabaseAdmin.from('profiles').insert(payload);
}

export async function upsertProfile(payload: Record<string, unknown>) {
  return supabaseAdmin
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select();
}

export async function upsertDoctorProfile(payload: Record<string, unknown>) {
  return supabase
    .from('doctor_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select();
}

export async function getHospitalVendors(vendorType?: string) {
  let query = supabaseAdmin.from('hospital_vendors').select('*');
  if (vendorType) {
    query = query.eq('vendor_type', vendorType);
  }
  return query;
}

export async function getDoctorProfiles() {
  return supabaseAdmin.from('doctor_profiles').select('*');
}

export async function getProfileById(id: string) {
  return supabaseAdmin.from('profiles').select('*').eq('id', id).single();
}

export async function getWalletApplicationsCount() {
  return supabase.from('wallet_applications').select('*', { count: 'exact', head: true });
}

export async function getWalletApplicationsRange(from: number, to: number) {
  return supabase
    .from('wallet_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);
}

export async function deleteWalletApplication(id: string) {
  return supabase.from('wallet_applications').delete().eq('id', id);
}

export async function updateWalletApplication(id: string, payload: Record<string, unknown>) {
  return supabase.from('wallet_applications').update(payload).eq('id', id).select();
}

export async function getWalletApplicationByUserId(userId: string) {
  return supabase.from('wallet_applications').select('*').eq('user_id', userId).maybeSingle();
}

export async function getProfileAmountById(userId: string) {
  return supabase.from('profiles').select('amount_given').eq('id', userId).single();
}

export async function updateProfileAmountById(userId: string, amount: number) {
  return supabase.from('profiles').update({ amount_given: amount }).eq('id', userId).select();
}
