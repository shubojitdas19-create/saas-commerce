import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Security & Infrastructure | Vanij Commerce Cloud",
  description: "Platform Security & Encryption Standards for Vanij by Ninthwave Technologies.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Platform
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Security Architecture
          </span>
        </div>

        <div className="mt-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security & Infrastructure Standards</h1>
          <p className="text-xs text-slate-500 mt-1">Vanij Commerce Cloud • Ninthwave Technologies</p>
        </div>

        <div className="mt-8 space-y-6 text-sm text-slate-600 leading-relaxed">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AES-256 GCM
              </div>
              <p className="text-xs text-slate-500">
                Tenant payment secrets and webhook credentials are encrypted at rest with AES-256 standard encryption.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-Tenant Isolation
              </div>
              <p className="text-xs text-slate-500">
                Logical row-level isolation guarantees that zero cross-tenant catalog or order data leakage occurs.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> SHA-256 One-Time Codes
              </div>
              <p className="text-xs text-slate-500">
                Password recovery codes are cryptographically hashed before database persistence with 10-minute expiry.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> TLS 1.3 Strict HTTPS
              </div>
              <p className="text-xs text-slate-500">
                All traffic between customer browsers, storefronts, and API servers is encrypted with TLS 1.3.
              </p>
            </div>
          </div>

          <section className="mt-6">
            <h2 className="font-bold text-slate-900 text-base mb-2">Vulnerability Reporting</h2>
            <p>
              We welcome security researchers and merchants to report potential vulnerabilities. Please submit disclosures directly to our security engineering team at <code>security@ninthwave.in</code>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} Ninthwave Technologies</span>
          <span>Vanij Commerce Cloud</span>
        </div>
      </div>
    </div>
  );
}
