import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, stores } from "@repo/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ storeSlug: string }> }) {
  try {
    const { storeSlug } = await params;
    const { name, phone, address, message } = await req.json();

    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    await db.insert(leads).values({
      id: crypto.randomUUID(),
      storeId: store.id,
      name,
      phone,
      address,
      message,
    });

    return NextResponse.json({ success: true }, { headers: { "Access-Control-Allow-Origin": "*" } });
  } catch (error) {
    console.error("Lead API Error:", error);
    return NextResponse.json({ error: "Failed to submit consultation request." }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}