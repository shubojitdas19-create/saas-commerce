import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@repo/db";

// Check if the DATABASE_URL environment variable is properly loaded
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in apps/admin/.env");
}

// Cache the database connection globally in development.
// This prevents connection limit exhaustion during Next.js hot-reloads.
const globalForDb = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

const mysqlPool =
  globalForDb.mysqlPool ??
  mysql.createPool({
    uri: process.env.DATABASE_URL as string,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = mysqlPool;
}

export const db = drizzle(mysqlPool, { schema, mode: "default" });