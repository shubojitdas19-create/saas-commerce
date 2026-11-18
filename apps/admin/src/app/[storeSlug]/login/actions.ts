"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { stores, users } from "@repo/db";
import { eq, and } from "drizzle-orm";
import * as bcrypt from "bcryptjs"; // Import bcrypt to verify the secure hash

export async function loginTenantAction(email: string, password: string, slug: string) {
  try {
    // 1. Find the store by its URL slug (e.g., "the-colour-world")
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });

    if (!store) {
      return { success: false, error: "Store not found." };
    }

    // 2. Find the user who belongs to this specific store and has this email
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        eq(users.storeId, store.id)
      ),
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Invalid email or unauthorized for this store." };
    }

    // 3. Securely Verify Password
    // Uses bcrypt to safely compare the typed password against the encrypted hash in the database
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return { success: false, error: "Incorrect password." };
    }

    // 4. Create a secure session cookie
    // This cookie tells the rest of the application that this user is logged in
    const cookieStore = await cookies();
    cookieStore.set("tenant_session", user.id, {
      httpOnly: true, // Prevents hackers from stealing it via JavaScript
      secure: process.env.NODE_ENV === "production", // Only works on HTTPS in production
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An internal server error occurred." };
  }
}