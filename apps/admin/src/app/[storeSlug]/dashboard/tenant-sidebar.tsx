"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Paintbrush,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "./actions";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

type NavCategory = {
  title: string;
  items: NavItem[];
};

const NAV_CATEGORIES: NavCategory[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    ],
  },
  {
    title: "Catalog",
    items: [
      { name: "Products", href: "/dashboard/products", icon: ShoppingBag },
      { name: "Categories", href: "/dashboard/categories", icon: Tags },
      { name: "Discounts", href: "/dashboard/discounts", icon: BadgePercent },
    ],
  },
  {
    title: "Audience",
    items: [
      { name: "Customers", href: "/dashboard/customers", icon: Users },
      { name: "Leads", href: "/dashboard/leads", icon: MessageSquare },
      { name: "Reviews", href: "/dashboard/reviews", icon: Star },
    ],
  },
  {
    title: "Storefront",
    items: [
      { name: "Design UI", href: "/dashboard/storefront", icon: Paintbrush },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { name: "Products", href: "/dashboard/products", icon: ShoppingBag },
];

// Secondary routes shown in the compact mobile 2-column sheet (no duplicates with bottom bar)
const MOBILE_MORE_ITEMS: NavItem[] = [
  { name: "Categories", href: "/dashboard/categories", icon: Tags },
  { name: "Discounts", href: "/dashboard/discounts", icon: BadgePercent },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Leads", href: "/dashboard/leads", icon: MessageSquare },
  { name: "Reviews", href: "/dashboard/reviews", icon: Star },
  { name: "Design UI", href: "/dashboard/storefront", icon: Paintbrush },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function isRouteActive(pathname: string, storeSlug: string, href: string) {
  const fullHref = `/${storeSlug}${href}`;
  if (href === "/dashboard") {
    return pathname === fullHref;
  }
  return pathname === fullHref || pathname.startsWith(`${fullHref}/`);
}

function StoreAvatar({
  logoUrl,
  storeName,
  sizeClass = "size-9",
}: {
  logoUrl?: string | null;
  storeName: string;
  sizeClass?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(logoUrl) && !hasError;

  return (
    <div
      className={`${sizeClass} relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]`}
    >
      {showImage ? (
        <img
          src={logoUrl!}
          alt={`${storeName} logo`}
          onError={() => setHasError(true)}
          className="size-full object-contain p-1"
        />
      ) : (
        <Store className="size-4 text-[#2518e6]" aria-hidden="true" />
      )}
    </div>
  );
}

function VanijMark({ sizeClass = "size-8" }: { sizeClass?: string }) {
  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_2px_8px_-2px_rgba(37,24,230,0.2)]`}
    >
      <img
        src="/logo/vanij-icon.png"
        alt="Vanij"
        className="size-[74%] object-contain"
      />
    </span>
  );
}

function DesktopNavList({
  pathname,
  storeSlug,
}: {
  pathname: string;
  storeSlug: string;
}) {
  return (
    <nav aria-label="Store navigation" className="flex flex-col gap-3.5">
      {NAV_CATEGORIES.map((category) => (
        <div key={category.title} className="flex flex-col gap-0.5">
          <span className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {category.title}
          </span>

          {category.items.map((item) => {
            const fullHref = `/${storeSlug}${item.href}`;
            const isActive = isRouteActive(pathname, storeSlug, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={fullHref}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-all duration-150 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2518e6]/30 ${
                  isActive
                    ? "bg-[#2518e6]/[0.08] font-semibold text-[#1e12c8]"
                    : "text-zinc-600 hover:bg-zinc-100/90 hover:text-zinc-950"
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-[#2518e6]"
                  />
                )}
                <Icon
                  className={`size-[16px] shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                    isActive
                      ? "text-[#2518e6]"
                      : "text-zinc-400 group-hover:text-zinc-700"
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function TenantSidebar({
  storeSlug,
  storeName,
  logoUrl,
  customDomain,
  storeWebsiteUrl,
}: {
  storeSlug: string;
  storeName: string;
  logoUrl?: string | null;
  customDomain?: string | null;
  storeWebsiteUrl?: string | null;
}) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const liveStoreUrl =
    storeWebsiteUrl ||
    (customDomain
      ? customDomain.startsWith("http")
        ? customDomain
        : `https://${customDomain}`
      : `/${storeSlug}`);

  const isMoreActive =
    isMobileOpen ||
    MOBILE_MORE_ITEMS.some((item) =>
      isRouteActive(pathname, storeSlug, item.href)
    );

  // Close sheet automatically on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lock background scroll & close on Escape when mobile sheet is open
  useEffect(() => {
    if (!isMobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction(storeSlug);
    });
  };

  return (
    <>
      <style>{`
        @keyframes vanij-sheet-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vanij-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .v-sheet-up {
          animation: vanij-sheet-up 0.24s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .v-fade {
          animation: vanij-fade 0.18s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .v-sheet-up, .v-fade {
            animation: none !important;
          }
        }
      `}</style>

      {/* MOBILE: Crisp Top App Bar (h-16 preserved) */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/92 px-4 backdrop-blur-xl lg:hidden">
        <Link
          href={`/${storeSlug}/dashboard`}
          className="flex min-w-0 items-center gap-2.5 outline-none"
        >
          <VanijMark sizeClass="size-8" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold leading-tight tracking-tight text-zinc-950">
              {storeName}
            </p>
            <p className="truncate text-[10.5px] font-medium text-zinc-400">
              Vanij · /{storeSlug}
            </p>
          </div>
        </Link>

        <a
          href={liveStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 active:scale-95"
          title={`Visit live website (${customDomain || storeSlug})`}
          aria-label={`Visit live website (${customDomain || storeSlug})`}
        >
          <span>Store</span>
          <ExternalLink className="size-3.5 text-zinc-500" aria-hidden="true" />
        </a>
      </header>

      {/* MOBILE: Compact Zero-Scroll "More" Sheet (Docked cleanly above bottom nav) */}
      {isMobileOpen && (
        <div
          id="vanij-mobile-more-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="More store tools"
          className="fixed inset-x-0 bottom-[68px] top-0 z-40 flex flex-col justify-end lg:hidden"
        >
          {/* Scrim */}
          <div
            className="v-fade fixed inset-0 bottom-[68px] bg-zinc-950/40 backdrop-blur-[2px]"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Compact Rounded Bottom Sheet */}
          <div className="v-sheet-up relative z-10 rounded-t-[24px] border-t border-zinc-200/70 bg-white px-4 pb-4 pt-2.5 shadow-[0_-16px_40px_-14px_rgba(15,10,60,0.25)]">
            {/* Handle */}
            <div className="mb-2.5 flex justify-center">
              <span className="h-1 w-9 rounded-full bg-zinc-200" />
            </div>

            {/* Compact Workspace Header */}
            <div className="mb-3.5 flex items-center justify-between gap-2.5 border-b border-zinc-100 pb-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <StoreAvatar
                  logoUrl={logoUrl}
                  storeName={storeName}
                  sizeClass="size-9"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold leading-tight text-zinc-950">
                    {storeName}
                  </p>
                  <p className="truncate font-mono text-[11px] text-zinc-400">
                    /{storeSlug}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="flex size-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Symmetrical 2-Column Grid (7 secondary routes + Live Store = 8 tiles, zero scroll) */}
            <nav
              aria-label="Additional store pages"
              className="grid grid-cols-2 gap-2"
            >
              {MOBILE_MORE_ITEMS.map((item) => {
                const fullHref = `/${storeSlug}${item.href}`;
                const isActive = isRouteActive(pathname, storeSlug, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={fullHref}
                    onClick={() => setIsMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-all active:scale-[0.98] ${
                      isActive
                        ? "border-[#2518e6]/25 bg-[#2518e6]/[0.07] font-semibold text-[#1e12c8]"
                        : "border-zinc-200/75 bg-zinc-50/70 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/70 hover:text-zinc-950"
                    }`}
                  >
                    <Icon
                      className={`size-4 shrink-0 ${
                        isActive ? "text-[#2518e6]" : "text-zinc-500"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}

              {/* 8th symmetrical tile: Open Live Storefront */}
              <a
                href={liveStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2.5 rounded-xl border border-zinc-200/75 bg-zinc-50/70 px-3 py-2.5 text-[13px] font-medium text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-100/70 hover:text-zinc-950 active:scale-[0.98]"
                title={`Visit live website (${customDomain || storeSlug})`}
              >
                <ExternalLink
                  className="size-4 shrink-0 text-zinc-500"
                  aria-hidden="true"
                />
                <span className="truncate">View Store</span>
              </a>
            </nav>

            {/* Slim Sign-Out Footer */}
            <div className="mt-3.5 border-t border-zinc-100 pt-2.5">
              <Button
                variant="ghost"
                onClick={handleLogout}
                disabled={isPending}
                className="h-10 w-full justify-center gap-2 rounded-xl text-[13px] font-medium text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-[0.985]"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogOut className="size-4" aria-hidden="true" />
                )}
                <span>{isPending ? "Signing out…" : "Sign out"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE: Persistent Bottom Navigation Bar (h-[68px], stays live above sheet scrim) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-around border-t border-zinc-200/80 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        {BOTTOM_NAV_ITEMS.map((item) => {
          const fullHref = `/${storeSlug}${item.href}`;
          const isActive =
            !isMobileOpen && isRouteActive(pathname, storeSlug, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={fullHref}
              onClick={() => setIsMobileOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className="group flex flex-1 flex-col items-center justify-center gap-1 outline-none active:scale-95"
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-[#2518e6]/12 text-[#2518e6]"
                    : "text-zinc-500 group-hover:text-zinc-900"
                }`}
              >
                <Icon className="size-[19px]" aria-hidden="true" />
              </span>
              <span
                className={`text-[10.5px] leading-none tracking-tight ${
                  isActive
                    ? "font-semibold text-[#2518e6]"
                    : "font-medium text-zinc-500"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setIsMobileOpen((open) => !open)}
          aria-expanded={isMobileOpen}
          aria-controls="vanij-mobile-more-sheet"
          className="group flex flex-1 flex-col items-center justify-center gap-1 outline-none active:scale-95"
        >
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
              isMoreActive
                ? "bg-[#2518e6]/12 text-[#2518e6]"
                : "text-zinc-500 group-hover:text-zinc-900"
            }`}
          >
            {isMobileOpen ? (
              <X className="size-[19px]" aria-hidden="true" />
            ) : (
              <Menu className="size-[19px]" aria-hidden="true" />
            )}
          </span>
          <span
            className={`text-[10.5px] leading-none tracking-tight ${
              isMoreActive
                ? "font-semibold text-[#2518e6]"
                : "font-medium text-zinc-500"
            }`}
          >
            More
          </span>
        </button>
      </nav>

      {/* DESKTOP: Crisp Left Sidebar (w-[260px] preserved, zero clutter) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-zinc-200/80 bg-[#fafafa] lg:flex">
        {/* Dominant Vanij Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white px-4 py-3.5">
          <Link
            href={`/${storeSlug}/dashboard`}
            className="group inline-flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2518e6]/30"
          >
            <VanijMark sizeClass="size-8 transition-transform duration-200 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="text-[16px] font-bold leading-none tracking-[-0.03em] text-zinc-950">
                Vanij
              </span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Commerce
              </span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        {/* Compact Store Workspace Card */}
        <div className="px-3.5 pb-1 pt-3">
          <div className="group/card flex items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-zinc-300">
            <StoreAvatar
              logoUrl={logoUrl}
              storeName={storeName}
              sizeClass="size-8"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-zinc-900">
                {storeName}
              </p>
              <p className="mt-0.5 truncate font-mono text-[10.5px] text-zinc-400 group-hover/card:text-[#2518e6] transition-colors">
                {customDomain ? customDomain : `/${storeSlug}`}
              </p>
            </div>
            <a
              href={liveStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Visit live storefront (${customDomain || storeSlug})`}
              aria-label={`Visit live storefront (${customDomain || storeSlug})`}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-zinc-100 hover:text-[#2518e6] active:scale-95"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3.5 py-2.5">
          <DesktopNavList pathname={pathname} storeSlug={storeSlug} />
        </div>

        {/* Clean Single-Action Footer */}
        <div className="mt-auto border-t border-zinc-200/70 bg-white px-3.5 py-2.5">
          <Button
            variant="ghost"
            onClick={handleLogout}
            disabled={isPending}
            className="group h-9 w-full justify-start gap-2.5 rounded-xl px-3 text-[13px] font-medium text-zinc-500 transition-all hover:bg-red-50 hover:text-red-600 active:scale-[0.985]"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut
                className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
            )}
            <span>{isPending ? "Signing out…" : "Sign out"}</span>
          </Button>
        </div>
      </aside>
    </>
  );
}