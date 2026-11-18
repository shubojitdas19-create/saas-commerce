import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stores, storeSettings, payments, orders } from "@repo/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { decrypt } from "@/lib/encryption";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    
    // 1. Webhooks require the RAW text body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // 2. Find the store and its webhook secret
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      with: { settings: true }
    });

    if (!store || !store.settings?.webhookSecret) {
      return NextResponse.json({ error: "Store or webhook secret not configured" }, { status: 404 });
    }

    // 3. SECURE HANDOFF: Decrypt the webhook secret
    const decryptedWebhookSecret = decrypt(store.settings.webhookSecret);

    // 4. Verify the Razorpay Signature
    const expectedSignature = crypto
      .createHmac("sha256", decryptedWebhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error(`Invalid webhook signature for store: ${storeSlug}`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 5. Parse the body now that we know it's safely from Razorpay
    const event = JSON.parse(rawBody);

    // 6. Handle the successful payment event
    if (event.event === "payment.captured") {
      const razorpayOrderId = event.payload.payment.entity.order_id;

      // Find the payment record tied to this Razorpay Order ID
      const paymentRecord = await db.query.payments.findFirst({
        where: eq(payments.transactionId, razorpayOrderId)
      });

      if (paymentRecord) {
        // Update the payments table
        await db.update(payments)
          .set({ status: "Paid", updatedAt: new Date() })
          .where(eq(payments.id, paymentRecord.id));

        // Update the main orders table to reflect that it's paid AND automatically accept it
        await db.update(orders)
          .set({ 
            paymentStatus: "paid", 
            status: "accepted",       // <-- NEW: Auto-progress the order status
            acceptedAt: new Date(),   // <-- NEW: Stamp the timeline
            updatedAt: new Date() 
          })
          .where(eq(orders.id, paymentRecord.orderId));
      }
    }

    // Always return a 200 OK quickly so Razorpay knows you received it
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}