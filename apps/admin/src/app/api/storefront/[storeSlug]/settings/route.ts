import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stores } from "@repo/db";
import { eq } from "drizzle-orm";

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      with: { settings: true }
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Return ONLY public-safe configurations to the storefront
    return NextResponse.json({
      success: true,
      data: {
        storeName: store.name,
        currency: store.currency,
        isCodEnabled: store.settings?.isCodEnabled ?? true,
        paymentProvider: store.settings?.paymentProvider || "none",
      }
    }, { headers: { "Access-Control-Allow-Origin": "*" } });
    
  } catch (error) {
    console.error("Storefront Settings API Error:", error);
    return NextResponse.json({ error: "Failed to fetch store configurations." }, { status: 500 });
  }
}