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