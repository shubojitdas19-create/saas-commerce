import { db } from "@/lib/db";
import { products } from "@repo/db";
import { eq } from "drizzle-orm";
import EditProductForm from "./edit-form";

export default async function EditProductPage({ params }: { params: Promise<{ storeSlug: string; productId: string }> }) {
  const { storeSlug, productId } = await params;
  
  // Fetch the existing data with ALL relations needed by the form
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    with: { 
      media: { orderBy: (m, { asc }) => [asc(m.sortOrder)] },
      variants: true // THIS IS THE FIX
    }
  });

  if (!product) {
    return <div className="p-12 text-center text-zinc-500">Product not found.</div>;
  }

  return <EditProductForm storeSlug={storeSlug} product={product} />;
}