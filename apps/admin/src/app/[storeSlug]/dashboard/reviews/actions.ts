"use server";

import { db } from "@/lib/db";
import { reviews, stores } from "@repo/db";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAdminReviewsAction(storeSlug: string) {
  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) return { success: false, data: [] };

    const data = await db.query.reviews.findMany({
      where: eq(reviews.storeId, store.id),
      orderBy: [desc(reviews.createdAt)],
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch admin reviews:", error);
    return { success: false, data: [] };
  }
}

export async function toggleReviewVisibilityAction(reviewId: string, isVisible: boolean, storeSlug: string) {
  try {
    await db.update(reviews)
      .set({ isVisible })
      .where(eq(reviews.id, reviewId));
      
    revalidatePath(`/${storeSlug}/dashboard/reviews`);
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle visibility:", error);
    return { success: false, error: "Failed to update review visibility." };
  }
}

export async function replyToReviewAction(reviewId: string, adminReply: string, storeSlug: string) {
  try {
    await db.update(reviews)
      .set({ adminReply })
      .where(eq(reviews.id, reviewId));
      
    revalidatePath(`/${storeSlug}/dashboard/reviews`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reply:", error);
    return { success: false, error: "Failed to save reply." };
  }
}

export async function deleteReviewAction(reviewId: string, storeSlug: string) {
  try {
    await db.delete(reviews).where(eq(reviews.id, reviewId));
    
    revalidatePath(`/${storeSlug}/dashboard/reviews`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete review:", error);
    return { success: false, error: "Failed to delete review." };
  }
}