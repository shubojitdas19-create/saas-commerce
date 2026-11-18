# SaaS Commerce Admin API & Server Actions

## Server Actions: `/apps/admin/src/app/(super-admin)/actions.ts`

```typescript
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
  isQuoteBased: boolean; // NEW: Toggle for Quote/Inquiry mode
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
        isQuoteBased: stores.isQuoteBased, // NEW: Fetch this setting
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
      isQuoteBased: data.isQuoteBased, // NEW: Save setting during creation
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
  isQuoteBased: boolean; // NEW: Allow toggling later
}) {
  try {
    // Update Store details
    await db.update(stores).set({
      name: payload.name,
      slug: payload.slug,
      currency: payload.currency,
      isQuoteBased: payload.isQuoteBased, // NEW: Update the setting
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
```

## Route Endpoint: `/api/auth/tenant-login`
*File: `/apps/admin/src/app/api/auth/tenant-login/route.ts`*

```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { stores, users } from "@repo/db";
import { eq, and } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, slug } = await req.json();

    if (!email || !password || !slug) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    // 1. Find the store by its slug
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });

    if (!store) {
      return NextResponse.json({ success: false, error: "Store not found." }, { status: 404 });
    }

    // 2. Find the user for this store
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        eq(users.storeId, store.id)
      ),
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
    }

    // 3. Securely verify the password hash using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "Invalid credentials." }, { status: 401 });
    }

    // 4. Create the secure session cookie
    const cookieStore = await cookies();
    cookieStore.set("tenant_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API Login error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
```

