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