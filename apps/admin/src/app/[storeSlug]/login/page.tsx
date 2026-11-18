import { cache } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { stores } from "@repo/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ storeSlug: string }>;
};

// Deduplicates the DB query between generateMetadata and TenantLoginPage
const getStoreBySlug = cache(async (storeSlug: string) => {
  return db.query.stores.findFirst({
    where: eq(stores.slug, storeSlug),
  });
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await getStoreBySlug(storeSlug);

  if (!store) {
    return {
      title: "Store Not Found | Vanij",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Sign in · ${store.name} | Vanij`,
    description: `Sign in to the ${store.name} admin workspace on Vanij.`,
    robots: { index: false, follow: false },
  };
}

export default async function TenantLoginPage({ params }: PageProps) {
  const { storeSlug } = await params;
  const store = await getStoreBySlug(storeSlug);

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