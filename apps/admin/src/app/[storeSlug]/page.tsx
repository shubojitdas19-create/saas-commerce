import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { stores } from "@repo/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function StoreSlugRedirectPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  const store = await db.query.stores.findFirst({
    where: eq(stores.slug, storeSlug),
    with: {
      settings: true,
    },
  });

  if (!store) {
    redirect("/");
  }

  const customDomain = store.settings?.customDomain?.trim();
  if (customDomain) {
    const targetUrl = customDomain.startsWith("http")
      ? customDomain
      : `https://${customDomain}`;
    redirect(targetUrl);
  }

  // If running in development and no custom domain is set, check if localhost:3001 is standard
  if (process.env.NODE_ENV === "development") {
    redirect("http://localhost:3001");
  }

  // Fallback to tenant dashboard/login
  redirect(`/${storeSlug}/dashboard`);
}
