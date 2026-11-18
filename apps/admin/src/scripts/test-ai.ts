import { db } from "@/lib/db";
import { products, categories } from "@repo/db";
import { eq, isNull, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

// The exact Store ID for BoiHut (from your existing routes)
const STORE_ID = "0d4aca38-0715-4478-9956-1d440931a6b3"; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-pro",
  tools: [{ googleSearchRetrieval: {} }]
});

async function testCategorizer() {
  console.log("🧪 Running AI in TEST MODE (No database updates will be made)...");

  // Fetch 2 books that are missing a category ID
  const testBooks = await db.query.products.findMany({
    where: and(
      eq(products.storeId, STORE_ID),
      isNull(products.categoryId)
    ),
    limit: 2
  });

  if (testBooks.length === 0) {
    console.log("No pending books found for testing!");
    return;
  }

  for (const book of testBooks) {
    try {
      console.log(`\n📖 Analyzing Book: "${book.name}" by ${book.brand || "Unknown"}...`);

      const prompt = `
        You are a master librarian for a Bengali bookstore. 
        Analyze this book:
        Title: "${book.name}"
        Publisher: "${book.brand}"
        Description: "${book.description || "N/A"}"

        Your tasks:
        1. Identify the exact author of this book. Search the web if needed.
        2. Assign it to one of these exact categories: ["Bangla Sahitya", "Fiction", "Poetry", "Kids & Teens", "Thriller", "Academic"].
        
        Respond ONLY with a valid JSON object in this exact format, with no markdown or backticks:
        {
          "author": "Author Name Here",
          "category": "Category Name Here"
        }
      `;

      const result = await model.generateContent(prompt);
      const cleanJson = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const aiData = JSON.parse(cleanJson);

      console.log(`🤖 AI Suggestion for "${book.name}":`);
      console.log(`   - Author assigned:   ${aiData.author}`);
      console.log(`   - Category assigned: ${aiData.category}`);
      console.log(`⚠️  (TEST MODE: Database was NOT updated)`);
      
    } catch (error) {
      console.error(`❌ Failed to process test book ID ${book.id}:`, error);
    }
  }
  
  console.log("\n🏁 Test complete. If this looks accurate, we will build the Visual Admin Dashboard next.");
  process.exit(0);
}

testCategorizer();