import { supabase, supabaseAdmin } from '@/lib/supabase/client';

export function getPublicStorageUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path);
}

export async function uploadFile(bucket: string, path: string, file: File) {
  return supabaseAdmin.storage.from(bucket).upload(path, file);
}

export async function deleteStorageFile(bucket: string, path: string) {
  return supabaseAdmin.storage.from(bucket).remove([path]);
}

export function getPublicPhotoUrl(bucket: string, path: string) {
  return getPublicStorageUrl(bucket, path);
}
