"use server";

import { db } from "@/lib/db";
import { products, productMedia, productVariants, categories, stores } from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Fetch categories for the dropdown
export async function getCategoriesAction(storeSlug: string) {
  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });
    if (!store) return [];

    return await db.query.categories.findMany({
      where: eq(categories.storeId, store.id),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function updateProductAction(
  productId: string,
  storeSlug: string,
  payload: {
    name: string;
    brand: string; // NEW: Brand field
    description: string;
    basePrice: string;
    compareAtPrice: string;
    status: string;
    categoryId: string;
    specifications: { label: string; value: string }[];
    images: string[];
    // NEW: Capture variants with image linking index
    variants: { title: string; sku: string; priceOverride: string; stockQuantity: string; attachedImageIndex: number }[];
  }
) {
  try {
    const productSlug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 1. Update core product details including brand, category, and specifications
    await db.update(products).set({
      name: payload.name,
      slug: productSlug,
      brand: payload.brand || null,
      description: payload.description,
      basePrice: payload.basePrice,
      discountPrice: payload.compareAtPrice || null,
      isArchived: payload.status === "draft",
      categoryId: payload.categoryId || null,
      specifications: payload.specifications,
    }).where(eq(products.id, productId));

    // 2. Refresh media (Delete old images, insert new ones and map their IDs)
    await db.delete(productMedia).where(eq(productMedia.productId, productId));
    
    const uploadedImagesMap: { url: string; id: string }[] = [];

    if (payload.images && payload.images.length > 0) {
      const mediaRecords = payload.images.map((url, index) => {
        const mediaId = crypto.randomUUID();
        uploadedImagesMap.push({ url, id: mediaId });

        return {
          id: mediaId,
          productId: productId,
          url: url,
          mediaType: "image" as const,
          sortOrder: index,
        };
      });
      await db.insert(productMedia).values(mediaRecords);
    }

    // 3. Refresh variants (Delete old variants, insert updated dynamic ones)
    await db.delete(productVariants).where(eq(productVariants.productId, productId));

    if (payload.variants && payload.variants.length > 0) {
      const variantRecords = payload.variants.map((v) => {
        let linkedImageId = null;
        if (v.attachedImageIndex >= 0 && v.attachedImageIndex < uploadedImagesMap.length) {
          linkedImageId = uploadedImagesMap[v.attachedImageIndex].id;
        }

        return {
          id: crypto.randomUUID(),
          productId: productId,
          title: v.title,
          sku: v.sku || null,
          priceOverride: v.priceOverride || null,
          stockQuantity: parseInt(v.stockQuantity) || 0,
          imageId: linkedImageId,
        };
      });

      await db.insert(productVariants).values(variantRecords);
    }

    revalidatePath(`/${storeSlug}/dashboard/products`);
    return { success: true };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Failed to update product." };
  }
}