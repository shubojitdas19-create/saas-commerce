import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { stores, users } from "@repo/db";
import { eq, and } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, slug } = await req.json();

    if (!email || !password || !slug) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    // 1. Find the store by its slug
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });

    if (!store) {
      return NextResponse.json({ success: false, error: "Store not found." }, { status: 404 });
    }

    // 2. Find the user for this store
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        eq(users.storeId, store.id)
      ),
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
    }

    // 3. Securely verify the password hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
    }

    // 4. Create the secure session cookie
    const cookieStore = await cookies();
    cookieStore.set("tenant_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Login error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}