import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fuhbzyvlojamohtjwhde.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aGJ6eXZsb2phbW9odGp3aGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2Nzg4MDksImV4cCI6MjA3NjI1NDgwOX0.RlcPiJBvZmUDZJTCULRIYZqNbzJFz6cCDdZRlZJRFhA";

// Create Supabase client for REST API access
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("users").select("count").limit(1);
    if (error) {
      console.error("[Supabase] Connection test failed:", error);
      return false;
    }
    console.log("[Supabase] Connection successful");
    return true;
  } catch (err) {
    console.error("[Supabase] Connection test error:", err);
    return false;
  }
}

