import Link from "next/link";
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Settings, 
  ShieldCheck,
  Search,
  Bell
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Client Stores", href: "/stores", icon: Building2 },
  { name: "Tenant Admins", href: "/tenants", icon: Users },
  { name: "Platform Billing", href: "/billing", icon: CreditCard },
  { name: "System Settings", href: "/settings", icon: Settings },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-100/60">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-zinc-200/80 bg-white flex flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-200/80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-zinc-900 leading-none">
                SJ Digital Studio
              </p>
              <span className="text-[11px] font-medium text-emerald-600 tracking-wide uppercase">
                Super Admin
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                >
                  <Icon className="h-4 w-4 text-zinc-500" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Account Status */}
        <div className="p-4 border-t border-zinc-200/80">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors">
            <div className="h-8 w-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold">
              SJ
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-zinc-900 leading-tight">Master Control</p>
              <p className="text-[11px] text-zinc-500 font-mono">admin@sjstudio.internal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Screen Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-200/80 bg-white px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <span>Platform Core</span>
            <span>/</span>
            <span className="text-zinc-900 font-semibold">Super Admin Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              BigRock Cluster Active
            </span>
          </div>
        </header>

        {/* Full-width container with professional edge padding */}
        <main className="flex-1 p-8 w-full overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}