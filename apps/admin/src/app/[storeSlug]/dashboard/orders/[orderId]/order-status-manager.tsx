"use client";

import { useState } from "react";
import { updateOrderStatus } from "./actions";
import { Loader2, ChevronDown } from "lucide-react";

interface Props {
  orderId: string;
  currentStatus: string;
  storeSlug: string;
  isQuoteMode: boolean; // NEW: Toggle dynamic terminology
}

export function OrderStatusManager({ orderId, currentStatus, storeSlug, isQuoteMode }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as any;
    setIsUpdating(true);
    
    const result = await updateOrderStatus(orderId, newStatus, storeSlug);
    
    if (!result.success) {
      alert("Failed to update status.");
    }
    setIsUpdating(false);
  };

  return (
    <div className="relative flex items-center gap-3">
      {isUpdating && <Loader2 className="size-4 animate-spin text-zinc-400" />}
      
      <div className="relative">
        <select 
          disabled={isUpdating}
          value={currentStatus}
          onChange={handleStatusChange}
          className="appearance-none rounded-xl border border-zinc-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition-colors hover:bg-zinc-50 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 disabled:opacity-50"
        >
          {isQuoteMode ? (
            <>
              <option value="pending">🟡 New Request</option>
              <option value="accepted">🔵 Quote Sent</option>
              <option value="processing">🟣 Approved / Processing</option>
              <option value="dispatched">🚚 Dispatched</option>
              <option value="delivered">🟢 Fulfilled</option>
              <option value="cancelled">🔴 Cancelled</option>
            </>
          ) : (
            <>
              <option value="pending">🟡 Pending</option>
              <option value="accepted">🔵 Accepted</option>
              <option value="processing">🟣 Processing</option>
              <option value="dispatched">🚚 Dispatched</option>
              <option value="delivered">🟢 Delivered</option>
              <option value="cancelled">🔴 Cancelled</option>
            </>
          )}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
      </div>
    </div>
  );
}