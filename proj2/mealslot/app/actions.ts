'use server';

import { client } from "@/lib/neon";
import bcrypt from "bcryptjs";

// ----------------------------
// Low-level functions
// ----------------------------
export async function createUser(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  await client.query(
    `INSERT INTO neon_auth.users_sync (email, password) VALUES ($1, $2)`,
    [email, passwordHash]
  );
  return { email };
}

export async function verifyUser(email: string, password: string) {
  const userResult = await client.query(
    `SELECT * FROM neon_auth.users_sync WHERE email = $1`,
    [email]
  );
  const user = userResult[0];
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return { id: user.id, email: user.email };
}

// ----------------------------
// Aliases for route.ts
// ----------------------------
export const register = createUser;
export const login = verifyUser;

// ----------------------------
// Helper functions
// ----------------------------
export async function getUserByEmail(email: string) {
  const result = await client.query(
    `SELECT * FROM neon_auth.users_sync WHERE email = $1`,
    [email]
  );
  return result[0] || null;
}

export async function getUserDetails(userId: string | undefined) {
  if (!userId) return null;
  const result = await client.query(
    `SELECT * FROM neon_auth.users_sync WHERE id = $1`,
    [userId]
  );
  return result[0] || null;
}
