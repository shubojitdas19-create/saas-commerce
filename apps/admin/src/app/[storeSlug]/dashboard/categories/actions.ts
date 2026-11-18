"use server";

import { db } from "@/lib/db";
import { categories, stores } from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createCategoryAction(storeSlug: string, name: string) {
  try {
    // 1. Find the store ID based on the URL slug
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) return { success: false, error: "Store not found" };

    // 2. Generate a clean URL slug for the category (e.g., "interior-emulsions")
    const categorySlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 3. Insert into the database
    await db.insert(categories).values({
      id: crypto.randomUUID(),
      storeId: store.id,
      name: name,
      slug: categorySlug,
    });

    // 4. Refresh the page cache
    revalidatePath(`/${storeSlug}/dashboard/categories`);
    revalidatePath(`/${storeSlug}/dashboard/products/new`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: "Database error while creating category." };
  }
}