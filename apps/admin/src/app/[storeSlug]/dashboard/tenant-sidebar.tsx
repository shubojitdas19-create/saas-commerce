"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, ShoppingBag, Tags, ShoppingCart, 
  Users, Paintbrush, BadgePercent, Settings, 
  LogOut, Menu, X, Store, MessageSquare, Loader2, Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "./actions";

// 1. Grouped navigation for a more professional "enterprise" look
const navCategories = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    ]
  },
  {
    title: "Catalog",
    items: [
      { name: "Products", href: "/dashboard/products", icon: ShoppingBag },
      { name: "Categories", href: "/dashboard/categories", icon: Tags },
      { name: "Discounts", href: "/dashboard/discounts", icon: BadgePercent },
    ]
  },
  {
    title: "Audience",
    items: [
      { name: "Customers", href: "/dashboard/customers", icon: Users },
      { name: "Leads", href: "/dashboard/leads", icon: MessageSquare },
      { name: "Reviews", href: "/dashboard/reviews", icon: Star },
    ]
  },
  {
    title: "Storefront",
    items: [
      { name: "Design UI", href: "/dashboard/storefront", icon: Paintbrush },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ]
  }
];

// Top 3 items extracted for the Mobile Bottom Nav
const bottomNavItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Products", href: "/dashboard/products", icon: ShoppingBag },
];

export function TenantSidebar({ 
  storeSlug, 
  storeName, 
  logoUrl 
}: { 
  storeSlug: string; 
  storeName: string; 
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction(storeSlug);
    });
  };

  // Upgraded Logo component with a subtle inner ring for depth
  const BrandLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
    <div className={`${className} bg-zinc-900 ring-1 ring-white/10 rounded-lg flex items-center justify-center shadow-md overflow-hidden shrink-0`}>
      {logoUrl ? (
        <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <Store className="h-1/2 w-1/2 text-white shadow-sm" />
        </div>
      )}
    </div>
  );

  // Upgraded Links with glowing indicators and icon scaling
  const NavLinks = () => (
    <div className="flex flex-col space-y-5 mt-6">
      {navCategories.map((category) => (
        <div key={category.title} className="flex flex-col space-y-1">
          <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            {category.title}
          </span>
          {category.items.map((item) => {
            const fullHref = `/${storeSlug}${item.href}`;
            const isActive = pathname === fullHref;
            
            return (
              <Link key={item.name} href={fullHref} onClick={() => setIsMobileOpen(false)} className="block outline-none group">
                <div className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
                  isActive 
                    ? "bg-zinc-800/50 text-white shadow-sm ring-1 ring-white/10" 
                    : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-100"
                }`}>
                  {/* Glowing left accent bar for active state */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                  )}
                  <item.icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* MOBILE: Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center px-4 z-30 border-b border-zinc-900 shadow-sm">
        <div className="flex items-center gap-2.5 text-white">
          <BrandLogo className="h-7 w-7" />
          <span className="font-semibold text-sm tracking-tight line-clamp-1">{storeName}</span>
        </div>
      </div>

      {/* MOBILE: Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 z-40 flex items-center justify-around px-2 pb-safe">
        {bottomNavItems.map((item) => {
          const fullHref = `/${storeSlug}${item.href}`;
          const isActive = pathname === fullHref;
          
          return (
            <Link key={item.name} href={fullHref} className="flex-1 outline-none group">
              <div className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${
                isActive ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
              }`}>
                <item.icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
              </div>
            </Link>
          );
        })}
        
        <button 
          onClick={() => setIsMobileOpen(true)} 
          className="flex-1 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 outline-none group"
        >
          <Menu className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-[10px] font-medium tracking-wide">More</span>
        </button>
      </div>

      {/* MOBILE: Slide-out "More" Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileOpen(false)} />
          
          <div className="relative w-[280px] mr-auto bg-zinc-950 h-full border-r border-zinc-800 p-4 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between text-white mb-4 pl-2">
              <span className="font-bold text-lg tracking-tight">Menu</span>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setIsMobileOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
              <NavLinks />
            </div>
            
            <div className="pt-4 border-t border-zinc-800 mt-auto">
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                disabled={isPending}
                className="w-full justify-start gap-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-[0.98]"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} 
                {isPending ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP: Persistent Left Sidebar */}
      <div className="hidden lg:flex flex-col w-[260px] fixed inset-y-0 bg-zinc-950 border-r border-zinc-800/50 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="p-5 flex-1 flex flex-col">
          {/* Store Branding Header */}
          <div className="flex items-center gap-3.5 text-white mb-4 p-2 rounded-xl bg-white/5 border border-white/5 shadow-sm">
            <BrandLogo className="h-10 w-10" />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight leading-tight truncate">{storeName}</span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-bold mt-0.5">Admin Portal</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar pr-2 -mr-2">
            <NavLinks />
          </div>

          <div className="pt-4 border-t border-zinc-800/50 mt-4">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              disabled={isPending}
              className="w-full justify-start gap-3 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 active:scale-[0.98] group"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              )} 
              {isPending ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}