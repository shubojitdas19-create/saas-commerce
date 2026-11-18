import { db } from "@/lib/db";
import { stores, leads } from "@repo/db";
import { eq, desc } from "drizzle-orm";
import { 
  MessageSquare, 
  Phone, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  Inbox,
  User
} from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function LeadsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;

  // Authenticate the store
  const store = await db.query.stores.findFirst({ where: eq(stores.slug, storeSlug) });
  if (!store) return <div className="flex min-h-[50vh] items-center justify-center text-zinc-500">Store not found.</div>;

  // Fetch leads
  const storeLeads = await db.query.leads.findMany({
    where: eq(leads.storeId, store.id),
    orderBy: [desc(leads.createdAt)],
  });

  // Modern SaaS Badges for Lead Status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 shadow-sm uppercase tracking-wider">New</span>;
      case "contacted":
        return <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20 shadow-sm uppercase tracking-wider">Contacted</span>;
      case "resolved":
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-sm uppercase tracking-wider">Resolved</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-inset ring-zinc-600/20 shadow-sm uppercase tracking-wider">{status}</span>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
    }).format(new Date(date));
  };

  return (
    // FIX: Changed from "mx-auto w-full max-w-7xl..." to "w-full..."
    <div className="w-full space-y-6 sm:space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Consultation Leads</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage incoming consultation requests from your storefront.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm font-medium text-zinc-950 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
            />
          </div>
          <button className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950">
            <Filter className="size-4" />
          </button>
        </div>
      </div>

      {storeLeads.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200">
            <Inbox className="size-8 text-zinc-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-950">No consultation requests yet</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">When customers submit the consultation form on your storefront, they will appear here.</p>
        </div>
      ) : (
        <>
          {/* =========================================
              MOBILE UI: Card-Based Layout
             ========================================= */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {storeLeads.map((lead) => (
              <div key={lead.id} className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                
                <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-600">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-950">{lead.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <Phone className="size-3" /> {lead.phone}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>
                
                <div className="flex flex-col gap-3 text-sm text-zinc-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 shrink-0 text-zinc-400 mt-0.5" />
                    <span className="leading-relaxed">{lead.address}</span>
                  </div>
                  
                  {lead.message && (
                    <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100">
                      <p className="flex items-start gap-2 text-zinc-700 italic text-sm">
                        <MessageSquare className="size-4 shrink-0 text-zinc-400 mt-0.5" />
                        "{lead.message}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs font-medium text-zinc-400">
                  <Clock className="size-3.5" /> Received {formatDate(lead.createdAt)}
                </div>
              </div>
            ))}
          </div>

          {/* =========================================
              DESKTOP UI: Modern Data Table
             ========================================= */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50/80">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 w-[25%]">Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 w-[30%]">Address & Message</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Date Received</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {storeLeads.map((lead) => (
                  <tr key={lead.id} className="group transition-colors hover:bg-zinc-50/50">
                    
                    {/* Contact Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 font-semibold text-zinc-600 transition-colors group-hover:bg-zinc-900 group-hover:text-white shrink-0">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-semibold text-zinc-950 truncate max-w-[150px]">{lead.name}</p>
                          <a href={`tel:${lead.phone}`} className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                            <Phone className="size-3" /> {lead.phone}
                          </a>
                        </div>
                      </div>
                    </td>
                    
                    {/* Address & Message */}
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="flex flex-col gap-2 max-w-sm">
                        <p className="flex items-start gap-2 text-xs text-zinc-600 line-clamp-2">
                          <MapPin className="size-3.5 shrink-0 text-zinc-400 mt-0.5" />
                          {lead.address}
                        </p>
                        {lead.message && (
                          <p className="flex items-start gap-2 text-xs text-zinc-500 italic line-clamp-1 border-l-2 border-zinc-200 pl-2 ml-1">
                            "{lead.message}"
                          </p>
                        )}
                      </div>
                    </td>
                    
                    {/* Date */}
                    <td className="px-6 py-4 text-zinc-600 font-medium text-xs">
                      {formatDate(lead.createdAt)}
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4 text-right">
                      {getStatusBadge(lead.status)}
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