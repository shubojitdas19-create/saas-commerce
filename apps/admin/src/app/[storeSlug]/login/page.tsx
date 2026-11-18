import { db } from "@/lib/db";
import { stores } from "@repo/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import LoginForm from "./login-form";

export const dynamic = 'force-dynamic';

export default async function TenantLoginPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  
  // Securely fetch the specific store's branding details directly from the database
  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, storeSlug),
  });

  // If someone tries to go to a store login URL that doesn't exist, show a 404 page
  if (!store) {
    notFound();
  }

  return (
    <LoginForm 
      storeSlug={store.slug} 
      storeName={store.name} 
      logoUrl={store.logoUrl} 
    />
  );
}