/**
 * SaaS Commerce - Tenant Assistant Tool Calling Engine
 * 
 * Strict, type-safe queries and mutations backed by Drizzle ORM.
 * Multi-tenant safety: All actions are scoped to the authenticated merchant's storeId.
 */

import { db } from "@/lib/db";
import { products, productVariants, categories, orders, orderItems, reviews } from "@repo/db";
import { eq, and, like, or, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
}

// ========================================================
// 1. QUERY TOOLS ("Eyes")
// ========================================================

/**
 * Searches the tenant's product catalog by keyword.
 */
export async function searchStoreProducts(
  storeId: string, 
  query: string, 
  limit = 5
): Promise<ToolResult> {
  try {
    const searchTerm = `%${query.trim()}%`;
    const records = await db.query.products.findMany({
      where: and(
        eq(products.storeId, storeId),
        or(
          like(products.name, searchTerm),
          like(products.brand, searchTerm),
          like(products.description, searchTerm)
        )
      ),
      with: {
        category: true,
        variants: true
      },
      limit: limit,
      orderBy: [desc(products.createdAt)]
    });

    const formatted = records.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand || "N/A",
      category: p.category?.name || "Uncategorized",
      basePrice: p.basePrice,
      discountPrice: p.discountPrice,
      isArchived: p.isArchived,
      variants: p.variants.map(v => ({
        id: v.id,
        title: v.title,
        priceOverride: v.priceOverride || p.basePrice,
        stockQuantity: v.stockQuantity,
        sku: v.sku || "N/A"
      }))
    }));

    return {
      success: true,
      message: `Found ${formatted.length} product(s) matching "${query}".`,
      data: formatted
    };
  } catch (error: any) {
    console.error("searchStoreProducts error:", error);
    return { success: false, message: `Failed to search products: ${error.message}` };
  }
}

/**
 * Retrieves the store's active categories.
 */
export async function getStoreCategories(storeId: string): Promise<ToolResult> {
  try {
    const cats = await db.query.categories.findMany({
      where: eq(categories.storeId, storeId),
      orderBy: (categories, { asc }) => [asc(categories.name)]
    });

    return {
      success: true,
      message: `Retrieved ${cats.length} category/categories.`,
      data: cats.map(c => ({ id: c.id, name: c.name, slug: c.slug }))
    };
  } catch (error: any) {
    console.error("getStoreCategories error:", error);
    return { success: false, message: `Failed to fetch categories: ${error.message}` };
  }
}

/**
 * Fetches recent orders for the store.
 */
export async function getStoreRecentOrders(storeId: string, limit = 5): Promise<ToolResult> {
  try {
    const recent = await db.query.orders.findMany({
      where: eq(orders.storeId, storeId),
      orderBy: [desc(orders.createdAt)],
      limit: limit,
      with: {
        items: true
      }
    });

    return {
      success: true,
      message: `Fetched ${recent.length} recent orders.`,
      data: recent.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: o.totalAmount,
        status: o.status,
        itemCount: o.items.length,
        createdAt: o.createdAt
      }))
    };
  } catch (error: any) {
    console.error("getStoreRecentOrders error:", error);
    return { success: false, message: `Failed to fetch orders: ${error.message}` };
  }
}

// ========================================================
// 2. ACTION TOOLS ("Hands")
// ========================================================

/**
 * Adds one or more variants (pack sizes, book editions, shank sizes) to an existing product.
 */
