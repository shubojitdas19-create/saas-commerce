"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { db } from "@/lib/db"; 
import { stores, users, subscriptions, storeSettings } from "@repo/db"; 
import { eq, desc } from "drizzle-orm";

export type DeployTenantInput = {
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string; 
  currency: string;
  plan: string;
};

// 1. FETCH ALL TENANTS
export async function getTenantsAction() {
  try {
    const records = await db
      .select({
        id: stores.id,
        name: stores.name,
        slug: stores.slug,
        currency: stores.currency,
        apiKey: stores.apiKey,
        status: subscriptions.status,
        plan: subscriptions.plan,
        ownerName: users.name,
        ownerEmail: users.email,
        createdAt: stores.createdAt,
      })
      .from(stores)
      .leftJoin(users, eq(users.storeId, stores.id))
      .leftJoin(subscriptions, eq(subscriptions.storeId, stores.id))
      .orderBy(desc(stores.createdAt));

    return { success: true, data: records };
  } catch (error) {
    console.error("Failed to fetch tenants:", error);
    return { success: false, data: [], error: "Failed to load database." };
  }
}

// 2. CREATE NEW TENANT
export async function deployTenantAction(data: DeployTenantInput) {
  try {
    const storeId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const subscriptionId = crypto.randomUUID();
    const settingsId = crypto.randomUUID();
    
    const apiKey = `sk_live_${crypto.randomBytes(16).toString("hex")}`;

    // Securely hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.adminPassword, salt);

    await db.insert(stores).values({
      id: storeId,
      name: data.name,
      slug: data.slug,
      currency: data.currency,
      apiKey: apiKey,
    });

    await db.insert(users).values({
      id: userId,
      storeId: storeId,
      name: data.adminName,
      email: data.adminEmail,
      passwordHash: hashedPassword,
      role: "tenant_admin",
    });

    await db.insert(subscriptions).values({
      id: subscriptionId,
      storeId: storeId,
      plan: data.plan,
      billingCycle: "Monthly",
      status: "Active",
    });

    await db.insert(storeSettings).values({
      id: settingsId,
      storeId: storeId,
      themeColor: "#000000",
      taxRate: "0.00",
      flatShippingRate: "0.00",
    });

    revalidatePath("/");
    return { success: true, storeId };
  } catch (error) {
    console.error("Tenant deployment failed:", error);
    return { success: false, error: "Database transaction failed." };
  }
}

// 3. UPDATE EXISTING TENANT
export async function updateTenantAction(payload: {
  storeId: string;
  name: string;
  slug: string;
  adminEmail: string;
  adminName: string;
  adminPassword?: string;
  currency: string;
  plan: string;
  status: string;
}) {
  try {
    // Update Store details
    await db.update(stores).set({
      name: payload.name,
      slug: payload.slug,
      currency: payload.currency,
    }).where(eq(stores.id, payload.storeId));

    // Update Subscription details
    await db.update(subscriptions).set({
      plan: payload.plan,
      status: payload.status,
    }).where(eq(subscriptions.storeId, payload.storeId));

    // Update Primary Admin details
    const userUpdateData: any = {
      name: payload.adminName,
      email: payload.adminEmail,
    };

    // Only hash and update the password if a new one was provided
    if (payload.adminPassword && payload.adminPassword.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      userUpdateData.passwordHash = await bcrypt.hash(payload.adminPassword, salt);
    }

    await db.update(users)
      .set(userUpdateData)
      .where(eq(users.storeId, payload.storeId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update tenant:", error);
    return { success: false, error: "Database update failed." };
  }
}