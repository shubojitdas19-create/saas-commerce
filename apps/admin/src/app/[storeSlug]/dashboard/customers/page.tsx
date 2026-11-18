import { db } from "@/lib/db";
import { stores, orders } from "@repo/db";
import { eq, desc } from "drizzle-orm";
import { CustomersClient } from "./customers-client";

export const dynamic = 'force-dynamic';

export default async function CustomersPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;

  // 1. Authenticate the store TEST LINE
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, storeSlug),
  });

  if (!store) {
    return <div className="flex min-h-[50vh] items-center justify-center text-zinc-500">Store not found.</div>;
  }

  // 2. Fetch all orders
  const storeOrders = await db.query.orders.findMany({
    where: eq(orders.storeId, store.id),
    orderBy: [desc(orders.createdAt)],
  });

  // 3. Aggregate data securely on the server
  const customersMap = new Map();

  for (const order of storeOrders) {
    if (order.status === "cancelled") continue;

    const uniqueKey = order.customerEmail || order.customerPhone;

    if (!customersMap.has(uniqueKey)) {
      customersMap.set(uniqueKey, {
        id: uniqueKey,
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderDate: order.createdAt,
      });
    }

    const customer = customersMap.get(uniqueKey);
    customer.totalOrders += 1;
    customer.totalSpent += Number(order.totalAmount);
    
    if (new Date(order.createdAt) > new Date(customer.lastOrderDate)) {
      customer.lastOrderDate = order.createdAt;
    }
  }

  const customers = Array.from(customersMap.values());

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Pass the data to our interactive component */}
      <CustomersClient initialCustomers={customers} />
    </div>
  );
}