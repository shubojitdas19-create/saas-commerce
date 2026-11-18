/**
 * SaaS Commerce - Tenant Portal Operator's Manual
 * 
 * Provides the AI Assistant with an exhaustive, step-by-step understanding
 * of every dashboard route, button, workflow, and action.
 */

export const PORTAL_DASHBOARD_ROUTES = [
  {
    path: "/dashboard",
    title: "Overview",
    description: "High-level metrics: Total revenue, orders to fulfill, total products, unique customers, and recent orders table."
  },
  {
    path: "/dashboard/products",
    title: "Products Catalog",
    description: "List of all active and draft products, stock levels, prices, search, and category filter."
  },
  {
    path: "/dashboard/products/new",
    title: "Add New Product",
    description: "Create a new product with title, brand, category, description, base price, discount price, image uploads (UploadThing), JSON specifications, and dynamic variants."
  },
  {
    path: "/dashboard/products/[productId]",
    title: "Edit Product",
    description: "Modify an existing product, add/remove images, update variants (stock, price, SKU), and change specifications."
  },
  {
    path: "/dashboard/categories",
    title: "Category Management",
    description: "Create and organize product categories. Each category automatically generates a clean URL slug for storefront filtering."
  },
  {
    path: "/dashboard/orders",
    title: "Orders & Inquiries",
    description: "Filter orders by status: All, Pending, Accepted, Dispatched, Delivered, Cancelled. Displays customer name, phone, address, and total amount."
  },
  {
    path: "/dashboard/orders/[orderId]",
    title: "Order Details & Timeline",
    description: "Inspect customer shipping address, order items, quantities. Contains status transition buttons and dynamic price quote editing for quote-based stores."
  },
  {
    path: "/dashboard/leads",
    title: "Leads & Consultations",
    description: "Customer consultation inquiries (such as painting quotes, bulk hardware inquiries). Shows customer name, phone, address, and message."
  },
  {
    path: "/dashboard/reviews",
    title: "Customer Reviews",
    description: "Moderate reviews: approve/hide visibility, write public admin replies, and view live Google Places rating sync."
  },
  {
    path: "/dashboard/settings",
    title: "Store Settings & Integrations",
    description: "Upload store logo, change theme color, configure Google Place ID for Google Reviews, and setup Razorpay payment keys & webhook secret."
  }
];

export const STEP_BY_STEP_GUIDES = {
  addProduct: `
### How to Upload a Product:
1. Navigate to **Products -> Add Product** (URL: \`/[storeSlug]/dashboard/products/new\`).
2. **Basic Information:**
   - **Product Name:** Enter a clear, descriptive title.
   - **Brand / Publisher / Manufacturer:** Enter the brand name (e.g., "Asian Paints", "Ananda Publishers", "Sandvik").
   - **Category:** Choose a category from the dropdown (or create one first in Categories).
   - **Description:** Provide key product details, instructions, or book synopsis.
3. **Pricing & Status:**
   - **Base Price:** Enter the standard selling price (or default unit price).
   - **Compare At / Discount Price:** Optional original price to display a strike-through discount.
   - **Status:** Choose 'Published' (live immediately on website) or 'Draft' (hidden).
4. **Media (Photos):**
   - Click the **Upload Image** box to upload photos via UploadThing.
   - The first image uploaded becomes the cover picture on the storefront.
5. **Specifications (Key-Value Pairs):**
   - Click '+ Add Specification'.
   - Add attributes like \`Author: Rabindranath Tagore\` or \`Sheen: High Gloss\` or \`Insert: CNMG 120408\`.
6. **Variants (Sizes, Packs, Bindings):**
   - Click '+ Add Variant'.
   - Enter **Title** (e.g. '1 Litre', '4 Litres', 'Paperback', '16x16mm').
   - Enter **Price Override** (the specific price for this variant).
   - Enter **Stock Quantity** (e.g. 50).
   - Enter optional **SKU**.
7. Click **'Save Product'**. It will instantly show on your live storefront!
`,

  orderLifecycle: `
### How Order Processing Works:
1. Open **Orders** (\`/[storeSlug]/dashboard/orders\`).
2. Click on any order to open its details (\`/[storeSlug]/dashboard/orders/[orderId]\`).
3. **Status Flow:**
   - **Pending:** Newly placed order or inquiry.
   - **Accepted:** You have verified the order and began packing.
   - **Dispatched:** The package has been handed over to the courier/delivery partner.
   - **Delivered:** Order reached the customer.
4. **Quote-Based Stores (e.g. The Colour World):**
   - If the store is quote-based, you will see an **'Update Quote Prices'** section on the order page.
   - You can enter custom quoted prices for each item and click **'Save Quoted Prices'** before accepting the order.
`,

  reviewsManagement: `
### How to Manage Customer Reviews:
1. Navigate to **Reviews** (\`/[storeSlug]/dashboard/reviews\`).
2. **Approve / Hide:** Click the eye toggle next to any review to make it public on your website or hide it.
3. **Admin Reply:** Click 'Reply' to write an official store response that displays under the review.
4. **Google Maps Reviews Sync:**
   - Go to **Settings** (\`/[storeSlug]/dashboard/settings\`).
   - Paste your **Google Place ID** in the Google Maps field and click save.
   - Your live 5-star Google Reviews will automatically sync and display on your storefront!
`,

  paymentSettings: `
### How to Connect Payments (Razorpay):
1. Navigate to **Settings** (\`/[storeSlug]/dashboard/settings\`).
2. Under Payment Gateway, select **Razorpay**.
3. Enter your **Key ID** and **Key Secret** from your Razorpay Dashboard.
4. Set up the webhook URL in Razorpay: \`https://your-domain.com/api/webhooks/[storeSlug]/payments\`.
5. Enter the **Webhook Secret**.
6. The system encrypts these credentials with AES-256 for complete bank-grade security.
`
};
