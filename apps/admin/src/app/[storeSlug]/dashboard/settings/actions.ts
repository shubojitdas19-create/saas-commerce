"use server";

import { db } from "@/lib/db";
import { stores, storeSettings, users, passwordResets } from "@repo/db";
import { eq, and, desc, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { encrypt } from "@/lib/encryption";
import crypto from "crypto";
import { sendPaymentGatewayOtpEmail } from "@/lib/email";

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

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 4))}${name.slice(-1)}@${domain}`;
}

export async function requestPaymentGatewayOtpAction(storeSlug: string) {
  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      with: {
        settings: true,
      },
    });

    if (!store) {
      return { success: false, error: "Store not found." };
    }

    // Find the store administrator
    const adminUser = (await db.query.users.findFirst({
      where: and(eq(users.storeId, store.id), eq(users.role, "tenant_admin")),
    })) || (await db.query.users.findFirst({
      where: eq(users.storeId, store.id),
    }));

    if (!adminUser || !adminUser.email) {
      return { success: false, error: "No administrator email found for this store." };
    }

    const cleanEmail = adminUser.email.trim().toLowerCase();

    // Generate 6-digit numeric OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(generatedOtp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unused OTPs for this store & email
    const resetId = crypto.randomUUID();
    await db.insert(passwordResets).values({
      id: resetId,
      storeId: store.id,
      email: cleanEmail,
      otpHash: otpHash,
      expiresAt: expiresAt,
      isUsed: false,
    });

    const providerName = store.settings?.paymentProvider 
      ? (store.settings.paymentProvider.charAt(0).toUpperCase() + store.settings.paymentProvider.slice(1))
      : "Razorpay";

    // Dispatch email via Resend
    const emailResult = await sendPaymentGatewayOtpEmail({
      toEmail: cleanEmail,
      merchantName: adminUser.name || "Store Administrator",
      storeName: store.name,
      otp: generatedOtp,
      providerName,
    });

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || "Failed to deliver security OTP to your email. Please try again.",
      };
    }

    return {
      success: true,
      emailMasked: maskEmail(cleanEmail),
    };
  } catch (error: any) {
    console.error("Failed to request payment gateway OTP:", error);
    return { success: false, error: "Failed to dispatch security verification code." };
  }
}

export async function verifyPaymentGatewayOtpAction(storeSlug: string, otp: string) {
  try {
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return { success: false, error: "Please enter a valid 6-digit verification code." };
    }

    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      columns: { id: true },
    });

    if (!store) {
      return { success: false, error: "Store not found." };
    }

    const otpHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");

    // Look for matching active OTP
    const record = await db.query.passwordResets.findFirst({
      where: and(
        eq(passwordResets.storeId, store.id),
        eq(passwordResets.otpHash, otpHash),
        eq(passwordResets.isUsed, false),
        gt(passwordResets.expiresAt, new Date())
      ),
      orderBy: desc(passwordResets.createdAt),
    });

    if (!record) {
      return {
        success: false,
        error: "Invalid or expired verification code. Please request a new code.",
      };
    }

    // Mark as used
    await db
      .update(passwordResets)
      .set({ isUsed: true })
      .where(eq(passwordResets.id, record.id));

    return { success: true };
  } catch (error: any) {
    console.error("Failed to verify payment gateway OTP:", error);
    return { success: false, error: "Verification failed." };
  }
}