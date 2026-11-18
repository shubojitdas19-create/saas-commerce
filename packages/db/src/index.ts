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