## Route Endpoint: `/api/fix-authors`
*File: `/apps/admin/src/app/api/fix-authors/route.ts`*

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@repo/db";
import { like, eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { mode } = await req.json(); // "scan" or "fix"

    // Find all books containing the pattern
    const booksToFix = await db.query.products.findMany({
      where: like(products.name, "% : %"),
      columns: { id: true, name: true, specifications: true }
    });

    const results = [];
    let updatedCount = 0;

    for (const book of booksToFix) {
      const parts = book.name.split(" : ");
      
      if (parts.length >= 2) {
        const realTitle = parts[0].trim();
        // If there are multiple colons, we join the rest as the author
        const realAuthor = parts.slice(1).join(" : ").trim(); 

        results.push({
          id: book.id,
          originalTitle: book.name,
          newTitle: realTitle,
          extractedAuthor: realAuthor
        });

        // Only modify the database if the user clicked "Apply Fix"
        if (mode === "fix") {
          let currentSpecs = Array.isArray(book.specifications) ? [...book.specifications] : [];
          const authorIndex = currentSpecs.findIndex((s: any) => s.label === "Author" || s.label === "লেখক");
          
          if (authorIndex !== -1) {
            currentSpecs[authorIndex].value = realAuthor; 
          } else {
            currentSpecs.push({ label: "Author", value: realAuthor }); 
          }

          await db.update(products)
            .set({ name: realTitle, specifications: currentSpecs })
            .where(eq(products.id, book.id));
          
          updatedCount++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      updatedCount,
      results 
    });
  } catch (error: any) {
    console.error("Script error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

## Route Endpoint: `/api/fix-authors-comma`
*File: `/apps/admin/src/app/api/fix-authors-comma/route.ts`*

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@repo/db";
import { like, eq, and } from "drizzle-orm";

// MUST UPDATE THIS TO YOUR BOIHUT STORE ID
const STORE_ID = "0d4aca38-0715-4478-9956-1d440931a6b3"; 

export async function POST(req: Request) {
  try {
    const { mode } = await req.json();

    // 1. SECURITY: Strict filtering by STORE_ID and the explicit "trans. into Bengali" pattern
    const booksToFix = await db.query.products.findMany({
      where: and(
        eq(products.storeId, STORE_ID),
        like(products.description, "%,%trans. into Bengali%")
      ),
      columns: { id: true, name: true, description: true, specifications: true }
    });

    const results = [];
    let updatedCount = 0;

    for (const book of booksToFix) {
      if (!book.description) continue;

      // The pattern is: "Author Name, Title, trans. into Bengali..."
      const parts = book.description.split(",");
      
      if (parts.length >= 2) {
        const extractedAuthor = parts[0].trim(); 

        // 2. SAFETY CHECK: Validate the author name length
        if (extractedAuthor.length >= 3 && extractedAuthor.length <= 40) {
          
          results.push({
            id: book.id,
            title: book.name,
            originalDescription: book.description,
            extractedAuthor: extractedAuthor
          });

          // 3. APPLY FIX: Only if mode is "fix"
          if (mode === "fix") {
            let currentSpecs = Array.isArray(book.specifications) ? [...book.specifications] : [];
            const authorIndex = currentSpecs.findIndex((s: any) => s.label === "Author" || s.label === "লেখক");
            
            if (authorIndex !== -1) {
              currentSpecs[authorIndex].value = extractedAuthor; 
            } else {
              currentSpecs.push({ label: "Author", value: extractedAuthor }); 
            }

            await db.update(products)
              .set({ specifications: currentSpecs })
              .where(eq(products.id, book.id));
            
            updatedCount++;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      updatedCount,
      results 
    });
  } catch (error: any) {
    console.error("Script error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

## Route Endpoint: `/api/storefront/filters`
*File: `/apps/admin/src/app/api/storefront/filters/route.ts`*

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories } from "@repo/db";
import { eq, and } from "drizzle-orm";

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" }
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ success: false });

    // 1. Get Categories
    const cats = await db.query.categories.findMany({
       where: eq(categories.storeId, storeId)
    });

    // 2. Fetch only the columns we need to prevent memory overload
    const productData = await db.select({
        brand: products.brand,
        specifications: products.specifications
    }).from(products)
    .where(and(eq(products.storeId, storeId), eq(products.isArchived, false)));

    const brandSet = new Set<string>();
    const authorSet = new Set<string>();

    // Validation helper to block dashes, symbols, and empty names
    const isValidName = (str: string) => {
      const clean = str.trim();
      if (clean.length < 2 || clean.length > 60) return false;
      if (/^[-=*_.]+$/.test(clean)) return false; // Blocks strings that are purely symbols like "------"
      return true;
    };

    // 3. Extract unique Publishers and Authors safely
    productData.forEach(p => {
        if (p.brand && typeof p.brand === "string" && isValidName(p.brand)) {
            brandSet.add(p.brand.trim());
        }
        
        if (p.specifications && Array.isArray(p.specifications)) {
            const authorField = p.specifications.find((s: any) => s.label === "Author" || s.label === "লেখক");
            if (authorField && typeof authorField.value === "string" && isValidName(authorField.value)) {
                authorSet.add(authorField.value.trim());
            }
        }
    });

    return NextResponse.json({
        success: true,
        data: {
            categories: cats.map(c => ({ id: c.id, name: c.name, slug: c.slug })),
            publishers: Array.from(brandSet).sort(),
            authors: Array.from(authorSet).sort()
        }
    }, { headers: { "Access-Control-Allow-Origin": "*" } });

  } catch (error) {
      console.error("Filter API Error:", error);
      return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

## Route Endpoint: `/api/storefront/products`
*File: `/apps/admin/src/app/api/storefront/products/route.ts`*

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories, productMedia } from "@repo/db";
import { eq, and, or, sql, desc, asc, gte, lte, like } from "drizzle-orm";

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    
    if (!storeId) {
      return NextResponse.json({ success: false, error: "Store ID is required" }, { status: 400 });
    }

    // 1. Single Product Fetch (Bypasses all other filters)
    const productSlug = searchParams.get("slug");
    if (productSlug) {
      const data = await db.query.products.findMany({
        where: and(eq(products.slug, productSlug), eq(products.storeId, storeId), eq(products.isArchived, false)),
        with: { category: true, media: { orderBy: (media, { asc }) => [asc(media.sortOrder)] }, variants: true },
        limit: 1 
      });
      return NextResponse.json({ success: true, data }, { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    // 2. Extract Filters for List View
    const categorySlug = searchParams.get("category");
    const brand = searchParams.get("brand"); // Publisher
    const authorParam = searchParams.get("author");
    const searchQuery = searchParams.get("q");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "newest"; // newest, price_asc, price_desc
    
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "24", 10);
    const offset = (page - 1) * limit;

    // 3. Build Dynamic Where Clause
    const conditions = [eq(products.storeId, storeId), eq(products.isArchived, false)];

    if (categorySlug) {
      const category = await db.query.categories.findFirst({
        where: and(eq(categories.slug, categorySlug), eq(categories.storeId, storeId)),
      });
      if (category) conditions.push(eq(products.categoryId, category.id));
    }

    if (brand) {
      // Split by comma for multiple publishers
      const brands = brand.split(",");
      if (brands.length === 1) conditions.push(eq(products.brand, brands[0]));
      else conditions.push(or(...brands.map(b => eq(products.brand, b))));
    }

    if (authorParam) {
      // Split by comma for multiple authors
      const authors = authorParam.split(",");
      if (authors.length === 1) {
        conditions.push(sql`${products.specifications} LIKE ${'%' + authors[0] + '%'}`);
      } else {
        conditions.push(or(...authors.map(a => sql`${products.specifications} LIKE ${'%' + a + '%'}`)));
      }
    }

    if (searchQuery) {
      const searchTerm = `%${searchQuery}%`;
      conditions.push(or(
        like(products.name, searchTerm),
        like(products.brand, searchTerm),
        sql`${products.specifications} LIKE ${searchTerm}`
      ));
    }

    if (minPrice) conditions.push(gte(products.basePrice, minPrice));
    if (maxPrice) conditions.push(lte(products.basePrice, maxPrice));

    // 4. Determine Sorting
    let orderByClause = [desc(products.createdAt)];
    if (sortBy === "price_asc") orderByClause = [asc(products.basePrice)];
    if (sortBy === "price_desc") orderByClause = [desc(products.basePrice)];

    // 5. Execute Queries (Data + Total Count for Pagination)
    const combinedWhere = and(...conditions);

    const [data, totalCountResult] = await Promise.all([
      db.query.products.findMany({
        where: combinedWhere,
        with: { category: true, media: { orderBy: (media, { asc }) => [asc(media.sortOrder)] }, variants: true },
        orderBy: orderByClause,
        limit,
        offset,
      }),
      db.execute(sql`SELECT COUNT(*) as count FROM ${products} WHERE ${combinedWhere}`)
    ]);

    const totalCount = (totalCountResult[0] as any)[0].count;

    return NextResponse.json({ 
      success: true, 
      data, 
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    }, { headers: { "Access-Control-Allow-Origin": "*" } });

  } catch (error) {
    console.error("Storefront API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}
```

## Route Endpoint: `/api/storefront/[storeSlug]/checkout`
*File: `/apps/admin/src/app/api/storefront/[storeSlug]/checkout/route.ts`*

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, stores } from "@repo/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

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
    } = body;

    // 1. Verify the store exists
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 2. Generate a professional Order Number (e.g. ORD-A1B2C3)
    const orderId = crypto.randomUUID();
    const orderNumber = `ORD-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // 3. Save to the `orders` table
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
      paymentMethod: "COD",
    });

    // 4. Save each product to the `order_items` table
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

    // Return success to the storefront
    return NextResponse.json(
      { success: true, orderNumber },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allows storefront to read the response
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
```

## Route Endpoint: `/api/storefront/[storeSlug]/leads`
*File: `/apps/admin/src/app/api/storefront/[storeSlug]/leads/route.ts`*

```typescript
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
```

## Route Endpoint: `/api/storefront/[storeSlug]/reviews`
*File: `/apps/admin/src/app/api/storefront/[storeSlug]/reviews/route.ts`*

```typescript
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
```

## Route Endpoint: `/api/uploadthing`
*File: `/apps/admin/src/app/api/uploadthing/route.ts`*

```typescript
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
```

## Server Actions: `/apps/admin/src/app/[storeSlug]/dashboard/actions.ts`

```typescript
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction(storeSlug: string) {
  // 1. Access the secure cookies
  const cookieStore = await cookies();
  
  // 2. Destroy the session
  cookieStore.delete("tenant_session");
  
  // 3. Kick the user back to the login page
  redirect(`/${storeSlug}/login`);
}
```

## Server Actions: `/apps/admin/src/app/[storeSlug]/dashboard/categories/actions.ts`

```typescript
"use server";

import { db } from "@/lib/db";
import { categories, stores } from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createCategoryAction(storeSlug: string, name: string) {
  try {
    // 1. Find the store ID based on the URL slug
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) return { success: false, error: "Store not found" };

    // 2. Generate a clean URL slug for the category (e.g., "interior-emulsions")
    const categorySlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 3. Insert into the database
    await db.insert(categories).values({
      id: crypto.randomUUID(),
      storeId: store.id,
      name: name,
      slug: categorySlug,
    });

    // 4. Refresh the page cache
    revalidatePath(`/${storeSlug}/dashboard/categories`);
    revalidatePath(`/${storeSlug}/dashboard/products/new`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: "Database error while creating category." };
  }
}
```

## Server Actions: `/apps/admin/src/app/[storeSlug]/dashboard/orders/[orderId]/actions.ts`

```typescript
"use server";

import { db } from "@/lib/db";
import { 
  orders, 
  orderItems, 
  stores, 
  products, 
  productMedia, 
  productVariants 
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

    return { success: true, store, order, items };
  } catch (error) {
    console.error("Failed to fetch order details:", error);
    return { success: false };
  }
}
```

## Server Actions: `/apps/admin/src/app/[storeSlug]/dashboard/products/new/actions.ts`

```typescript
"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { products, productMedia, productVariants, users, categories, stores } from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function getCategoriesAction(storeSlug: string) {
  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });
    if (!store) return [];

    const storeCategories = await db.query.categories.findMany({
      where: eq(categories.storeId, store.id),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
    return storeCategories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function createProductAction(
  storeSlug: string,
  payload: {
    name: string;
    brand: string;
    description: string;
    basePrice: string;
    compareAtPrice: string;
    status: string;
    categoryId: string;
    specifications: { label: string; value: string }[];
    images: string[];
    variants: { title: string; sku: string; priceOverride: string; stockQuantity: string; attachedImageIndex: number }[];
  }
) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("tenant_session")?.value;
    if (!userId) return { success: false, error: "Unauthorized" };

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!currentUser) return { success: false, error: "User not found" };

    const productSlug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') 
      .replace(/(^-|-$)+/g, '');   
      
    const newProductId = crypto.randomUUID();

    await db.insert(products).values({
      id: newProductId,
      storeId: currentUser.storeId,
      categoryId: payload.categoryId || null,
      brand: payload.brand || null,
      name: payload.name,
      slug: productSlug,
      description: payload.description,
      basePrice: payload.basePrice,
      discountPrice: payload.compareAtPrice || null,
      isArchived: payload.status === "draft",
      isFeatured: false,
      specifications: payload.specifications,
    });

    const uploadedImagesMap: { url: string; id: string }[] = [];
    
    if (payload.images && payload.images.length > 0) {
      const mediaRecords = payload.images.map((url, index) => {
        const mediaId = crypto.randomUUID();
        uploadedImagesMap.push({ url, id: mediaId }); 
        
        return {
          id: mediaId,
          productId: newProductId,
          url: url,
          mediaType: "image" as const,
          sortOrder: index,
        };
      });

      await db.insert(productMedia).values(mediaRecords);
    }

    if (payload.variants && payload.variants.length > 0) {
      const variantRecords = payload.variants.map((v) => {
        let linkedImageId = null;
        if (v.attachedImageIndex >= 0 && v.attachedImageIndex < uploadedImagesMap.length) {
          linkedImageId = uploadedImagesMap[v.attachedImageIndex].id;
        }

        return {
          id: crypto.randomUUID(),
          productId: newProductId,
          title: v.title,
          sku: v.sku || null,
          priceOverride: v.priceOverride || null,
          stockQuantity: parseInt(v.stockQuantity) || 0,
          imageId: linkedImageId,
        };
      });
      
      await db.insert(productVariants).values(variantRecords);
    }

    revalidatePath(`/${storeSlug}/dashboard/products`);

    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to save product to the database." };
  }
}

export async function bulkImportAsianPaintsAction(storeSlug: string, productsJson: any[]) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("tenant_session")?.value;
    if (!userId) return { success: false, error: "Unauthorized" };

    const currentUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    const store = await db.query.stores.findFirst({ where: eq(stores.slug, storeSlug) });
    if (!currentUser || !store) return { success: false, error: "User or Store not found" };

    const existingCategories = await db.query.categories.findMany({
      where: eq(categories.storeId, store.id),
    });
    const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));

    const categoryMapper: Record<string, string> = {
      "Interior": "Interior Emulsions",
      "Exterior": "Exterior Weathercoats",
      "Waterproofing": "Waterproofing",
      "Wood Finishes": "Wood & Metal Enamels",
      "Metal Paints": "Wood & Metal Enamels",
      "Undercoats": "Putty & Plaster Coat",
      "Adhesives": "Others"
    };

    let importedCount = 0;

    for (const item of productsJson) {
      const isRealProduct = (item.packSizes && item.packSizes.length > 0) || 
                            (item.features && item.features.length > 0) || 
                            (item.shades && item.shades.length > 0);
      
      if (!isRealProduct) continue;

      const targetCategoryName = categoryMapper[item.category] || "Others";
      let categoryId = categoryMap.get(targetCategoryName.toLowerCase());
      
      if (!categoryId) {
        categoryId = crypto.randomUUID();
        await db.insert(categories).values({
          id: categoryId,
          storeId: store.id,
          name: targetCategoryName,
          slug: targetCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        });
        categoryMap.set(targetCategoryName.toLowerCase(), categoryId);
      }

      const productSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const newProductId = crypto.randomUUID();

      let basePrice = "0";
      if (item.packSizes && item.packSizes.length > 0) {
        const prices = item.packSizes.map((p: any) => parseFloat(p.price.replace(/[^0-9.]/g, '')) || 0);
        basePrice = Math.min(...prices.filter((p: number) => p > 0)).toString();
      }

      const specifications = item.features ? item.features.map((f: string) => ({ label: "Feature", value: f })) : [];
      if (item.shades && item.shades.length > 0) {
        const shadeNames = item.shades.map((s: any) => `${s.name} (${s.code})`).join(", ");
        specifications.push({ label: "Available Shades", value: shadeNames });
      }

      await db.insert(products).values({
        id: newProductId,
        storeId: store.id,
        categoryId: categoryId,
        brand: item.brand || "Asian Paints",
        name: item.name,
        slug: productSlug,
        description: item.description || "Premium paint product.",
        basePrice: basePrice,
        isArchived: false,
        isFeatured: false,
        specifications: specifications,
      });

      let imageId = null;
      if (item.image) {
        imageId = crypto.randomUUID();
        await db.insert(productMedia).values({
          id: imageId,
          productId: newProductId,
          url: item.image,
          mediaType: "image" as const,
          sortOrder: 0,
        });
      }

      if (item.packSizes && item.packSizes.length > 0) {
        const variantRecords = item.packSizes.map((pack: any) => {
          const cleanPrice = pack.price.replace(/[^0-9.]/g, ''); 
          return {
            id: crypto.randomUUID(),
            productId: newProductId,
            title: pack.volume,
            sku: pack.sku || null,
            priceOverride: cleanPrice,
            stockQuantity: 100,
            imageId: imageId,
          };
        });
        await db.insert(productVariants).values(variantRecords);
      } else {
        await db.insert(productVariants).values({
          id: crypto.randomUUID(),
          productId: newProductId,
          title: "Default Size",
          priceOverride: basePrice,
          stockQuantity: 100,
          imageId: imageId,
        });
      }

      importedCount++;
    }

    revalidatePath(`/${storeSlug}/dashboard/products`);
    return { success: true, count: importedCount };

  } catch (error) {
    console.error("Bulk Import Error:", error);
    return { success: false, error: "Failed to run bulk import." };
  }
}
```

## Server Actions: `/apps/admin/src/app/[storeSlug]/dashboard/products/[productId]/actions.ts`

```typescript
"use server";

