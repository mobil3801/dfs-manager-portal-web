import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
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
 * Create a new user (admin only)
 */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  role?: "user" | "admin";
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const hashedPassword = await hashPassword(data.password);
  
  const userId = crypto.randomUUID();
  
  await db.insert(users).values({
    id: userId,
    email: data.email,
    password: hashedPassword,
    name: data.name || null,
    role: data.role || "user",
    loginMethod: "email_password",
  });

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