export async function addProductVariants(
  storeId: string,
  storeSlug: string,
  productId: string,
  newVariants: Array<{
    title: string;
    priceOverride: string;
    stockQuantity: number;
    sku?: string;
  }>
): Promise<ToolResult> {
  try {
    // 1. Verify the product belongs to this store
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, storeId))
    });

    if (!product) {
      return { success: false, message: "Product not found or unauthorized." };
    }

    if (!newVariants || newVariants.length === 0) {
      return { success: false, message: "No variants provided to add." };
    }

    // 2. Create the variant records
    const insertedRecords = [];
    for (const v of newVariants) {
      const variantId = crypto.randomUUID();
      await db.insert(productVariants).values({
        id: variantId,
        productId: productId,
        title: v.title,
        priceOverride: v.priceOverride ? v.priceOverride.toString() : product.basePrice,
        stockQuantity: Number(v.stockQuantity) || 0,
        sku: v.sku || null
      });
      insertedRecords.push({ id: variantId, ...v });
    }

    // 3. Revalidate dashboard cache
    revalidatePath(`/${storeSlug}/dashboard/products`);
    revalidatePath(`/${storeSlug}/dashboard/products/${productId}`);

    return {
      success: true,
      message: `Successfully added ${insertedRecords.length} variant(s) to "${product.name}".`,
      data: {
        productId,
        productName: product.name,
        addedVariants: insertedRecords
      }
    };
  } catch (error: any) {
    console.error("addProductVariants error:", error);
    return { success: false, message: `Failed to add variants: ${error.message}` };
  }
}

/**
 * Updates the price of an existing product.
 */
export async function updateProductPrice(
  storeId: string,
  storeSlug: string,
  productId: string,
  basePrice: string,
  discountPrice?: string
): Promise<ToolResult> {
  try {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, storeId))
    });

    if (!product) {
      return { success: false, message: "Product not found or unauthorized." };
    }

    const updatePayload: any = {
      basePrice: basePrice.toString(),
      updatedAt: new Date()
    };

    if (discountPrice !== undefined) {
      updatePayload.discountPrice = discountPrice ? discountPrice.toString() : null;
    }

    await db.update(products).set(updatePayload).where(eq(products.id, productId));

    revalidatePath(`/${storeSlug}/dashboard/products`);
    revalidatePath(`/${storeSlug}/dashboard/products/${productId}`);

    return {
      success: true,
      message: `Updated price for "${product.name}" to ₹${basePrice}${discountPrice ? ` (Discount: ₹${discountPrice})` : ""}.`,
      data: { productId, productName: product.name, newPrice: basePrice }
    };
  } catch (error: any) {
    console.error("updateProductPrice error:", error);
    return { success: false, message: `Failed to update price: ${error.message}` };
  }
}

/**
 * Creates a new category for the store.
 */
export async function createStoreCategory(
  storeId: string,
  storeSlug: string,
  name: string
): Promise<ToolResult> {
  try {
    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if category already exists
    const existing = await db.query.categories.findFirst({
      where: and(eq(categories.storeId, storeId), eq(categories.slug, slug))
    });

    if (existing) {
      return {
        success: true,
        message: `Category "${trimmedName}" already exists.`,
        data: existing
      };
    }

    const categoryId = crypto.randomUUID();
    await db.insert(categories).values({
      id: categoryId,
      storeId: storeId,
      name: trimmedName,
      slug: slug
    });

    revalidatePath(`/${storeSlug}/dashboard/categories`);
    revalidatePath(`/${storeSlug}/dashboard/products/new`);

    return {
      success: true,
      message: `Created new category "${trimmedName}" successfully.`,
      data: { id: categoryId, name: trimmedName, slug }
    };
  } catch (error: any) {
    console.error("createStoreCategory error:", error);
    return { success: false, message: `Failed to create category: ${error.message}` };
  }
}

/**
 * Toggles a product between published and archived/draft status.
 */
export async function toggleProductStatus(
  storeId: string,
  storeSlug: string,
  productId: string,
  isArchived: boolean
): Promise<ToolResult> {
  try {
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.storeId, storeId))
    });

    if (!product) {
      return { success: false, message: "Product not found or unauthorized." };
    }

    await db.update(products).set({
      isArchived: isArchived,
      updatedAt: new Date()
    }).where(eq(products.id, productId));

    revalidatePath(`/${storeSlug}/dashboard/products`);
    revalidatePath(`/${storeSlug}/dashboard/products/${productId}`);

    const statusLabel = isArchived ? "Draft / Hidden" : "Published / Live";
    return {
      success: true,
      message: `"${product.name}" is now marked as ${statusLabel}.`,
      data: { productId, isArchived }
    };
  } catch (error: any) {
    console.error("toggleProductStatus error:", error);
    return { success: false, message: `Failed to toggle status: ${error.message}` };
  }
}

