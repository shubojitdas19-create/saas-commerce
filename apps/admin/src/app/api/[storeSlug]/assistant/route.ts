import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { stores, users } from "@repo/db";
import { eq, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStoreProfile, ASSISTANT_NAME } from "@/lib/assistant/store-profiles";
import { PORTAL_DASHBOARD_ROUTES, STEP_BY_STEP_GUIDES } from "@/lib/assistant/portal-manual";
import {
  searchStoreProducts,
  getStoreCategories,
  getStoreRecentOrders,
  addProductVariants,
  updateProductPrice,
  createStoreCategory,
  toggleProductStatus,
  createStoreProduct,
  getStoreOverview,
  lookupStoreOrder,
  moderateReview
} from "@/lib/assistant/tools";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    // 1. Authenticate the merchant session
    const cookieStore = await cookies();
    const userId = cookieStore.get("tenant_session")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please log in to your tenant dashboard." }, { status: 401 });
    }

    const authCheck = await db
      .select({
        store: stores,
        user: users,
      })
      .from(users)
      .innerJoin(stores, eq(users.storeId, stores.id))
      .where(and(eq(users.id, userId), eq(stores.slug, storeSlug)))
      .limit(1);

    if (authCheck.length === 0 || !authCheck[0]) {
      return NextResponse.json({ error: "Store not found or unauthorized session." }, { status: 403 });
    }

    const currentStore = authCheck[0].store;
    const currentUser = authCheck[0].user;

    // 2. Fetch Store Profile Context
    const profile = getStoreProfile(storeSlug, currentStore);

    // 3. Compile System Prompt
    const systemPrompt = `
You are "Vanij AI", an elite, friendly, and ultra-intelligent AI Assistant built directly into the merchant dashboard for "${profile.storeName}".
The merchant's name is "${currentUser.name}".
Your official name is "Vanij AI" (never call yourself Copilot or generic bot). When asked who you are or what your name is, introduce yourself proudly as "Vanij AI", the intelligent e-commerce operating assistant.

=== STORE BUSINESS IDENTITY ===
• Store Name: ${profile.storeName} (Slug: ${storeSlug})
• Industry & Vertical: ${profile.vertical}
• Description: ${profile.description}
• Target Audience: ${profile.targetAudience}
• Storefront Tech: ${profile.frontendProject}
• Order Workflow: ${profile.orderWorkflow}

=== STORE CUSTOMER-FACING FRONTEND ROUTES ===
${profile.frontendRoutes.map(r => `• ${r.route} — ${r.purpose}`).join("\n")}

=== INDUSTRY ADVICE GUIDELINES FOR THIS STORE ===
• Variant Recommendations: ${profile.variantAdvice}
• Specification Recommendations: ${profile.specificationAdvice}

=== ADMIN PORTAL DASHBOARD ROUTES ===
${PORTAL_DASHBOARD_ROUTES.map(r => `• [${r.title}](/${storeSlug}${r.path}): ${r.description}`).join("\n")}

=== STEP-BY-STEP WORKFLOW CHEATSHEET ===
${STEP_BY_STEP_GUIDES.addProduct}
${STEP_BY_STEP_GUIDES.orderLifecycle}
${STEP_BY_STEP_GUIDES.reviewsManagement}
${STEP_BY_STEP_GUIDES.paymentSettings}

=== CORE DIRECTIVES ===
1. STRICT LANGUAGE MATCHING DIRECTIVE (ABSOLUTE HIGHEST PRIORITY):
   - You MUST reply in the EXACT SAME LANGUAGE and SCRIPT that the merchant used in their message.
   - If the merchant writes in English ("what features does this app have?", "how do I add...", "how many products..."), you MUST reply 100% in natural, fluent English. (DO NOT reply in Bengali or Hindi unless the user explicitly used that language or requested it!).
   - If the merchant writes in Bengali script (বাংলা), reply in rich, natural Bengali.
   - If the merchant writes in Banglish / Romanized Bengali or Hinglish (e.g. "tumi amr jonne ekta boi add kore dao...", "koto gulo order ache?"), reply in natural Bengali or Banglish matching their phrasing.
   - NEVER assume the language based on the store's name or catalog. ALWAYS use the user's latest prompt as the sole source of truth for language!

2. BUSINESS PERSPECTIVE (NO TECH/CODING JARGON):
   - Explain all concepts from a retail / business owner's point of view.
   - NEVER use developer terms like "REST API", "SQL table", "Drizzle ORM", "TypeScript", "POST 200", "Next.js routing", or "JSON schema".
   - Instead, use friendly merchant terms: "Store Database", "Customer Storefront", "Product Catalog", "Order Dashboard", "Cash on Delivery", "Customer Reviews".

3. SCOPE & PROFESSIONAL BOUNDARIES:
   - Your expertise: You are the merchant's dedicated business assistant for this store (${profile.storeName}), managing catalog, inventory, orders, customer reviews, and dashboard workflows.
   - If asked about topics outside your scope (e.g. general non-business trivia, server code hacking, unrelated politics, or outside tasks), respond politely and professionally in the merchant's language:
     If English: "As your dedicated store assistant for ${profile.storeName}, my expertise is focused on helping you manage your catalog, products, orders, customer reviews, and storefront features. How can I assist with your store today?"
     If Bengali / Banglish: "আমি ${profile.storeName}-এর ব্যবসায়িক সহকারী। ক্যাটালগ, বই/পণ্য, অর্ডার ও কাস্টমার রিভিউ সংক্রান্ত যেকোনো বিষয়ে আমি আপনাকে সাহায্য করতে প্রস্তুত। আপনার স্টোরের জন্য আজ কী করতে পারি?"

4. ACTION CAPABILITIES:
   - You have access to TOOLS to inspect and modify data in this store:
     • View overall store metrics (total products, orders, sales revenue, rating)
     • Look up specific customer orders by name, order number, or phone
     • Create products, search products, add variants, update prices, create categories, toggle drafts
     • Moderate reviews and post official store replies
   - When asked to perform an action or check status, ALWAYS invoke the relevant tool.
   - When a product is created or updated, celebrate the action and provide a clickable markdown link: \`[View Product](/${storeSlug}/dashboard/products/[productId])\`.

5. CLEAN TYPOGRAPHY & FORMATTING:
   - Use clean, standard markdown formatting.
   - For bold text, use '**word**'. Never use triple asterisks '***'.
   - For bullet items, use '* **Item:** Details'.
   - Avoid broken asterisks or raw symbols. Keep the presentation crisp and elegant.
`;

    // 4. Initialize Gemini with Tool Declarations
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured in the server." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const toolsDeclaration: any = [
      {
        functionDeclarations: [
          {
            name: "create_product",
            description: "Creates a brand-new product/book/item in the store catalog with title, brand/publisher, description, price, optional category, variants, and specifications.",
            parameters: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING", description: "Name/title of the product or book" },
                brand: { type: "STRING", description: "Brand name, publisher (e.g. 'Ananda Publishers'), or manufacturer" },
                description: { type: "STRING", description: "Description or book synopsis" },
                basePrice: { type: "STRING", description: "Base selling price as string number (e.g. '250')" },
                categoryName: { type: "STRING", description: "Category name (e.g. 'Bangla Sahitya', 'Interior Emulsions')" },
                variants: {
                  type: "ARRAY",
                  description: "List of variants",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING", description: "Variant title (e.g. 'Paperback', '1 Litre')" },
                      priceOverride: { type: "STRING", description: "Variant price as string number" },
                      stockQuantity: { type: "INTEGER", description: "Stock count" }
                    },
                    required: ["title", "priceOverride", "stockQuantity"]
                  }
                },
                specifications: {
                  type: "ARRAY",
                  description: "Specifications key-value pairs",
                  items: {
                    type: "OBJECT",
                    properties: {
                      label: { type: "STRING", description: "Specification label e.g. 'Author' or 'Material'" },
                      value: { type: "STRING", description: "Specification value e.g. 'Humayun Ahmed'" }
                    },
                    required: ["label", "value"]
                  }
                }
              },
              required: ["name", "basePrice"]
            }
          },
          {
            name: "search_products",
            description: "Searches products in the merchant's store by title or brand. Returns product IDs, current base prices, and existing variants.",
            parameters: {
              type: "OBJECT",
              properties: {
                query: { type: "STRING", description: "Search keyword, product name, or brand" }
              },
              required: ["query"]
            }
          },
          {
            name: "get_categories",
            description: "Fetches all categories configured for this store.",
            parameters: {
              type: "OBJECT",
              properties: {}
            }
          },
          {
            name: "get_recent_orders",
            description: "Fetches the 5 most recent customer orders with order numbers, customer details, and statuses.",
            parameters: {
              type: "OBJECT",
              properties: {}
            }
          },
          {
            name: "add_product_variants",
            description: "Directly adds new variants (pack sizes, book editions, shank sizes, etc.) to an existing product.",
            parameters: {
              type: "OBJECT",
              properties: {
                productId: { type: "STRING", description: "The UUID of the product" },
                variants: {
                  type: "ARRAY",
                  description: "List of variants to add",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING", description: "Variant title (e.g. '1 Litre', '4 Litre', 'Hardcover', '16x16mm')" },
                      priceOverride: { type: "STRING", description: "Price for this specific variant as a string (e.g. '450')" },
                      stockQuantity: { type: "INTEGER", description: "Available stock count (e.g. 50)" },
                      sku: { type: "STRING", description: "Optional SKU code" }
                    },
                    required: ["title", "priceOverride", "stockQuantity"]
                  }
                }
              },
              required: ["productId", "variants"]
            }
          },
          {
            name: "update_product_price",
            description: "Updates the base price and optional discount price of an existing product.",
            parameters: {
              type: "OBJECT",
              properties: {
                productId: { type: "STRING", description: "The UUID of the product" },
                basePrice: { type: "STRING", description: "New base price as string number" },
                discountPrice: { type: "STRING", description: "Optional discount price as string number" }
              },
              required: ["productId", "basePrice"]
            }
          },
          {
            name: "create_category",
            description: "Creates a new category for the merchant's catalog.",
            parameters: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING", description: "Name of the new category" }
              },
              required: ["name"]
            }
          },
          {
            name: "toggle_product_status",
            description: "Publishes or unpublishes (drafts) a product.",
            parameters: {
              type: "OBJECT",
              properties: {
                productId: { type: "STRING", description: "The UUID of the product" },
                isArchived: { type: "BOOLEAN", description: "true to unpublish (draft), false to publish (live)" }
              },
              required: ["productId", "isArchived"]
            }
          },
          {
            name: "get_store_metrics",
            description: "Fetches live store overview analytics: total product count (active vs draft), category count, total orders, orders by status (pending, accepted, delivered), total sales revenue, and customer ratings.",
            parameters: {
              type: "OBJECT",
              properties: {}
            }
          },
          {
            name: "lookup_order",
            description: "Finds a specific customer order by order number (e.g. 'ORD-0F875B'), customer name, or customer phone number. Returns item details, quantities, total, and status.",
            parameters: {
              type: "OBJECT",
              properties: {
                query: { type: "STRING", description: "Order number, customer name, or phone number" }
              },
              required: ["query"]
            }
          },
          {
            name: "moderate_review",
            description: "Moderates a customer review on the store: toggle visibility (public or hidden) or post an official admin reply.",
            parameters: {
              type: "OBJECT",
              properties: {
                reviewId: { type: "STRING", description: "UUID of the review" },
                isVisible: { type: "BOOLEAN", description: "true to show on storefront, false to hide" },
                adminReply: { type: "STRING", description: "Official store reply to publish under the review" }
              },
              required: ["reviewId"]
            }
          }
        ]
      }
    ];

    // Candidate models with verified active free tier quota (tested live)
    const modelCandidates = [
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash"
    ];
    
    // Convert chat history for Gemini (last 10 messages)
    const historyWindow = messages.slice(-10);
    const lastUserMessage = historyWindow[historyWindow.length - 1]?.content || "";
    
    // Gemini API STRICT REQUIREMENT: The first message in chat history MUST have role 'user'
    const rawHistory = historyWindow.slice(0, -1);
    const firstUserIdx = rawHistory.findIndex((m: any) => m.role === "user");
    
    const chatHistory = firstUserIdx !== -1
      ? rawHistory.slice(firstUserIdx).map((m: any) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      : [];

    let response: any = null;
    let chat: any = null;
    let lastError: any = null;

    for (const modelName of modelCandidates) {
      try {
        const modelInstance = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
          tools: toolsDeclaration
        });

        chat = modelInstance.startChat({ history: chatHistory });
        const result = await chat.sendMessage(lastUserMessage);
        response = result.response;
        break; // Successfully got response
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} unavailable (${err.message}). Trying next fallback...`);
      }
    }

    if (!response || !chat) {
      throw lastError || new Error("All AI models currently busy. Please try again in a few moments.");
    }

    const actionLogs: string[] = [];

    // Check if the AI wants to call a tool
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0 && functionCalls[0]) {
      const call = functionCalls[0];
      let toolExecutionResult: any = { success: false, message: "Unknown tool call" };

      if (call.name === "create_product") {
        toolExecutionResult = await createStoreProduct(currentStore.id, storeSlug, call.args as any);
        if (toolExecutionResult.success) {
          actionLogs.push(`Created product "${(call.args as any).name}" (ID: ${toolExecutionResult.data?.productId})`);
        }
      } else if (call.name === "search_products") {
        toolExecutionResult = await searchStoreProducts(currentStore.id, (call.args as any).query);
      } else if (call.name === "get_categories") {
        toolExecutionResult = await getStoreCategories(currentStore.id);
      } else if (call.name === "get_recent_orders") {
        toolExecutionResult = await getStoreRecentOrders(currentStore.id);
      } else if (call.name === "add_product_variants") {
        const { productId, variants } = call.args as any;
        toolExecutionResult = await addProductVariants(currentStore.id, storeSlug, productId, variants);
        if (toolExecutionResult.success) {
          actionLogs.push(`Added ${variants.length} variant(s) to product ID: ${productId}`);
        }
      } else if (call.name === "update_product_price") {
        const { productId, basePrice, discountPrice } = call.args as any;
        toolExecutionResult = await updateProductPrice(currentStore.id, storeSlug, productId, basePrice, discountPrice);
        if (toolExecutionResult.success) {
          actionLogs.push(`Updated product price to ₹${basePrice}`);
        }
      } else if (call.name === "create_category") {
        const { name } = call.args as any;
        toolExecutionResult = await createStoreCategory(currentStore.id, storeSlug, name);
        if (toolExecutionResult.success) {
          actionLogs.push(`Created category "${name}"`);
        }
      } else if (call.name === "toggle_product_status") {
        const { productId, isArchived } = call.args as any;
        toolExecutionResult = await toggleProductStatus(currentStore.id, storeSlug, productId, isArchived);
        if (toolExecutionResult.success) {
          actionLogs.push(`Product status set to ${isArchived ? "Draft" : "Published"}`);
        }
      } else if (call.name === "get_store_metrics") {
        toolExecutionResult = await getStoreOverview(currentStore.id);
      } else if (call.name === "lookup_order") {
        const { query } = call.args as any;
        toolExecutionResult = await lookupStoreOrder(currentStore.id, query);
      } else if (call.name === "moderate_review") {
        const { reviewId, isVisible, adminReply } = call.args as any;
        toolExecutionResult = await moderateReview(currentStore.id, storeSlug, reviewId, isVisible, adminReply);
        if (toolExecutionResult.success) {
          actionLogs.push(`Updated review ID ${reviewId}`);
        }
      }

      // Send the tool execution result back into the chat as user context to finalize response
      // (This avoids Google v1beta's deprecated "role: 'function'" 400 error)
      const followUp = await chat.sendMessage(
        `[Tool Execution Result for '${call.name}']: ${JSON.stringify(toolExecutionResult)}. Formulate your friendly response to the merchant explaining what was accomplished and providing the clickable link to view it if applicable.`
      );

      response = followUp.response;
    }

    const replyText = response.text();

    return NextResponse.json({
      success: true,
      reply: replyText,
      actionsTaken: actionLogs
    });

  } catch (error: any) {
    console.error("Assistant API Error:", error);
    return NextResponse.json({
      success: false,
      error: "I am momentarily reviewing this request with your store records. Please try asking again in a moment, or rephrase your request."
    }, { status: 500 });
  }
}
