import Link from "next/link";
import { BadgePercent, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DiscountsComingSoonPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;

  return (
    <div className="flex flex-col min-h-[75vh] items-center justify-center px-4 text-center">
      {/* Icon Container with subtle pulse animation */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-50 duration-3000"></div>
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-white"></div>
          <BadgePercent className="h-8 w-8 text-emerald-600 relative z-20" />
          <Sparkles className="h-4 w-4 text-amber-400 absolute top-4 right-4 z-20" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 mb-3">
        Promotions Engine
      </h1>
      
      <p className="max-w-md text-zinc-500 text-sm sm:text-base leading-relaxed mb-8">
        We are crafting a powerful discount engine for your store. Soon, you'll be able to generate coupon codes, flash sales, and automated cart discounts to boost your revenue.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-zinc-500 border border-zinc-200">
          Rolling out in V2
        </span>
        <Button variant="ghost" asChild className="text-zinc-500 hover:text-zinc-900">
          <Link href={`/${storeSlug}/dashboard`}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Overview
          </Link>
        </Button>
      </div>
    </div>
  );
}