/**
 * Creates a brand-new product from scratch with optional variants, brand, description, and specs.
 */
export async function createStoreProduct(
  storeId: string,
  storeSlug: string,
  payload: {
    name: string;
    brand?: string;
    description?: string;
    basePrice: string;
    discountPrice?: string;
    categoryName?: string;
    specifications?: Array<{ label: string; value: string }>;
    variants?: Array<{ title: string; priceOverride: string; stockQuantity: number; sku?: string }>;
  }
): Promise<ToolResult> {
  try {
    const newProductId = crypto.randomUUID();
    const cleanSlugBase = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const productSlug = `${cleanSlugBase || 'product'}-${Date.now().toString().slice(-4)}`;

    // Resolve or auto-create category if specified
    let categoryId: string | null = null;
    if (payload.categoryName && payload.categoryName.trim()) {
      const catTrimmed = payload.categoryName.trim();
      const catSlug = catTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existingCat = await db.query.categories.findFirst({
        where: and(eq(categories.storeId, storeId), eq(categories.slug, catSlug))
      });

      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        categoryId = crypto.randomUUID();
        await db.insert(categories).values({
          id: categoryId,
          storeId: storeId,
          name: catTrimmed,
          slug: catSlug
        });
      }
    }

    await db.insert(products).values({
      id: newProductId,
      storeId: storeId,
      categoryId: categoryId,
      brand: payload.brand || null,
      name: payload.name,
      slug: productSlug,
      description: payload.description || "Created via Store Copilot.",
      basePrice: payload.basePrice ? payload.basePrice.toString() : "0.00",
      discountPrice: payload.discountPrice ? payload.discountPrice.toString() : null,
      isArchived: false,
      isFeatured: false,
      specifications: payload.specifications || []
    });

    // Add variants
    const insertedVariants = [];
    if (payload.variants && payload.variants.length > 0) {
      for (const v of payload.variants) {
        const vId = crypto.randomUUID();
        await db.insert(productVariants).values({
          id: vId,
          productId: newProductId,
          title: v.title,
          priceOverride: v.priceOverride ? v.priceOverride.toString() : payload.basePrice,
          stockQuantity: Number(v.stockQuantity) || 10,
          sku: v.sku || null
        });
        insertedVariants.push({ id: vId, ...v });
      }
    } else {
      const defaultVId = crypto.randomUUID();
      await db.insert(productVariants).values({
        id: defaultVId,
        productId: newProductId,
        title: "Standard Edition",
        priceOverride: payload.basePrice ? payload.basePrice.toString() : "0.00",
        stockQuantity: 50,
        sku: null
      });
      insertedVariants.push({ id: defaultVId, title: "Standard Edition", priceOverride: payload.basePrice, stockQuantity: 50 });
    }

    revalidatePath(`/${storeSlug}/dashboard/products`);
    revalidatePath(`/${storeSlug}/dashboard/products/new`);

    return {
      success: true,
      message: `Successfully created product "${payload.name}" with ${insertedVariants.length} variant(s).`,
      data: {
        productId: newProductId,
        name: payload.name,
        slug: productSlug,
        basePrice: payload.basePrice,
        viewUrl: `/${storeSlug}/dashboard/products/${newProductId}`,
        variants: insertedVariants
      }
    };
  } catch (error: any) {
    console.error("createStoreProduct error:", error);
    return { success: false, message: `Failed to create product: ${error.message}` };
  }
}

/**
 * Retrieves overall store performance metrics (products, orders, revenue, reviews).
 */
