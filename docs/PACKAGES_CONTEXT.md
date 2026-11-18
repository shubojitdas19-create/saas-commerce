# SaaS Commerce Shared Packages Context

### `/packages/db/drizzle.config.ts`
```typescript
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
```

### `/packages/db/package.json`
```json
{
  "name": "@repo/db",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "dotenv": "^16.6.1",
    "drizzle-orm": "^0.38.4",
    "mysql2": "^3.12.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.7",
    "drizzle-kit": "^0.30.2",
    "typescript": "^5.7.3"
  }
}
```

### `/packages/db/src/index.ts`
```typescript
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  conn: mysql.Pool | undefined;
};

const connectionUri = process.env.DATABASE_URL;

if (!connectionUri) {
  // Safe fallback warning during build time
  console.warn("DATABASE_URL is not set.");
}

const pool =
  globalForDb.conn ??
  mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") globalForDb.conn = pool;

export const db = drizzle(pool, { schema, mode: "default" });
export * from "./schema";
```

### `/packages/db/src/schema/index.ts`
```typescript
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
```

### `/packages/db/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

### `/packages/eslint-config/base.js`
```typescript
import babelParser from "@babel/eslint-parser";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-typescript"],
        },
      },
    },
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];

```

### `/packages/eslint-config/next.js`
```typescript
import { globalIgnores } from "eslint/config";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import pluginNext from "@next/eslint-plugin-next";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nextJsConfig = [
  ...baseConfig,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  pluginReactHooks.configs.flat.recommended,
];

```

### `/packages/eslint-config/package.json`
```json
{
  "name": "@repo/eslint-config",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "exports": {
    "./base": "./base.js",
    "./next-js": "./next.js",
    "./react-internal": "./react-internal.js"
  },
  "devDependencies": {
    "@babel/core": "8.0.1",
    "@babel/eslint-parser": "8.0.1",
    "@babel/preset-typescript": "8.0.1",
    "@eslint/js": "10.0.1",
    "@next/eslint-plugin-next": "16.3.4",
    "eslint": "10.9.1",
    "eslint-config-prettier": "10.1.8",
    "eslint-plugin-only-warn": "1.2.1",
    "eslint-plugin-react-hooks": "7.1.1",
    "eslint-plugin-turbo": "2.10.12",
    "globals": "17.12.0"
  }
}

```

### `/packages/eslint-config/react-internal.js`
```typescript
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config[]} */
export const config = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  pluginReactHooks.configs.flat.recommended,
];

```

### `/packages/typescript-config/base.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "incremental": false,
    "isolatedModules": true,
    "lib": ["es2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleDetection": "force",
    "moduleResolution": "NodeNext",
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2022"
  }
}

```

### `/packages/typescript-config/nextjs.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowJs": true,
    "jsx": "preserve",
    "noEmit": true
  }
}

```

### `/packages/typescript-config/package.json`
```json
{
  "name": "@repo/typescript-config",
  "version": "0.0.0",
  "private": true,
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  }
}

```

### `/packages/typescript-config/react-library.json`
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}

```

### `/packages/ui/package.json`
```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./*": "./src/*.tsx"
  },
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "generate:component": "turbo gen react-component",
    "check-types": "tsc --noEmit"
  },
  "devDependencies": {
    "@repo/eslint-config": "workspace:*",
    "@repo/typescript-config": "workspace:*",
    "@types/node": "26.4.1",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.5",
    "eslint": "10.9.1",
    "typescript": "7.0.2"
  },
  "dependencies": {
    "react": "19.2.8",
    "react-dom": "19.2.8"
  }
}

```

### `/packages/ui/src/button.tsx`
```typescript
"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = ({ children, className, appName }: ButtonProps) => {
  return (
    <button
      className={className}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};

```

### `/packages/ui/src/card.tsx`
```typescript
import { type JSX } from "react";

export function Card({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}): JSX.Element {
  return (
    <a
      className={className}
      href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo"`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <h2>
        {title} <span>-&gt;</span>
      </h2>
      <p>{children}</p>
    </a>
  );
}

```

### `/packages/ui/src/code.tsx`
```typescript
import { type JSX } from "react";

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return <code className={className}>{children}</code>;
}

```

### `/packages/ui/tsconfig.json`
```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "strictNullChecks": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}

```

