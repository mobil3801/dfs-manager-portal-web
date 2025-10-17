import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fuhbzyvlojamohtjwhde.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aGJ6eXZsb2phbW9odGp3aGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzg4MDksImV4cCI6MjA3NjI1NDgwOX0.RlcPiJBvZmUDZJTCULRIYZqNbzJFz6cCDdZRlZJRFhA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Upload a file to Supabase Storage
 * @param path - The path where the file will be stored (e.g., "employees/profile-123.jpg")
 * @param data - File data as Buffer, Uint8Array, or string
 * @param contentType - MIME type of the file
 * @returns Object with key and public URL
 */
export async function supabaseStoragePut(
  path: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ key: string; url: string }> {
  const bucket = "employee-documents";

  const { data: uploadData, error } = await supabase.storage
    .from(bucket)
    .upload(path, data, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("[Supabase Storage] Upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    key: uploadData.path,
    url: publicUrl,
  };
}

/**
 * Get a public URL for a file in Supabase Storage
 * @param path - The path of the file
 * @returns Object with key and public URL
 */
export async function supabaseStorageGet(
  path: string
): Promise<{ key: string; url: string }> {
  const bucket = "employee-documents";

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    key: path,
    url: publicUrl,
  };
}

