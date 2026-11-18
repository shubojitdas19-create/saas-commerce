import Link from "next/link";
import { Paintbrush, LayoutTemplate, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function StorefrontComingSoonPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;

  return (
    <div className="flex flex-col min-h-[75vh] items-center justify-center px-4 text-center">
      {/* Icon Container with subtle pulse animation */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-50 duration-3000"></div>
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white"></div>
          <Paintbrush className="h-8 w-8 text-blue-600 relative z-20" />
          <LayoutTemplate className="h-4 w-4 text-blue-400 absolute bottom-4 right-4 z-20" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 mb-3">
        Storefront Customization
      </h1>
      
      <p className="max-w-md text-zinc-500 text-sm sm:text-base leading-relaxed mb-8">
        Your digital storefront is getting an upgrade. Soon, you will be able to customize your website theme, arrange homepage banners, and manage navigation menus right from this dashboard.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-zinc-500 border border-zinc-200">
          In Active Development
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