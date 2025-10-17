import { createClient } from '@supabase/supabase-js';

// Server setup (trusted, for webhooks/cron/admin APIs)
// Only on the server (Render service or Supabase Edge Functions)
// Uses SERVICE_ROLE_KEY which bypasses RLS - use with caution!
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('[Supabase] Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
  console.warn('[Supabase] Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Admin client with service role - bypasses RLS, use for server-side operations
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Regular client with anon key - respects RLS (optional, for server-side anon client)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

/**
 * Verify current user with a bearer token
 * Example usage in Express: const authHeader = req.headers.authorization;
 */
export async function verifyUser(authHeader: string | undefined) {
  if (!authHeader) {
    return { user: null, error: 'missing token' };
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return { user: null, error: 'missing token' };
  }

  if (!supabaseAdmin) {
    return { user: null, error: 'Supabase admin client not initialized' };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  
  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

/**
 * Sign up a new user with email and password (using admin client)
 */
export async function signUpWithEmail(email: string, password: string, metadata?: { name?: string; role?: string }) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email since we disabled email confirmation
    user_metadata: metadata,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign in with email and password (using regular client)
 */
export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Get user by access token
 */
export async function getUserByToken(token: string) {
  if (!supabaseAdmin) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error) {
    return null;
  }

  return data.user;
}

/**
 * Get user by ID (admin only)
 */
export async function getUserById(userId: string) {
  if (!supabaseAdmin) {
    return null;
  }

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (error) {
    return null;
  }

  return data.user;
}

/**
 * List all users (admin only)
 */
export async function listUsers() {
  if (!supabaseAdmin) {
    return [];
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    console.error('Error listing users:', error);
    return [];
  }

  return data.users;
}

