"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, Clock, CheckCircle2, 
  XCircle, MapPin, User, Mail, Phone, Loader2, Save, CreditCard
} from "lucide-react";
import { OrderStatusManager } from "./order-status-manager";
import { updateQuotePrices, getOrderDetailsAction } from "./actions";

export default function OrderDetailsPage({ 
  params 
}: { 
  params: Promise<{ storeSlug: string; orderId: string }> 
}) {
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  
  const [store, setStore] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  
  // NEW: State to hold the payment record
  const [payment, setPayment] = useState<any>(null); 
  const [isLoading, setIsLoading] = useState(true);

  // State for Quote Pricing
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    params.then(p => {
      setStoreSlug(p.storeSlug);
      setOrderId(p.orderId);
      fetchData(p.storeSlug, p.orderId);
    });
  }, [params]);

  const fetchData = async (slug: string, id: string) => {
    setIsLoading(true);
    const data = await getOrderDetailsAction(slug, id);
    if (data.success) {
      setStore(data.store);
      setOrder(data.order);
      setItems(data.items);
      
      // NEW: Set the payment record into state
      setPayment(data.payment); 
      
      // Initialize editable prices
      const initialPrices: Record<string, number> = {};
      data.items.forEach((item: any) => {
        initialPrices[item.id] = Number(item.price);
      });
      setEditedPrices(initialPrices);
    }
    setIsLoading(false);
  };

  const handlePriceChange = (itemId: string, newPrice: string) => {
    const numericPrice = parseFloat(newPrice);
    if (!isNaN(numericPrice) && numericPrice >= 0) {
      setEditedPrices(prev => ({ ...prev, [itemId]: numericPrice }));
    } else if (newPrice === "") {
      setEditedPrices(prev => ({ ...prev, [itemId]: 0 }));
    }
  };

  const handleSavePrices = () => {
    startTransition(async () => {
      const payload = Object.entries(editedPrices).map(([id, newPrice]) => ({
        id,
        newPrice
      }));
      
      const res = await updateQuotePrices(orderId, payload, storeSlug);
      if (res.success) {
        alert("Quote prices updated successfully!");
        fetchData(storeSlug, orderId); // Refresh totals
      } else {
        alert("Failed to update prices.");
      }
    });
  };

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-zinc-400" /></div>;
  }

  if (!store || !order) {
    return <div className="flex min-h-[50vh] items-center justify-center text-zinc-500">Order not found.</div>;
  }

  const isQuoteMode = store.isQuoteBased;
  
  // Calculate dynamic total based on current edits
  const currentTotal = items.reduce((total, item) => {
    const price = editedPrices[item.id] !== undefined ? editedPrices[item.id] : Number(item.price);
    return total + (price * item.quantity);
  }, 0);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "--";
    return new Intl.DateTimeFormat('en-IN', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    }).format(new Date(date));
  };

  return (
    <div className="mx-auto w-full max-w-6xl flex flex-col gap-6">
      
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-4">
        <Link 
          href={`/${storeSlug}/dashboard/orders`}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors w-fit"
        >
          <ArrowLeft className="size-4" /> {isQuoteMode ? "Inquiries" : "Orders"}
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl flex items-center gap-3">
              #{order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {formatDate(order.createdAt)}
            </p>
          </div>
          
          <OrderStatusManager 
            orderId={order.id} 
            currentStatus={order.status} 
            storeSlug={storeSlug} 
            isQuoteMode={isQuoteMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Items */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-zinc-950">{isQuoteMode ? "Requested Items & Quoting" : "Order Items"}</h2>
              {isQuoteMode && (
                <button 
                  onClick={handleSavePrices}
                  disabled={isPending}
                  className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Save Quote
                </button>
              )}
            </div>
            
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden sm:block">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50/50 text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium text-center">Qty</th>
                    <th className="px-5 py-3 font-medium text-right">{isQuoteMode ? "Unit Price (Quote)" : "Unit Price"}</th>
                    <th className="px-5 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((item) => {
                    const price = isQuoteMode ? editedPrices[item.id] : Number(item.price);
                    
                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                              <Image src={item.imageUrl} alt={item.productName || "Product"} fill className="object-cover" unoptimized />
                            </div>
                            <div className="flex flex-col">
                              {item.brand && <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">{item.brand}</span>}
                              <span className="font-medium text-zinc-900 line-clamp-1 break-all whitespace-normal">{item.productName}</span>
                              {item.variantTitle && item.variantTitle !== "Default Option" && (
                                <span className="inline-flex mt-1 w-fit items-center rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 border border-zinc-200">
                                  {item.variantTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-medium text-zinc-700">x{item.quantity}</td>
                        <td className="px-5 py-4 text-right">
                          {isQuoteMode ? (
                            <div className="flex justify-end">
                              <div className="relative w-24">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">₹</span>
                                <input 
                                  type="number" 
                                  min="0"
                                  value={price === 0 ? "" : price} 
                                  onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                  className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-6 pr-2 text-sm font-medium text-zinc-900 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none"
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-600">₹{price.toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-zinc-900">
                          ₹{(price * item.quantity).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE LIST VIEW */}
            <div className="flex flex-col divide-y divide-zinc-100 sm:hidden">
              {items.map((item) => {
                const price = isQuoteMode ? editedPrices[item.id] : Number(item.price);

                return (
                  <div key={item.id} className="flex gap-4 p-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                      <Image src={item.imageUrl} alt={item.productName || "Product"} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        {item.brand && <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">{item.brand}</span>}
                        <span className="font-medium text-sm text-zinc-900 line-clamp-2 leading-tight">{item.productName}</span>
                        {item.variantTitle && item.variantTitle !== "Default Option" && (
                          <span className="inline-block mt-1.5 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 border border-zinc-200">
                            {item.variantTitle}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                          Qty: {item.quantity} × 
                          {isQuoteMode ? (
                            <input 
                              type="number" 
                              value={price === 0 ? "" : price} 
                              onChange={(e) => handlePriceChange(item.id, e.target.value)}
                              className="w-16 rounded border border-zinc-200 px-1.5 py-0.5 text-xs outline-none focus:border-zinc-900"
                              placeholder="Price"
                            />
                          ) : (
                            `₹${price.toLocaleString('en-IN')}`
                          )}
                        </span>
                        <span className="text-sm font-bold text-zinc-950">
                          ₹{(price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Payment Summary */}
            <div className="bg-zinc-50/80 px-5 py-4 border-t border-zinc-200 flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>₹{currentTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold text-zinc-950">
                <span>{isQuoteMode ? "Quoted Total" : "Total"}</span>
                <span>₹{currentTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Payment, Customer & Timeline */}
        <div className="flex flex-col gap-6 lg:col-span-1 lg:sticky lg:top-6">
          
          {/* NEW: Payment Details Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-950 mb-4 flex items-center gap-2">
              <CreditCard className="size-4 text-zinc-400" /> Payment Details
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-sm text-zinc-500">Method</span>
                <span className="text-sm font-semibold text-zinc-900 uppercase">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <span className="text-sm text-zinc-500">Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              {payment && (
                <>
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                    <span className="text-sm text-zinc-500">Provider</span>
                    <span className="text-sm font-semibold text-zinc-900 capitalize">{payment.provider}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-sm text-zinc-500">Transaction ID</span>
                    <code className="text-[10px] bg-zinc-50 px-1.5 py-1 rounded border border-zinc-200 text-zinc-700 select-all max-w-[140px] truncate" title={payment.transactionId}>
                      {payment.transactionId}
                    </code>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-950 mb-4">Customer</h2>
            <div className="flex flex-col gap-3 text-sm text-zinc-600">
              <div className="flex items-center gap-3">
                <User className="size-4 text-zinc-400 shrink-0" />
                <span className="font-medium text-zinc-900">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-zinc-400 shrink-0" />
                <a href={`mailto:${order.customerEmail}`} className="hover:text-zinc-900 transition-colors truncate">{order.customerEmail || "No email provided"}</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-zinc-400 shrink-0" />
                <a href={`tel:${order.customerPhone}`} className="hover:text-zinc-900 transition-colors">{order.customerPhone}</a>
              </div>
            </div>
            <hr className="my-4 border-zinc-100" />
            <h3 className="font-medium text-zinc-900 mb-2 flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-zinc-400 shrink-0" /> {isQuoteMode ? "Project/Delivery Address" : "Shipping Address"}
            </h3>
            <p className="text-sm text-zinc-600 whitespace-pre-wrap pl-6 leading-relaxed">{order.shippingAddress}</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-zinc-950 mb-5">Timeline</h2>
            <div className="relative border-l border-zinc-200 ml-2.5 space-y-6 pb-2">
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 flex size-4 items-center justify-center rounded-full bg-zinc-900 ring-4 ring-white" />
                <h3 className="text-sm font-medium text-zinc-900">{isQuoteMode ? "Request Received" : "Order Placed"}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 flex size-4 items-center justify-center rounded-full ring-4 ring-white ${order.acceptedAt ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                <h3 className={`text-sm font-medium ${order.acceptedAt ? 'text-zinc-900' : 'text-zinc-400'}`}>{isQuoteMode ? "Quote Sent" : "Accepted"}</h3>
                {order.acceptedAt && <p className="text-xs text-zinc-500 mt-0.5">{formatDate(order.acceptedAt)}</p>}
              </div>
              <div className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 flex size-4 items-center justify-center rounded-full ring-4 ring-white ${order.dispatchedAt ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                <h3 className={`text-sm font-medium ${order.dispatchedAt ? 'text-zinc-900' : 'text-zinc-400'}`}>Dispatched</h3>
                {order.dispatchedAt && <p className="text-xs text-zinc-500 mt-0.5">{formatDate(order.dispatchedAt)}</p>}
              </div>
              <div className="relative pl-6">
                <span className={`absolute -left-[9px] top-1 flex size-4 items-center justify-center rounded-full ring-4 ring-white ${order.deliveredAt ? 'bg-emerald-500' : 'bg-zinc-200'}`}>
                  {order.deliveredAt && <CheckCircle2 className="absolute size-3.5 text-white" />}
                </span>
                <h3 className={`text-sm font-medium ${order.deliveredAt ? 'text-zinc-900' : 'text-zinc-400'}`}>{isQuoteMode ? "Fulfilled" : "Delivered"}</h3>
                {order.deliveredAt && <p className="text-xs text-zinc-500 mt-0.5">{formatDate(order.deliveredAt)}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}