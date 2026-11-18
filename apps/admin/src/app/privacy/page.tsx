import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Vanij Commerce Cloud",
  description: "Platform Privacy & Data Governance Policy for Vanij by Ninthwave Technologies.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-sm">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Platform
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            DPDP & GDPR Compliant
          </span>
        </div>

        <div className="mt-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Privacy & Data Governance Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Last updated: November 2026 • Ninthwave Technologies</p>
        </div>

        <div className="mt-8 space-y-6 text-sm text-slate-600 leading-relaxed">
          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">1. Data Controller & Processor Roles</h2>
            <p>
              Under applicable data protection frameworks (including India&apos;s DPDP Act 2023), each merchant acts as the Data Controller for their end-customer data. Ninthwave Technologies operates strictly as a Data Processor providing infrastructure, security, and hosting.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">2. Information Collected</h2>
            <p>
              We collect minimal administrative data required to service your account: administrator names, registered emails, store contact details, and session authentication telemetry for audit and brute-force prevention.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">3. Zero-Sale Commitment</h2>
            <p>
              Ninthwave Technologies <strong>never</strong> sells, monetizes, or shares merchant customer records, order archives, or catalog data with third-party advertisers or data brokers.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">4. Sub-processor Infrastructure</h2>
            <p>
              We utilize vetted enterprise infrastructure partners: Resend Technologies for verified DKIM transactional email delivery, UploadThing / AWS S3 for media assets, and Razorpay for direct PCI-compliant payment checkout.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">5. Cryptographic Storage & Encryption</h2>
            <p>
              All data in transit is encrypted using TLS 1.3. Merchant payment credentials and sensitive configuration secrets are stored using AES-256 standard encryption at rest.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-slate-900 text-base mb-2">6. Contact & Data Rights</h2>
            <p>
              To exercise data subject rights or request data export or erasure, contact our data protection team at <code>privacy@ninthwave.in</code>.
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
