import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviews, stores } from "@repo/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// GET: Fetch internal reviews + dynamic live Google Reviews
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 1. Fetch ALL internal reviews from your database safely
    const dbData = await db.query.reviews.findMany({
      where: eq(reviews.storeId, store.id),
    });

    // 2. Filter them in Javascript so we don't crash the SQL database
    let visibleDbReviews = dbData.filter(review => review.isVisible);
    
    // If we are on a product page, ONLY show reviews where the location holds the productId
    if (productId) {
      visibleDbReviews = visibleDbReviews.filter(review => review.location === productId);
    }

    // 3. Fetch Google Reviews dynamically ONLY if we are NOT on a specific product page
    let googleReviews: any[] = [];
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    const placeId = store.googlePlaceId; 

    if (!productId && apiKey && placeId) {
      try {
        const googleRes = await fetch(
          `https://places.googleapis.com/v1/places/${placeId}?fields=reviews`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey, 
              'X-Goog-FieldMask': 'reviews',
              'Accept-Language': 'en'
            },
            cache: 'no-store'
          }
        );
        
       const googleData = await googleRes.json();
        
        if (googleData.reviews && Array.isArray(googleData.reviews)) {
          googleReviews = googleData.reviews.map((r: any) => {
            const reviewDate = r.publishTime ? new Date(r.publishTime).toISOString() : new Date().toISOString();
            
            return {
              id: `google-${r.name || crypto.randomBytes(4).toString("hex")}`,
              storeId: store.id,
              customerName: r.authorAttribution?.displayName || "Google User",
              email: "google-user@placeholder.com", 
              phone: "N/A",
              location: "Verified Google Review", 
              rating: r.rating || 5,
              text: r.originalText?.text || r.text?.text || "Rated highly on Google.",
              adminReply: null,
              isVisible: true,
              isVerified: true, 
              createdAt: reviewDate, 
            };
          });
        }
      } catch (googleError) {
        console.error(`Failed to fetch Google Reviews for ${storeSlug}:`, googleError);
      }
    }

    // 4. Combine and sort
    const combinedReviews = [...visibleDbReviews, ...googleReviews].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ success: true, data: combinedReviews }, { 
      headers: { "Access-Control-Allow-Origin": "*" } 
    });
  } catch (error) {
    console.error("Review Fetch API Error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}

// POST: Submit a new review from the storefront
export async function POST(
  req: Request, 
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await req.json();
    
    // We grab productId from the incoming request payload
    const { name, email, phone, location, rating, text, productId } = body;

    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    await db.insert(reviews).values({
      id: crypto.randomUUID(),
      storeId: store.id,
      customerName: name,
      email: email,
      phone: phone || "N/A",
      // CRITICAL FIX: Save the productId into the location column so we can find it later!
      location: productId ? productId : (location || "Website Review"),
      rating: Number(rating),
      text: text,
      isVisible: true, // You can set this to false later if you want Admin approval before they show up
      isVerified: false, 
    });

    return NextResponse.json({ success: true }, { 
      headers: { "Access-Control-Allow-Origin": "*" } 
    });
  } catch (error) {
    console.error("Review Submit API Error:", error);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}