export async function getStoreOverview(storeId: string): Promise<ToolResult> {
  try {
    const allProducts = await db.query.products.findMany({
      where: eq(products.storeId, storeId),
      columns: { id: true, isArchived: true }
    });
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter(p => !p.isArchived).length;
    const draftProducts = allProducts.filter(p => p.isArchived).length;

    const allCategories = await db.query.categories.findMany({
      where: eq(categories.storeId, storeId),
      columns: { id: true }
    });

    const allOrders = await db.query.orders.findMany({
      where: eq(orders.storeId, storeId),
      columns: { id: true, status: true, totalAmount: true }
    });

    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o => o.status === "pending").length;
    const acceptedOrders = allOrders.filter(o => o.status === "accepted" || o.status === "processing").length;
    const deliveredOrders = allOrders.filter(o => o.status === "delivered").length;
    const totalRevenue = allOrders
      .filter(o => o.status !== "cancelled")
      .reduce((sum, o) => sum + (parseFloat(o.totalAmount || "0") || 0), 0);

    const allReviews = await db.query.reviews.findMany({
      where: eq(reviews.storeId, storeId),
      columns: { id: true, rating: true, isVisible: true }
    });

    const averageRating = allReviews.length > 0 
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : "N/A";

    return {
      success: true,
      message: "Fetched live store overview metrics.",
      data: {
        totalProducts,
        activeProducts,
        draftProducts,
        totalCategories: allCategories.length,
        totalOrders,
        pendingOrders,
        acceptedOrders,
        deliveredOrders,
        totalRevenue: `₹${totalRevenue.toFixed(2)}`,
        totalReviews: allReviews.length,
        averageRating: averageRating !== "N/A" ? `${averageRating} / 5.0` : "No ratings yet"
      }
    };
  } catch (error: any) {
    console.error("getStoreOverview error:", error);
    return { success: false, message: `Failed to fetch overview: ${error.message}` };
  }
}

/**
 * Searches a specific order by order number, customer name, or phone.
 */
export async function lookupStoreOrder(
  storeId: string,
  query: string
): Promise<ToolResult> {
  try {
    const cleanQuery = query.trim();
    const searchTerm = `%${cleanQuery}%`;

    const matchedOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.storeId, storeId),
        or(
          like(orders.orderNumber, searchTerm),
          like(orders.customerName, searchTerm),
          like(orders.customerPhone, searchTerm)
        )
      ),
      with: {
        items: true
      },
      limit: 5,
      orderBy: [desc(orders.createdAt)]
    });

    if (matchedOrders.length === 0) {
      return {
        success: true,
        message: `No orders found matching "${cleanQuery}".`,
        data: []
      };
    }

    // Resolve product names
    const prodMap = new Map<string, string>();
    const prods = await db.query.products.findMany({
      where: eq(products.storeId, storeId),
      columns: { id: true, name: true }
    });
    prods.forEach(p => prodMap.set(p.id, p.name));

    const formatted = matchedOrders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      shippingAddress: o.shippingAddress,
      totalAmount: `₹${o.totalAmount}`,
      status: o.status,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      items: o.items.map(it => ({
        productName: prodMap.get(it.productId) || "Product Item",
        quantity: it.quantity,
        price: `₹${it.price}`
      }))
    }));

    return {
      success: true,
      message: `Found ${formatted.length} matching order(s).`,
      data: formatted
    };
  } catch (error: any) {
    console.error("lookupStoreOrder error:", error);
    return { success: false, message: `Failed to lookup order: ${error.message}` };
  }
}

/**
 * Moderates a review: toggle visibility or post an admin reply.
 */
export async function moderateReview(
  storeId: string,
  storeSlug: string,
  reviewId: string,
  isVisible?: boolean,
  adminReply?: string
): Promise<ToolResult> {
  try {
    const review = await db.query.reviews.findFirst({
      where: and(eq(reviews.id, reviewId), eq(reviews.storeId, storeId))
    });

    if (!review) {
      return { success: false, message: "Review not found or unauthorized." };
    }

    const updates: any = {};
    if (isVisible !== undefined) updates.isVisible = isVisible;
    if (adminReply !== undefined) updates.adminReply = adminReply;

    await db.update(reviews).set(updates).where(eq(reviews.id, reviewId));

    revalidatePath(`/${storeSlug}/dashboard/reviews`);

    return {
      success: true,
      message: `Updated review by "${review.customerName}".`,
      data: { reviewId, isVisible: updates.isVisible ?? review.isVisible, adminReply: updates.adminReply }
    };
  } catch (error: any) {
    console.error("moderateReview error:", error);
    return { success: false, message: `Failed to moderate review: ${error.message}` };
  }
}
