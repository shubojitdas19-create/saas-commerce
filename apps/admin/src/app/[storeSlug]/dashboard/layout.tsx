import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { stores, users, storeSettings } from "@repo/db";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";
import { TenantSidebar } from "./tenant-sidebar";
import { TenantAssistant } from "./tenant-assistant";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'sonner';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, storeSlug),
  });

  return {
    title: store ? `${store.name} - Store Dashboard` : "Merchant Dashboard",
    description: `Administrative Operations Dashboard for ${store?.name || storeSlug} on Vanij Commerce Cloud.`,
  };
}


export default async function TenantDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  // 1. Authenticate the session globally for all dashboard routes
  const cookieStore = await cookies();
  const userId = cookieStore.get("tenant_session")?.value;

  if (!userId) redirect(`/${storeSlug}/login`);

  const authCheck = await db
    .select({
      store: stores,
    })
    .from(users)
    .innerJoin(stores, eq(users.storeId, stores.id))
    .where(
      and(
        eq(users.id, userId),
        eq(stores.slug, storeSlug)
      )
    )
    .limit(1);

  if (authCheck.length === 0 || !authCheck[0]) {
    redirect(`/${storeSlug}/login`);
  }

  const currentStore = authCheck[0].store;

  // Fetch store settings to get customDomain
  const settings = await db.query.storeSettings.findFirst({
    where: eq(storeSettings.storeId, currentStore.id),
  });

  const customDomain = settings?.customDomain?.trim() || null;
  const storeWebsiteUrl = customDomain
    ? (customDomain.startsWith("http") ? customDomain : `https://${customDomain}`)
    : `/${storeSlug}`;

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* 
        NEW: Top loading progress bar injected here. 
        It sits globally at the top level of the dashboard.
      */}
      <NextTopLoader color="#10b981" showSpinner={false} shadow="0 0 10px #10b981,0 0 5px #10b981" />
      
      {/* 
        NEW: Global Toaster injected here. 
        richColors gives it the professional red/green/amber styling.
      */}
      <Toaster richColors position="bottom-right" />
      
      {/* 
        NEW: In-App AI Tenant Copilot & Assistant
      */}
      <TenantAssistant 
        storeSlug={storeSlug} 
        storeName={currentStore.name} 
      />
      
      <TenantSidebar 
        storeSlug={storeSlug} 
        storeName={currentStore.name} 
        logoUrl={currentStore.logoUrl} 
        customDomain={customDomain}
        storeWebsiteUrl={storeWebsiteUrl}
      />
      
      {/* 
        NEW: Added pb-20 for mobile so content isn't hidden behind the new Bottom Nav. 
        Desktop (lg:pb-0) removes this padding since the sidebar is on the left.
      */}
      <main className="flex-1 flex flex-col min-w-0 lg:pl-[260px] pt-16 pb-20 lg:pt-0 lg:pb-0">
        <div className="flex-1 w-full p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}