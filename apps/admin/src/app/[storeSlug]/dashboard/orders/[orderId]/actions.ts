"use server";

import { db } from "@/lib/db";
import { 
  orders, 
  orderItems, 
  stores, 
  products, 
  productMedia, 
  productVariants,
  payments // NEW: Import the payments schema
} from "@repo/db"; 
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(
  orderId: string, 
  newStatus: "pending" | "accepted" | "processing" | "dispatched" | "shipped" | "delivered" | "cancelled",
  storeSlug: string
) {
  try {
    const updateData: any = { 
      status: newStatus,
      updatedAt: new Date()
    };

    // Automatically stamp the date based on the selected status
    if (newStatus === "accepted") updateData.acceptedAt = new Date();
    if (newStatus === "dispatched") updateData.dispatchedAt = new Date();
    if (newStatus === "delivered") updateData.deliveredAt = new Date();

    await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));

    // Refresh the page data instantly
    revalidatePath(`/${storeSlug}/dashboard/orders`);
    revalidatePath(`/${storeSlug}/dashboard/orders/${orderId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update status:", error);
    return { success: false, error: "Failed to update order status." };
  }
}

// Action to update quote prices for B2B/Quote stores
export async function updateQuotePrices(
  orderId: string, 
  updatedItems: { id: string; newPrice: number }[],
  storeSlug: string
) {
  try {
    let newTotal = 0;
    
    // Update each item and calculate new total
    for (const item of updatedItems) {
      // Get original quantity to calculate the new line total
      const orderItem = await db.query.orderItems.findFirst({
        where: eq(orderItems.id, item.id)
      });
      
      if (orderItem) {
        // Save the new quoted price to the database
        await db.update(orderItems)
          .set({ price: item.newPrice.toString() })
          .where(eq(orderItems.id, item.id));
        
        // Add to the new grand total
        newTotal += (item.newPrice * orderItem.quantity);
      }
    }

    // Update the order's grand total with the new calculated value
    await db.update(orders)
      .set({ totalAmount: newTotal.toString(), updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Refresh the UI to show the new prices
    revalidatePath(`/${storeSlug}/dashboard/orders/${orderId}`);
    revalidatePath(`/${storeSlug}/dashboard/orders`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update quote prices:", error);
    return { success: false, error: "Failed to update quote prices." };
  }
}

// NEW: Action to fetch order details securely for the Client Component
export async function getOrderDetailsAction(storeSlug: string, orderId: string) {
  try {
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, storeSlug) });
    if (!store) return { success: false };

    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return { success: false };

    // NEW: Fetch the payment record tied to this order
    const paymentRecord = await db.query.payments.findFirst({ 
      where: eq(payments.orderId, orderId) 
    });

    const rawItems = await db.select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,
      productName: products.name,
      brand: products.brand,
      variantTitle: productVariants.title,
      variantImageId: productVariants.imageId,
      mediaId: productMedia.id,
      mediaUrl: productMedia.url,
      mediaSortOrder: productMedia.sortOrder,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .leftJoin(productMedia, eq(products.id, productMedia.productId))
    .where(eq(orderItems.orderId, orderId));

    const uniqueItemsMap = new Map();
    rawItems.forEach(row => {
      if (!uniqueItemsMap.has(row.id)) {
        uniqueItemsMap.set(row.id, {
          id: row.id,
          quantity: row.quantity,
          price: row.price,
          productName: row.productName,
          brand: row.brand,
          variantTitle: row.variantTitle,
          variantImageId: row.variantImageId,
          images: [] as { id: string, url: string, sortOrder: number }[],
        });
      }
      if (row.mediaUrl && row.mediaId) {
        uniqueItemsMap.get(row.id).images.push({ 
          id: row.mediaId, 
          url: row.mediaUrl, 
          sortOrder: row.mediaSortOrder || 0 
        });
      }
    });

    const items = Array.from(uniqueItemsMap.values()).map(item => {
      let finalImageUrl = "/images/paint-pour.png";
      if (item.images.length > 0) {
        const specificVariantImg = item.images.find((img: any) => img.id === item.variantImageId);
        if (specificVariantImg) {
          finalImageUrl = specificVariantImg.url;
        } else {
          const coverImg = item.images.sort((a: any, b: any) => a.sortOrder - b.sortOrder)[0];
          finalImageUrl = coverImg.url;
        }
      }
      return { ...item, imageUrl: finalImageUrl };
    });

    // NEW: Return the payment record in the final object
    return { success: true, store, order, items, payment: paymentRecord };
  } catch (error) {
    console.error("Failed to fetch order details:", error);
    return { success: false };
  }
}