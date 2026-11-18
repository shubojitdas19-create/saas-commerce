"use server";

import { db } from "@/lib/db";
import { stores, storeSettings } from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { encrypt } from "@/lib/encryption";

export async function updateStoreLogoAction(storeSlug: string, logoUrl: string) {
  try {
    await db.update(stores)
      .set({ logoUrl: logoUrl })
      .where(eq(stores.slug, storeSlug));

    revalidatePath(`/${storeSlug}/dashboard`, "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update logo:", error);
    return { success: false, error: "Failed to update store logo." };
  }
}

export async function updateGooglePlaceIdAction(storeSlug: string, placeId: string) {
  try {
    await db.update(stores)
      .set({ googlePlaceId: placeId })
      .where(eq(stores.slug, storeSlug));

    revalidatePath(`/${storeSlug}/dashboard/settings`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update Google Place ID:", error);
    return { success: false, error: "Failed to save Google Maps ID." };
  }
}

// NEW: Fetch current settings so the frontend knows if the gateway is already configured
export async function getPaymentSettingsAction(storeSlug: string) {
  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      with: { settings: true }
    });

    if (!store || !store.settings) return { success: false };

    return {
      success: true,
      data: {
        isCodEnabled: store.settings.isCodEnabled ?? true,
        paymentProvider: store.settings.paymentProvider,
        gatewayKeyId: store.settings.gatewayKeyId,
        // NEW: Tell frontend if webhook is configured, without exposing the actual secret
        hasWebhookSecret: !!store.settings.webhookSecret, 
      }
    };
  } catch (error) {
    console.error("Failed to fetch payment settings:", error);
    return { success: false };
  }
}

// UPDATED: Now accepts isCodEnabled
export async function updatePaymentCredentialsAction(
  storeSlug: string,
  payload: {
    isCodEnabled: boolean;
    paymentProvider: string;
    gatewayKeyId: string;
    gatewaySecret: string;
    webhookSecret: string;
  }
) {
  try {
    const encryptedGatewaySecret = payload.gatewaySecret ? encrypt(payload.gatewaySecret) : null;
    const encryptedWebhookSecret = payload.webhookSecret ? encrypt(payload.webhookSecret) : null;

    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      columns: { id: true }
    });

    if (!store) return { success: false, error: "Store not found" };

    const updateData: any = {
      isCodEnabled: payload.isCodEnabled,
      paymentProvider: payload.paymentProvider,
      gatewayKeyId: payload.gatewayKeyId || null,
      updatedAt: new Date(),
    };

    if (encryptedGatewaySecret) updateData.gatewaySecret = encryptedGatewaySecret;
    if (encryptedWebhookSecret) updateData.webhookSecret = encryptedWebhookSecret;

    await db.update(storeSettings)
      .set(updateData)
      .where(eq(storeSettings.storeId, store.id));

    revalidatePath(`/${storeSlug}/dashboard/settings`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save payment credentials:", error);
    return { success: false, error: "Failed to save payment credentials." };
  }
}