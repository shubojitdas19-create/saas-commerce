import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Vanij Commerce Cloud",
  description: "Merchant Terms of Service for Vanij by Ninthwave Technologies.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Platform
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Vanij Legal
          </span>
        </div>

        <div className="mt-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Merchant Terms of Service</h1>
          <p className="text-xs text-slate-500 mt-1">Last updated: November 2026 • Ninthwave Technologies</p>
        </div>

        <div className="mt-8 space-y-6 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">1. Acceptance & Scope of Service</h2>
            <p>
              Vanij is an enterprise e-commerce platform developed and operated by Ninthwave Technologies (&ldquo;Ninthwave&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating or accessing a merchant administrator account, you agree to comply with and be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">2. Account Responsibility & Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your administrative credentials and one-time password (OTP) verification codes. Any transactions or catalog alterations performed under your account are your sole responsibility.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">3. Product Catalog & Data Ownership</h2>
            <p>
              Merchants retain 100% intellectual property ownership of their product listings, titles, descriptions, imagery, and literature specifications. You warrant that all listed items comply with applicable laws and intellectual property rights.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">4. Payment Gateway Integration</h2>
            <p>
              Vanij provides native encrypted integration with payment gateways including Razorpay. Your private gateway secrets and webhook credentials are encrypted at rest with AES-256 standard encryption.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">5. Service Level Agreement (SLA)</h2>
            <p>
              Ninthwave targets 99.9% operational uptime for customer-facing storefronts and administrative portals, backed by edge caching and redundant database infrastructure.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">6. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Republic of India, with jurisdiction in Kolkata, West Bengal.
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
