import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { stores, users, orders, products, productVariants } from "@repo/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { Package, ShoppingCart, Settings, ArrowUpRight, TrendingUp, Users, Activity, PackageOpen, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function TenantDashboardPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  
  const cookieStore = await cookies();
  const userId = cookieStore.get("tenant_session")?.value;

  if (!userId) redirect(`/${storeSlug}/login`);

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!currentUser) redirect(`/${storeSlug}/login`);

  const currentStore = await db.query.stores.findFirst({
    where: eq(stores.id, currentUser.storeId),
  });

  if (!currentStore || currentStore.slug !== storeSlug) {
    redirect(`/${storeSlug}/login`);
  }

  // --- OPTIMIZED BACKEND DATA FETCHING ---
  const storeOrders = await db.query.orders.findMany({
    where: eq(orders.storeId, currentStore.id),
    orderBy: [desc(orders.createdAt)],
  });

  const activeProductsQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.storeId, currentStore.id), eq(products.isArchived, false)));
    
  const activeProductsCount = Number(activeProductsQuery[0]?.count || 0);

  const activeVariantsQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(eq(products.storeId, currentStore.id), eq(products.isArchived, false)));
    
  const activeVariantsCount = Number(activeVariantsQuery[0]?.count || 0);

  // --- METRIC CALCULATIONS ---
  const totalRevenue = storeOrders
    .filter(o => o.status !== "cancelled")
    .reduce((sum, order) => sum + parseFloat(order.totalAmount as string), 0);

  const ordersToFulfill = storeOrders.filter(
    o => !["delivered", "cancelled", "shipped"].includes(o.status)
  ).length;

  const uniqueCustomers = new Set(
    storeOrders.map(o => o.customerPhone || o.customerEmail)
  ).size;

  const recentOrders = storeOrders.slice(0, 5);

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Overview
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Here's what's happening with <span className="font-semibold text-zinc-900">{currentStore.name}</span> today.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
            <Button asChild className="bg-zinc-950 text-white hover:bg-zinc-800 hidden sm:flex shadow-sm transition-all active:scale-[0.98]">
              <Link href={`/${storeSlug}/dashboard/products`}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Link>
            </Button>
            <div className="h-10 w-10 bg-white border border-zinc-200 rounded-full flex items-center justify-center font-bold text-zinc-700 shadow-sm">
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
        </div>
      </div>

      {/* Quick Stats Grid with Lifting Micro-Interactions */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-zinc-200 hover:border-zinc-300 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Revenue
            </CardTitle>
            <span className="text-[10px] sm:text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">{currentStore.currency}</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-zinc-900">
              {totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
              <span className="text-emerald-600 font-medium mr-1">+0%</span> this week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 hover:border-zinc-300 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-zinc-900">{storeOrders.length}</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              <span className="text-zinc-600 font-medium mr-1">{ordersToFulfill}</span> to fulfill
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200 hover:border-zinc-300 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Products
            </CardTitle>
            <Package className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-zinc-900">{activeProductsCount}</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              <span className="text-zinc-600 font-medium mr-1">{activeVariantsCount}</span> active variants
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-zinc-200 hover:border-zinc-300 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-3xl font-bold tracking-tight text-zinc-900">{uniqueCustomers}</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              <span className="text-zinc-600 font-medium mr-1">{uniqueCustomers}</span> registered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
         {/* Left Side: Activity Feed */}
         <Card className="col-span-1 lg:col-span-4 shadow-sm border-zinc-200">
           <CardHeader>
             <CardTitle className="text-lg font-semibold text-zinc-900">Recent Activity</CardTitle>
             <CardDescription>Your store's latest transactions and customer events.</CardDescription>
           </CardHeader>
           
           {/* PREMIUM EMPTY STATE */}
           {recentOrders.length === 0 ? (
             <CardContent className="flex flex-col items-center justify-center py-16 text-center px-4 border-t border-zinc-100">
               <div className="h-16 w-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 border border-zinc-200/80 shadow-sm">
                 <PackageOpen className="h-8 w-8 text-zinc-400" />
               </div>
               <h3 className="text-base font-semibold text-zinc-950 mb-1">
                 No recent activity
               </h3>
               <p className="text-sm text-zinc-500 max-w-[280px] mb-6">
                 Your store is quiet right now. Get started by adding inventory to your catalog.
               </p>
               <Button asChild className="bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm transition-all active:scale-[0.98]">
                 <Link href={`/${storeSlug}/dashboard/products`}><Plus className="mr-2 h-4 w-4" /> Create your first product</Link>
               </Button>
             </CardContent>
           ) : (
             <CardContent className="p-0 border-t border-zinc-100">
               <div className="divide-y divide-zinc-100">
                 {recentOrders.map((order) => (
                   <div key={order.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors group">
                     <div className="flex flex-col">
                        <Link href={`/${storeSlug}/dashboard/orders/${order.id}`} className="text-sm font-medium text-zinc-900 group-hover:text-emerald-600 transition-colors">
                          New order #{order.orderNumber}
                        </Link>
                        <p className="text-xs text-zinc-500 mt-0.5">{order.customerName}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-medium text-zinc-900">
                          {currentStore.currency} {Number(order.totalAmount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-0.5">
                          {order.status}
                        </p>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           )}
         </Card>

         {/* Right Side: Quick Actions */}
         <Card className="col-span-1 lg:col-span-3 shadow-sm border-zinc-200">
           <CardHeader>
             <CardTitle className="text-lg font-semibold text-zinc-900">Quick Actions</CardTitle>
             <CardDescription>Get started with your storefront setup.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-3">
             
             <Link href={`/${storeSlug}/dashboard/settings`} className="block outline-none">
               <div className="flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer group">
                  <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-2 rounded-md group-hover:bg-emerald-200 transition-colors">
                          <Settings className="h-4 w-4 text-emerald-700" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-zinc-900">Store Settings</p>
                          <p className="text-xs text-zinc-500">Configure currency & business details</p>
                      </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
               </div>
             </Link>

             <Link href={`/${storeSlug}/dashboard/products`} className="block outline-none">
               <div className="flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer group">
                  <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-md group-hover:bg-blue-200 transition-colors">
                          <Package className="h-4 w-4 text-blue-700" />
                      </div>
                      <div>
                          <p className="text-sm font-medium text-zinc-900">View Catalog</p>
                          <p className="text-xs text-zinc-500">Manage your product inventory</p>
                      </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
               </div>
             </Link>

           </CardContent>
         </Card>
      </div>
    </div>
  );
}