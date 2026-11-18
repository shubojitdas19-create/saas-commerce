import { db } from "@/lib/db";
import { stores, orders } from "@repo/db";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { 
  Package, 
  Eye, 
  Search, 
  Clock, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Filter,
  FileText
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function OrdersPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;

  // Authenticate the store and get its configuration
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, storeSlug),
  });

  if (!store) {
    return <div className="flex min-h-[50vh] items-center justify-center text-zinc-500">Store not found.</div>;
  }

  // Fetch all orders/inquiries for this store, newest first
  const storeOrders = await db.query.orders.findMany({
    where: eq(orders.storeId, store.id),
    orderBy: [desc(orders.createdAt)],
  });

  // Dynamic Terminology based on Store Type
  const isQuoteMode = store.isQuoteBased;
  const pageTitle = isQuoteMode ? "Inquiries & Quotes" : "Orders";
  const pageSubtitle = isQuoteMode 
    ? "Review customer requests and generate custom pricing quotes." 
    : "Track and fulfill incoming customer purchases.";
  const emptyStateTitle = isQuoteMode ? "No inquiries found" : "No orders found";
  const emptyStateDesc = isQuoteMode 
    ? "Customer quote requests submitted from your storefront will appear here." 
    : "Once your customers check out from the storefront, their orders will populate here automatically.";

  // Dynamic SaaS Badges
  const getStatusBadge = (status: string) => {
    if (isQuoteMode) {
      switch (status) {
        case "pending":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-600/20 shadow-sm"><Clock className="size-3.5" /> New Request</span>;
        case "accepted":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-600/20 shadow-sm"><FileText className="size-3.5" /> Quote Sent</span>;
        case "processing":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 ring-1 ring-inset ring-indigo-600/20 shadow-sm"><CheckCircle2 className="size-3.5" /> Approved</span>;
        case "dispatched":
        case "shipped":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-700 ring-1 ring-inset ring-purple-600/20 shadow-sm"><Truck className="size-3.5" /> Dispatched</span>;
        case "delivered":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-sm"><CheckCircle2 className="size-3.5" /> Fulfilled</span>;
        case "cancelled":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-600/10 shadow-sm"><XCircle className="size-3.5" /> Cancelled</span>;
        default:
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-zinc-700 ring-1 ring-inset ring-zinc-600/20 shadow-sm"><AlertCircle className="size-3.5" /> Unknown</span>;
      }
    } else {
      switch (status) {
        case "pending":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-700 ring-1 ring-inset ring-amber-600/20 shadow-sm"><Clock className="size-3.5" /> Pending</span>;
        case "processing":
        case "accepted":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 ring-1 ring-inset ring-blue-600/20 shadow-sm"><Package className="size-3.5" /> Processing</span>;
        case "dispatched":
        case "shipped":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-700 ring-1 ring-inset ring-purple-600/20 shadow-sm"><Truck className="size-3.5" /> Shipped</span>;
        case "delivered":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-sm"><CheckCircle2 className="size-3.5" /> Delivered</span>;
        case "cancelled":
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-700 ring-1 ring-inset ring-red-600/10 shadow-sm"><XCircle className="size-3.5" /> Cancelled</span>;
        default:
          return <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-zinc-700 ring-1 ring-inset ring-zinc-600/20 shadow-sm"><AlertCircle className="size-3.5" /> Unknown</span>;
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    }).format(new Date(date));
  };

  return (
    // FIX: Removed `pb-24 sm:pb-0` to eliminate the huge bottom gap
    <div className="w-full space-y-6 sm:space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">{pageTitle}</h1>
          <p className="mt-1 text-sm text-zinc-500">{pageSubtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder={`Search ${isQuoteMode ? "inquiries" : "orders"}...`}
              // NEW: focus-visible:ring-2 for crisp, modern inputs
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-zinc-950 shadow-sm outline-none transition-shadow placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          {/* NEW: active:scale-95 for tactile button press */}
          <button className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-950 active:scale-95">
            <Filter className="size-4" />
          </button>
        </div>
      </div>

      {storeOrders.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200">
            {isQuoteMode ? <FileText className="size-8 text-zinc-400" /> : <Package className="size-8 text-zinc-400" />}
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-950">{emptyStateTitle}</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">{emptyStateDesc}</p>
        </div>
      ) : (
        <>
          {/* =========================================
              MOBILE UI: Card-Based Layout
             ========================================= */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {storeOrders.map((order) => (
              // NEW: hover:-translate-y-1 for card lift effect
              <div key={order.id} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                
                <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                  <div>
                    <p className="font-bold text-zinc-950">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-zinc-500">{formatDate(order.createdAt)}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{order.customerName}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{order.customerPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-zinc-950">₹{Number(order.totalAmount).toLocaleString('en-IN')}</p>
                    {!isQuoteMode && (
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">{order.paymentMethod} • {order.paymentStatus}</p>
                    )}
                  </div>
                </div>

                <Link 
                  href={`/${storeSlug}/dashboard/orders/${order.id}`}
                  // NEW: active:scale-[0.98] to make the button feel "clickable" on mobile
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-50 py-3 text-sm font-semibold text-zinc-900 ring-1 ring-inset ring-zinc-200 transition-all hover:bg-zinc-100 active:scale-[0.98]"
                >
                  <Eye className="size-4 text-zinc-500" /> View Details
                </Link>
              </div>
            ))}
          </div>

          {/* =========================================
              DESKTOP UI: Modern Data Table
             ========================================= */}
          <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50/80">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{isQuoteMode ? "Req ID" : "Order ID"}</th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Customer</th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Date</th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{isQuoteMode ? "Quoted Value" : "Total"}</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {storeOrders.map((order) => (
                  // NEW: hover:bg-zinc-50/70 for smoother row highlighting
                  <tr key={order.id} className="group transition-colors hover:bg-zinc-50/70">
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 transition-colors group-hover:bg-white group-hover:shadow-sm">
                          {isQuoteMode ? <FileText className="size-5" /> : <Package className="size-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-zinc-950">{order.orderNumber}</p>
                          {!isQuoteMode && (
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">{order.paymentMethod}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900">{order.customerName}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{order.customerPhone}</p>
                    </td>
                    
                    <td className="px-6 py-4 text-zinc-600 font-medium">
                      {formatDate(order.createdAt)}
                    </td>
                    
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold tabular-nums text-zinc-950">₹{Number(order.totalAmount).toLocaleString('en-IN')}</p>
                      {!isQuoteMode && (
                         <p className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${order.paymentStatus === 'unpaid' ? 'text-amber-600' : 'text-emerald-600'}`}>
                           {order.paymentStatus === 'unpaid' ? 'Unpaid' : 'Paid'}
                         </p>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/${storeSlug}/dashboard/orders/${order.id}`}
                        // NEW: active:scale-95 for button feedback
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-400 shadow-sm transition-all hover:border-zinc-300 hover:text-zinc-900 active:scale-95"
                        title="View Details"
                      >
                        <Eye className="size-4" />
                      </Link>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}