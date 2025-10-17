import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { signInWithEmail, signUpWithEmail, supabase } from "./supabase";

/**
 * Hash a password using bcrypt (kept for backward compatibility)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash (kept for backward compatibility)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Authenticate a user with email and password using Supabase Auth
 */
export async function authenticateUser(email: string, password: string) {
  try {
    // Use Supabase Authentication
    const { session, user } = await signInWithEmail(email, password);
    
    if (!user) {
      return null;
    }

    // Sync user to local database
    const db = await getDb();
    if (db) {
      const existingUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      
      if (existingUser.length === 0) {
        // Create user in local database
        await db.insert(users).values({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
          role: user.user_metadata?.role || 'user',
          loginMethod: 'supabase_auth',
          password: null, // No password stored locally when using Supabase Auth
          lastSignedIn: new Date(),
        });
      } else {
        // Update last signed in
        await db.update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, user.id));
      }

      // Return user from database
      const result = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      return result[0];
    }

    // Fallback: return user from Supabase if database is not available
    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email!.split('@')[0],
      role: user.user_metadata?.role || 'user',
      loginMethod: 'supabase_auth' as const,
      password: null,
      createdAt: new Date(user.created_at),
      lastSignedIn: new Date(),
    };
  } catch (error) {
    console.error('[Auth] Supabase authentication failed:', error);
    
    // Fallback to local authentication for existing users
    return await authenticateUserLocal(email, password);
  }
}

/**
 * Local authentication fallback for existing users with stored passwords
 */
async function authenticateUserLocal(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (result.length === 0) {
    return null; // User not found
  }

  const user = result[0];
  
  if (!user.password) {
    return null; // No password set
  }

  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    return null; // Invalid password
  }

  // Update last signed in
  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  return user;
}

/**
 * Create a new user using Supabase Auth
 */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  role?: "user" | "admin";
}) {
  try {
    // Create user in Supabase Auth
    const { user } = await signUpWithEmail(data.email, data.password, {
      name: data.name,
      role: data.role || 'user',
    });

    if (!user) {
      throw new Error('Failed to create user in Supabase');
    }

    // Sync to local database
    const db = await getDb();
    if (db) {
      await db.insert(users).values({
        id: user.id,
        email: data.email,
        password: null, // No password stored locally when using Supabase Auth
        name: data.name || null,
        role: data.role || "user",
        loginMethod: "supabase_auth",
      });

      const result = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      return result[0];
    }

    // Fallback: return user from Supabase
    return {
      id: user.id,
      email: data.email,
      name: data.name || null,
      role: data.role || 'user',
      loginMethod: 'supabase_auth' as const,
      password: null,
      createdAt: new Date(user.created_at),
      lastSignedIn: new Date(),
    };
  } catch (error) {
    console.error('[Auth] Failed to create user with Supabase:', error);
    throw error;
  }
}

