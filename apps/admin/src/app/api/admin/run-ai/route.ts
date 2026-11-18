import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories } from "@repo/db";
import { eq, asc } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Allow the script to run for up to 5 minutes, but keep the standard Node runtime for MySQL
export const maxDuration = 300; 

const STORE_ID = "0d4aca38-0715-4478-9956-1d440931a6b3"; // BoiHut Store ID

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "boihut-auto-sync") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.8-flash", 
  });

  let logs = [];

  try {
    const storeCategories = await db.query.categories.findMany({
      where: eq(categories.storeId, STORE_ID)
    });
    const categoryNames = storeCategories.map(c => c.name);

    // Fetch just 3 books at a time to prevent Google 503 Overload errors
    const pendingBooks = await db.query.products.findMany({
      where: eq(products.storeId, STORE_ID),
      orderBy: [asc(products.updatedAt)], 
      limit: 3
    });

    if (pendingBooks.length === 0) {
      return NextResponse.json({ message: "No books found.", logs: ["Database empty."] });
    }

    for (const book of pendingBooks) {
      const prompt = `
        You are a master librarian for a Bengali bookstore. 
        The current author and category for this book might be wrong.
        
        Title: "${book.name}"
        Publisher: "${book.brand || "Unknown"}"
        Description: "${book.description || "N/A"}"

        Tasks:
        1. Find the REAL author of this book.
        2. Assign this book to ONE of these exact categories: ${JSON.stringify(categoryNames)}. Pick the most relevant one.
        
        Respond ONLY with valid JSON (no markdown formatting or backticks) in this format:
        {
          "author": "Corrected Author Name",
          "category": "Matched Category Name"
        }
      `;

      try {
        const result = await model.generateContent(prompt);
        const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const aiData = JSON.parse(cleanJson);

        // --- PREVIEW MODE (No database writes yet) ---
        logs.push(`🧪 [TEST] "${book.name}": AI says Author is "${aiData.author}" & Category is "${aiData.category}"`);
      } catch (aiError) {
        logs.push(`⚠️ [WARNING] Failed to analyze "${book.name}". Google AI might be busy.`);
      }
      
      // Sleep for 2 seconds between books
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return NextResponse.json({ success: true, processedCount: pendingBooks.length, logs });

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}