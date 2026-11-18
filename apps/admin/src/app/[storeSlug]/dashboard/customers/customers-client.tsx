"use client";

import { useState, useMemo } from "react";
import { Users, Search, Filter, Mail, Phone } from "lucide-react";

// Define the shape of our customer data
type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date;
};

export function CustomersClient({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"spent-desc" | "spent-asc" | "orders-desc" | "recent">("spent-desc");

  // Instantly filter and sort the data based on the user's input
  const filteredAndSorted = useMemo(() => {
    let result = [...initialCustomers];

    // 1. Apply Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        (c.email && c.email.toLowerCase().includes(query)) ||
        c.phone.includes(query)
      );
    }

    // 2. Apply Sorting
    result.sort((a, b) => {
      if (sortBy === "spent-desc") return b.totalSpent - a.totalSpent; // Highest spent
      if (sortBy === "spent-asc") return a.totalSpent - b.totalSpent;   // Lowest spent
      if (sortBy === "orders-desc") return b.totalOrders - a.totalOrders; // Most orders
      if (sortBy === "recent") return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime(); // Newest
      return 0;
    });

    return result;
  }, [initialCustomers, searchQuery, sortBy]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', { 
      month: 'short', day: 'numeric', year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Customers</h1>
          <p className="mt-1 text-sm text-zinc-500">View your buyers and their lifetime purchase history.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Active Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-zinc-950 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
            />
          </div>
          
          {/* Active Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-colors ${isFilterOpen ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'}`}
            >
              <Filter className="size-4" />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg z-50">
                <p className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sort By</p>
                <button onClick={() => { setSortBy('spent-desc'); setIsFilterOpen(false); }} className={`w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-zinc-50 transition-colors ${sortBy === 'spent-desc' ? 'font-medium text-zinc-900 bg-zinc-50' : 'text-zinc-600'}`}>Highest Spent</button>
                <button onClick={() => { setSortBy('orders-desc'); setIsFilterOpen(false); }} className={`w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-zinc-50 transition-colors ${sortBy === 'orders-desc' ? 'font-medium text-zinc-900 bg-zinc-50' : 'text-zinc-600'}`}>Most Orders</button>
                <button onClick={() => { setSortBy('recent'); setIsFilterOpen(false); }} className={`w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-zinc-50 transition-colors ${sortBy === 'recent' ? 'font-medium text-zinc-900 bg-zinc-50' : 'text-zinc-600'}`}>Most Recent</button>
                <button onClick={() => { setSortBy('spent-asc'); setIsFilterOpen(false); }} className={`w-full text-left px-2 py-2 text-sm rounded-lg hover:bg-zinc-50 transition-colors ${sortBy === 'spent-asc' ? 'font-medium text-zinc-900 bg-zinc-50' : 'text-zinc-600'}`}>Lowest Spent</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200">
            <Users className="size-8 text-zinc-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-950">No customers found</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">
            {searchQuery ? `No results match "${searchQuery}".` : "When shoppers complete an order on your storefront, their profiles will be generated here."}
          </p>
        </div>
      ) : (
        <>
          {/* MOBILE UI */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredAndSorted.map((customer) => (
              <div key={customer.id} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4 border-b border-zinc-100 pb-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 font-semibold text-white">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-950">{customer.name}</p>
                    <p className="text-xs text-zinc-500">{customer.phone}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Spent</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-zinc-950">₹{customer.totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Orders</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-zinc-950">{customer.totalOrders}</p>
                  </div>
                </div>
                
                <div className="mt-1 pt-4 border-t border-zinc-100">
                  <p className="text-xs text-zinc-500 flex items-center justify-between">
                    <span>Last Order</span>
                    <span className="font-medium text-zinc-900">{formatDate(customer.lastOrderDate)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP UI */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50/80">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Contact</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Orders</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Spent</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAndSorted.map((customer) => (
                  <tr key={customer.id} className="group transition-colors hover:bg-zinc-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-600 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-zinc-950">{customer.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-zinc-600">
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="size-3.5 text-zinc-400" />
                            <span className="text-xs">{customer.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5 text-zinc-400" />
                          <span className="text-xs">{customer.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800">
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold tabular-nums text-zinc-950">
                        ₹{customer.totalSpent.toLocaleString('en-IN')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500 font-medium text-xs">
                      {formatDate(customer.lastOrderDate)}
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