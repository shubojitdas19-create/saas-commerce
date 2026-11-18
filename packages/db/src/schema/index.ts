import {
  mysqlTable,
  varchar,
  text,
  decimal,
  int,
  timestamp,
  boolean,
  mysqlEnum,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------
// 1. STORES (TENANTS)
// ---------------------------------------------------------
export const stores = mysqlTable("stores", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull().unique(),
  logoUrl: text("logo_url"),
  currency: varchar("currency", { length: 10 }).default("INR").notNull(),
  apiKey: varchar("api_key", { length: 64 }).notNull().unique(),
  isQuoteBased: boolean("is_quote_based").default(false).notNull(), // NEW: Toggle for Quote flow
  googlePlaceId: varchar("google_place_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ---------------------------------------------------------
// 2. USERS (Super Admin, Store Owners, Customers)
// ---------------------------------------------------------
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }),
  name: varchar("name", { length: 191 }).notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: mysqlEnum("role", ["super_admin", "tenant_admin", "customer"]).default("tenant_admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------
// 3. CATEGORIES
// ---------------------------------------------------------
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 191 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------
// 4. PRODUCTS
// ---------------------------------------------------------
export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id", { length: 36 }).references(() => categories.id, { onDelete: "set null" }),
  brand: varchar("brand", { length: 191 }), // NEW: Brand field
  name: varchar("name", { length: 191 }).notNull(),
  slug: varchar("slug", { length: 191 }).notNull(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  specifications: json("specifications"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ---------------------------------------------------------
// 5. PRODUCT MEDIA (Photos & Videos)
// ---------------------------------------------------------
export const productMedia = mysqlTable("product_media", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  mediaType: mysqlEnum("media_type", ["image", "video"]).default("image").notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
});

// ---------------------------------------------------------
// 6. PRODUCT VARIANTS (Sizes, Colors, Stock)
// ---------------------------------------------------------
export const productVariants = mysqlTable("product_variants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  priceOverride: decimal("price_override", { precision: 10, scale: 2 }),
  stockQuantity: int("stock_quantity").default(0).notNull(),
  imageId: varchar("image_id", { length: 36 }), // NEW: Links to product_media id
});

// ---------------------------------------------------------
// 7. ORDERS (UPDATED WITH TIMELINE DATES & ENUMS)
// ---------------------------------------------------------
export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull(),
  customerName: varchar("customer_name", { length: 191 }).notNull(),
  customerEmail: varchar("customer_email", { length: 191 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "processing", "dispatched", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  paymentStatus: mysqlEnum("payment_status", ["unpaid", "paid", "refunded"]).default("unpaid").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  acceptedAt: timestamp("accepted_at"),
  dispatchedAt: timestamp("dispatched_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ---------------------------------------------------------
// 8. ORDER ITEMS
// ---------------------------------------------------------
export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  variantId: varchar("variant_id", { length: 36 }).references(() => productVariants.id),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

// ---------------------------------------------------------
// LEADS
// ---------------------------------------------------------
export const leads = mysqlTable("leads", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 191 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address").notNull(),
  message: text("message"), 
  status: mysqlEnum("status", ["new", "contacted", "resolved"]).default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------
// 9. SAAS SUBSCRIPTIONS
// ---------------------------------------------------------
export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  plan: varchar("plan", { length: 50 }).notNull().default("Starter"),
  billingCycle: varchar("billing_cycle", { length: 50 }).notNull().default("Monthly"),
  status: varchar("status", { length: 50 }).notNull().default("Active"),
  nextBillingDate: timestamp("next_billing_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ---------------------------------------------------------
// 10. STORE CONFIGURATION
// ---------------------------------------------------------
export const storeSettings = mysqlTable("store_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().unique().references(() => stores.id, { onDelete: "cascade" }),
  customDomain: varchar("custom_domain", { length: 191 }),
  themeColor: varchar("theme_color", { length: 50 }).default("#000000"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  flatShippingRate: decimal("flat_shipping_rate", { precision: 10, scale: 2 }).default("0.00"),
  isCodEnabled: boolean("is_cod_enabled").default(true).notNull(),
  
  // NEW: Tenant Payment Gateway Credentials
  paymentProvider: varchar("payment_provider", { length: 50 }).default("none").notNull(), // 'razorpay', 'stripe', 'cashfree', 'none'
  gatewayKeyId: varchar("gateway_key_id", { length: 255 }), // Public API Key (safe for frontend)
  gatewaySecret: text("gateway_secret"), // Private API Secret (MUST BE ENCRYPTED IN DB)
  webhookSecret: text("webhook_secret"), // Webhook Verification Secret (MUST BE ENCRYPTED IN DB)
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ---------------------------------------------------------
// 11. DISCOUNT COUPONS
// ---------------------------------------------------------
export const coupons = mysqlTable("coupons", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 191 }).notNull(),
  discountType: varchar("discount_type", { length: 50 }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  usageLimit: int("usage_limit"),
  usedCount: int("used_count").default(0).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------
// 12. PAYMENTS & TRANSACTIONS
// ---------------------------------------------------------
export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  orderId: varchar("order_id", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 100 }).notNull(),
  transactionId: varchar("transaction_id", { length: 191 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ---------------------------------------------------------
// 13. REVIEWS
// ---------------------------------------------------------
export const reviews = mysqlTable("reviews", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  customerName: varchar("customer_name", { length: 191 }).notNull(),
  email: varchar("email", { length: 191 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  location: varchar("location", { length: 191 }),
  rating: int("rating").notNull(),
  text: text("text").notNull(),
  adminReply: text("admin_reply"),
  isVisible: boolean("is_visible").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------
// 14. PASSWORD RESETS (OTP)
// ---------------------------------------------------------
export const passwordResets = mysqlTable("password_resets", {
  id: varchar("id", { length: 36 }).primaryKey(),
  storeId: varchar("store_id", { length: 36 }).notNull().references(() => stores.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 191 }).notNull(),
  otpHash: varchar("otp_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------
// RELATIONS
// ---------------------------------------------------------
export const storesRelations = relations(stores, ({ one, many }) => ({
  products: many(products),
  categories: many(categories),
  orders: many(orders),
  users: many(users),
  coupons: many(coupons),
  leads: many(leads),
  payments: many(payments),
  reviews: many(reviews), // <-- ADD THIS LINE
  subscription: one(subscriptions, { fields: [stores.id], references: [subscriptions.storeId] }),
  settings: one(storeSettings, { fields: [stores.id], references: [storeSettings.storeId] }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  store: one(stores, { fields: [subscriptions.storeId], references: [stores.id] }),
}));

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
  store: one(stores, { fields: [storeSettings.storeId], references: [stores.id] }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  media: many(productMedia),
  variants: many(productVariants),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export const couponsRelations = relations(coupons, ({ one }) => ({
  store: one(stores, { fields: [coupons.storeId], references: [stores.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  store: one(stores, { fields: [payments.storeId], references: [stores.id] }),
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const productMediaRelations = relations(productMedia, ({ one }) => ({
  product: one(products, { 
    fields: [productMedia.productId], 
    references: [products.id] 
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  store: one(stores, { fields: [reviews.storeId], references: [stores.id] }),
}));