import { db } from "@/lib/db";
import { products, productMedia, productVariants, categories, stores } from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Fetch categories for the dropdown
export async function getCategoriesAction(storeSlug: string) {
  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });
    if (!store) return [];

    return await db.query.categories.findMany({
      where: eq(categories.storeId, store.id),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function updateProductAction(
  productId: string,
  storeSlug: string,
  payload: {
    name: string;
    brand: string; // NEW: Brand field
    description: string;
    basePrice: string;
    compareAtPrice: string;
    status: string;
    categoryId: string;
    specifications: { label: string; value: string }[];
    images: string[];
    // NEW: Capture variants with image linking index
    variants: { title: string; sku: string; priceOverride: string; stockQuantity: string; attachedImageIndex: number }[];
  }
) {
  try {
    const productSlug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // 1. Update core product details including brand, category, and specifications
    await db.update(products).set({
      name: payload.name,
      slug: productSlug,
      brand: payload.brand || null,
      description: payload.description,
      basePrice: payload.basePrice,
      discountPrice: payload.compareAtPrice || null,
      isArchived: payload.status === "draft",
      categoryId: payload.categoryId || null,
      specifications: payload.specifications,
    }).where(eq(products.id, productId));

    // 2. Refresh media (Delete old images, insert new ones and map their IDs)
    await db.delete(productMedia).where(eq(productMedia.productId, productId));
    
    const uploadedImagesMap: { url: string; id: string }[] = [];

    if (payload.images && payload.images.length > 0) {
      const mediaRecords = payload.images.map((url, index) => {
        const mediaId = crypto.randomUUID();
        uploadedImagesMap.push({ url, id: mediaId });

        return {
          id: mediaId,
          productId: productId,
          url: url,
          mediaType: "image" as const,
          sortOrder: index,
        };
      });
      await db.insert(productMedia).values(mediaRecords);
    }

    // 3. Refresh variants (Delete old variants, insert updated dynamic ones)
    await db.delete(productVariants).where(eq(productVariants.productId, productId));

    if (payload.variants && payload.variants.length > 0) {
      const variantRecords = payload.variants.map((v) => {
        let linkedImageId = null;
        if (v.attachedImageIndex >= 0 && v.attachedImageIndex < uploadedImagesMap.length) {
          linkedImageId = uploadedImagesMap[v.attachedImageIndex].id;
        }

        return {
          id: crypto.randomUUID(),
          productId: productId,
          title: v.title,
          sku: v.sku || null,
          priceOverride: v.priceOverride || null,
          stockQuantity: parseInt(v.stockQuantity) || 0,
          imageId: linkedImageId,
        };
      });

      await db.insert(productVariants).values(variantRecords);
    }

    revalidatePath(`/${storeSlug}/dashboard/products`);
    return { success: true };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Failed to update product." };
  }
}
```

## Server Actions: `/apps/admin/src/app/[storeSlug]/dashboard/reviews/actions.ts`

```typescript
"use server";

import { db } from "@/lib/db";
import { reviews, stores } from "@repo/db";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAdminReviewsAction(storeSlug: string) {
  try {
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, storeSlug),
    });

    if (!store) return { success: false, data: [] };

    const data = await db.query.reviews.findMany({
      where: eq(reviews.storeId, store.id),
      orderBy: [desc(reviews.createdAt)],
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch admin reviews:", error);
    return { success: false, data: [] };
  }
}

export async function toggleReviewVisibilityAction(reviewId: string, isVisible: boolean, storeSlug: string) {
  try {
    await db.update(reviews)
      .set({ isVisible })
      .where(eq(reviews.id, reviewId));
      
    revalidatePath(`/${storeSlug}/dashboard/reviews`);
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle visibility:", error);
    return { success: false, error: "Failed to update review visibility." };
  }
}

export async function replyToReviewAction(reviewId: string, adminReply: string, storeSlug: string) {
  try {
    await db.update(reviews)
      .set({ adminReply })
      .where(eq(reviews.id, reviewId));
      
    revalidatePath(`/${storeSlug}/dashboard/reviews`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reply:", error);
    return { success: false, error: "Failed to save reply." };
  }
}

export async function deleteReviewAction(reviewId: string, storeSlug: string) {
  try {
    await db.delete(reviews).where(eq(reviews.id, reviewId));
    
    revalidatePath(`/${storeSlug}/dashboard/reviews`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete review:", error);
    return { success: false, error: "Failed to delete review." };
  }
}
```

## Server Actions: `/apps/admin/src/app/[storeSlug]/dashboard/settings/actions.ts`

```typescript
"use server";

import { db } from "@/lib/db";
import { stores } from "@repo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateStoreLogoAction(storeSlug: string, logoUrl: string) {
  try {
    await db.update(stores)
      .set({ logoUrl: logoUrl })
      .where(eq(stores.slug, storeSlug));

    // Revalidate the entire layout so the sidebar updates instantly
    revalidatePath(`/${storeSlug}/dashboard`, "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update logo:", error);
    return { success: false, error: "Failed to update store logo." };
  }
}

// NEW: Action to update the Google Place ID
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
```

## Server Actions: `/apps/admin/src/app/[storeSlug]/login/actions.ts`

```typescript
"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { stores, users } from "@repo/db";
import { eq, and } from "drizzle-orm";
import * as bcrypt from "bcryptjs"; // Import bcrypt to verify the secure hash

export async function loginTenantAction(email: string, password: string, slug: string) {
  try {
    // 1. Find the store by its URL slug (e.g., "the-colour-world")
    const store = await db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });

    if (!store) {
      return { success: false, error: "Store not found." };
    }

    // 2. Find the user who belongs to this specific store and has this email
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        eq(users.storeId, store.id)
      ),
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Invalid email or unauthorized for this store." };
    }

    // 3. Securely Verify Password
    // Uses bcrypt to safely compare the typed password against the encrypted hash in the database
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return { success: false, error: "Incorrect password." };
    }

    // 4. Create a secure session cookie
    // This cookie tells the rest of the application that this user is logged in
    const cookieStore = await cookies();
    cookieStore.set("tenant_session", user.id, {
      httpOnly: true, // Prevents hackers from stealing it via JavaScript
      secure: process.env.NODE_ENV === "production", // Only works on HTTPS in production
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An internal server error occurred." };
  }
}
```

