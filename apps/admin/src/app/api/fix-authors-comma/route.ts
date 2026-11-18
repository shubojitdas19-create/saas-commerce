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