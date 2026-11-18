import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, stores, payments } from "@repo/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import Razorpay from "razorpay";
import { decrypt } from "@/lib/encryption";
import { sendNewOrderNotificationEmail, getStoreAdminEmails } from "@/lib/email";

// Handle CORS for cross-origin requests from your storefront
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await req.json();
    
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      totalAmount,
      items,
      paymentMethod = "COD", // Default to COD if the frontend doesn't specify
    } = body;

    // 1. Verify the store exists and pull its settings via relation
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
      with: { settings: true }
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 2. Generate a professional Order Number (e.g. ORD-A1B2C3)
    const orderId = crypto.randomUUID();
    const orderNumber = `ORD-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    
    let razorpayOrderId = null;

    // 3. Handle Online Payment Initialization (Razorpay)
    if (paymentMethod === "ONLINE" && store.settings?.paymentProvider === "razorpay") {
      if (!store.settings.gatewayKeyId || !store.settings.gatewaySecret) {
        return NextResponse.json({ error: "Store payment gateway is misconfigured." }, { status: 500 });
      }

      try {
        // SECURE HANDOFF: Decrypt the tenant's private secret in memory only
        const decryptedSecret = decrypt(store.settings.gatewaySecret);

        // Initialize Razorpay strictly with THIS specific tenant's keys
        const rzp = new Razorpay({
          key_id: store.settings.gatewayKeyId,
          key_secret: decryptedSecret,
        });

        // Create the official transaction on Razorpay's servers (Amount must be in smallest currency unit)
        const rzpOrder = await rzp.orders.create({
          amount: Math.round(Number(totalAmount) * 100), 
          currency: store.currency || "INR",
          receipt: orderNumber,
        });

        razorpayOrderId = rzpOrder.id;

        // Log the payment intent in your payments table to verify against webhooks later
        await db.insert(payments).values({
          id: crypto.randomUUID(),
          storeId: store.id,
          orderId: orderId,
          provider: "razorpay",
          transactionId: razorpayOrderId,
          amount: totalAmount.toString(),
          currency: store.currency || "INR",
          status: "Pending",
        });
      } catch (rzpError) {
        console.error("Razorpay Initialization Error:", rzpError);
        return NextResponse.json({ error: "Failed to initialize secure payment gateway." }, { status: 500 });
      }
    }

    // 4. Save to the `orders` table
    await db.insert(orders).values({
      id: orderId,
      storeId: store.id,
      orderNumber: orderNumber,
      customerName: customerName,
      customerEmail: customerEmail || "",
      customerPhone: customerPhone,
      shippingAddress: shippingAddress,
      totalAmount: totalAmount.toString(), 
      status: "pending",
      paymentStatus: "unpaid",
      paymentMethod: paymentMethod === "ONLINE" ? "ONLINE" : "COD",
    });

    // 5. Save each product to the `order_items` table
    if (items && items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        id: crypto.randomUUID(),
        orderId: orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price.toString(),
      }));
      
      await db.insert(orderItems).values(itemsToInsert);
    }

    // 5.5. Dispatch Email Notification to Store Owner(s)
    (async () => {
      try {
        const adminEmails = await getStoreAdminEmails(store.id);
        if (adminEmails.length > 0) {
          await sendNewOrderNotificationEmail({
            toEmail: adminEmails,
            storeName: store.name,
            storeSlug: store.slug,
            orderNumber,
            customerName,
            customerEmail: customerEmail || undefined,
            customerPhone,
            shippingAddress,
            totalAmount,
            paymentMethod: paymentMethod === "ONLINE" ? "ONLINE" : "COD",
            items: items?.map((it: any) => ({
              name: it.name || it.title || "Product Item",
              quantity: it.quantity || 1,
              price: it.price || 0,
            })),
          });
        }
      } catch (emailErr) {
        console.error("Failed to dispatch order notification email:", emailErr);
      }
    })();

    // 6. Return success to the storefront, injecting gateway details ONLY if online
    return NextResponse.json(
      { 
        success: true, 
        orderNumber,
        razorpayOrderId,
        gatewayKeyId: paymentMethod === "ONLINE" ? store.settings?.gatewayKeyId : null
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allows external storefronts to read the response
        },
      }
    );
  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json(
      { error: "Failed to process the order." },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}