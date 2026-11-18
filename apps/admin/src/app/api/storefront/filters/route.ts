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