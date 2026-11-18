import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { stores, users, products, productMedia, productVariants } from "@repo/db";
import { eq, like, and, desc, or } from "drizzle-orm";
import { Plus, Search, PackageOpen, ImageIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { DeleteProductButton } from "./delete-product-button"; 

export default async function TenantProductsPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { storeSlug } = await params;
  const { q: searchQuery, status: statusFilter, page: pageParam } = await searchParams;
  
  const cookieStore = await cookies();
  const userId = cookieStore.get("tenant_session")?.value;
  if (!userId) redirect(`/${storeSlug}/login`);

  const currentUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!currentUser) redirect(`/${storeSlug}/login`);

  const currentStore = await db.query.stores.findFirst({ where: eq(stores.id, currentUser.storeId) });
  if (!currentStore || currentStore.slug !== storeSlug) redirect(`/${storeSlug}/login`);

  const currentPage = parseInt(pageParam || "1", 10);
  const itemsPerPage = 50;
  const offset = (currentPage - 1) * itemsPerPage;

  const conditions = [eq(products.storeId, currentStore.id)];
  
  if (searchQuery) {
    conditions.push(
      or(
        like(products.name, `%${searchQuery}%`),
        like(products.brand, `%${searchQuery}%`)
      )
    );
  }
  
  if (statusFilter === "active") conditions.push(eq(products.isArchived, false));
  if (statusFilter === "draft") conditions.push(eq(products.isArchived, true));

  const rawProducts = await db.query.products.findMany({
    where: and(...conditions),
    with: {
      media: { orderBy: (media, { asc }) => [asc(media.sortOrder)], limit: 1 },
      variants: true,
    },
    orderBy: [desc(products.createdAt)],
    limit: itemsPerPage + 1, 
    offset: offset,
  });

  const hasNextPage = rawProducts.length > itemsPerPage;
  const storeProducts = rawProducts.slice(0, itemsPerPage);

  const buildPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", newPage.toString());
    return `/${storeSlug}/dashboard/products?${params.toString()}`;
  };

  async function deleteProductAction(productId: string) {
    "use server";
    if (!productId) return { success: false, error: "Invalid product ID" };
    
    try {
      await db.delete(productMedia).where(eq(productMedia.productId, productId));
      await db.delete(productVariants).where(eq(productVariants.productId, productId));
      await db.delete(products).where(eq(products.id, productId));
      
      revalidatePath(`/${storeSlug}/dashboard/products`);
      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to delete product." };
    }
  }

  const hasActiveFilters = searchQuery || statusFilter;

  // Reusable Pagination Component for Top and Bottom
  const PaginationControls = () => (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-zinc-50/50">
      <p className="text-xs text-zinc-500">
        Showing page <span className="font-semibold text-zinc-900">{currentPage}</span>
      </p>
      <div className="flex items-center gap-2">
        <Link 
          href={currentPage > 1 ? buildPaginationUrl(currentPage - 1) : "#"}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all active:scale-[0.98] ${
            currentPage <= 1 
              ? "pointer-events-none opacity-50 border-zinc-200 text-zinc-400" 
              : "border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
          }`}
        >
          Previous
        </Link>
        <Link 
          href={hasNextPage ? buildPaginationUrl(currentPage + 1) : "#"}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all active:scale-[0.98] ${
            !hasNextPage 
              ? "pointer-events-none opacity-50 border-zinc-200 text-zinc-400" 
              : "border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );

  return (
    // FIX 1: Removed pb-24 here. The global layout now handles bottom padding!
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">Products</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your inventory, brands, pricing, and product media.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button asChild className="bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
            <Link href={`/${storeSlug}/dashboard/products/new`}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <form className="relative flex-1 max-w-sm" method="GET">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input 
            name="q"
            defaultValue={searchQuery || ""}
            placeholder="Search by product name or brand..." 
            className="pl-9 bg-white border-zinc-200 shadow-sm focus-visible:ring-2 focus-visible:ring-zinc-900 transition-shadow"
          />
        </form>
        
        {/* Segmented Control Filter */}
        <div className="flex bg-zinc-100/80 p-1 rounded-lg border border-zinc-200/50 overflow-x-auto">
          <Link href={`/${storeSlug}/dashboard/products`} className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-all active:scale-95 ${!statusFilter ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"}`}>All</Link>
          <Link href={`/${storeSlug}/dashboard/products?status=active`} className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-all active:scale-95 ${statusFilter === 'active' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"}`}>Active</Link>
          <Link href={`/${storeSlug}/dashboard/products?status=draft`} className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md transition-all active:scale-95 ${statusFilter === 'draft' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"}`}>Draft</Link>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {storeProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="h-16 w-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 border border-zinc-200/80 shadow-sm">
              <PackageOpen className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="text-base font-semibold text-zinc-950 mb-1">
              {hasActiveFilters ? "No matching products found" : "No products added yet"}
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">
              {hasActiveFilters ? "Try adjusting your search term or clearing the filter." : "Get started by creating your first catalog item."}
            </p>
            {!hasActiveFilters && (
              <Button asChild className="bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm transition-all active:scale-[0.98]">
                <Link href={`/${storeSlug}/dashboard/products/new`}><Plus className="mr-2 h-4 w-4" /> Add Your First Product</Link>
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* FIX 2: TOP PAGINATION ADDED */}
            <div className="border-b border-zinc-200">
              <PaginationControls />
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50/75 text-zinc-500 font-medium border-b border-zinc-200">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider">Inventory</th>
                    <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60">
                  {storeProducts.map((product) => {
                    const totalStock = product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) || 0;
                    return (
                      <tr key={product.id} className="hover:bg-zinc-50/70 transition-colors group">
                        <td className="px-6 py-4">
                          <Link href={`/${storeSlug}/dashboard/products/${product.id}`} className="flex items-center gap-3.5 group/link outline-none">
                            <div className="h-11 w-11 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform group-hover/link:scale-105">
                              {product.media.length > 0 ? <img src={product.media[0].url} alt={product.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-zinc-400" />}
                            </div>
                            <div>
                              <div className="font-medium text-zinc-900 group-hover/link:text-emerald-600 transition-colors max-w-[300px] truncate">{product.name}</div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                                {product.brand && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200 max-w-[150px] truncate">
                                    {product.brand}
                                  </span>
                                )}
                                <span>SKU: #{product.slug.slice(0, 8)}</span>
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          {product.isArchived 
                            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">Draft</span> 
                            : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Active</span>}
                        </td>
                        <td className="px-6 py-4 text-zinc-600">
                          <span className={totalStock === 0 ? "text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ring-inset ring-red-600/20" : "text-zinc-600 text-xs font-medium"}>
                            {totalStock === 0 ? "Out of stock" : `${totalStock} in stock`}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900">{currentStore.currency} {Number(product.basePrice).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all">
                              <Link href={`/${storeSlug}/dashboard/products/${product.id}`}><Pencil className="h-4 w-4" /></Link>
                            </Button>
                            <DeleteProductButton productId={product.id} deleteAction={deleteProductAction} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden divide-y divide-zinc-200 flex-1">
              {storeProducts.map((product) => {
                const totalStock = product.variants?.reduce((sum, v) => sum + (v.stockQuantity || 0), 0) || 0;
                return (
                  <div key={product.id} className="p-4 flex items-center justify-between gap-4 active:bg-zinc-50/50 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-14 w-14 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {product.media.length > 0 ? <img src={product.media[0].url} alt={product.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-zinc-400" />}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/${storeSlug}/dashboard/products/${product.id}`} className="font-medium text-zinc-900 truncate block text-sm outline-none">{product.name}</Link>
                        {product.brand && (
                          <div className="mt-0.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate">{product.brand}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-semibold text-xs text-zinc-900">{currentStore.currency} {Number(product.basePrice).toLocaleString()}</span>
                          <span className="text-zinc-300">•</span>
                          {product.isArchived ? <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">Draft</span> : <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded ring-1 ring-inset ring-emerald-600/20">Active</span>}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1">
                      <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 active:scale-95 transition-all">
                        <Link href={`/${storeSlug}/dashboard/products/${product.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteProductButton productId={product.id} deleteAction={deleteProductAction} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTTOM PAGINATION */}
            <div className="border-t border-zinc-200 mt-auto">
              <PaginationControls />
            </div>
          </>
        )}
      </div>
    </div>
  );
}