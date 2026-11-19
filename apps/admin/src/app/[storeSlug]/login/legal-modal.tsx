"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  CheckCircle2, 
  ExternalLink,
  X 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export type LegalDocType = "terms" | "privacy" | "security";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
  storeName: string;
}

export function LegalModal({
  isOpen,
  onClose,
  initialDoc = "terms",
  storeName,
}: LegalModalProps) {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  React.useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-zinc-100 bg-zinc-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full">
                Vanij Legal & Compliance
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs font-medium text-zinc-500">Ninthwave Technologies</span>
            </div>
          </div>

          <DialogHeader className="mt-3 text-left">
            <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900">
              {activeDoc === "terms" && "Merchant Terms of Service"}
              {activeDoc === "privacy" && "Platform Privacy & Data Policy"}
              {activeDoc === "security" && "Security & Infrastructure Statement"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500 mt-1">
              Applicable to <strong>{storeName}</strong> and all administrative accounts hosted on the Vanij Commerce Cloud.
            </DialogDescription>
          </DialogHeader>

          {/* Tab Selector */}
          <div className="flex gap-1 mt-4 p-1 bg-zinc-200/60 rounded-xl">
            <button
              onClick={() => setActiveDoc("terms")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDoc === "terms"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Terms of Service
            </button>
            <button
              onClick={() => setActiveDoc("privacy")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDoc === "privacy"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Privacy Policy
            </button>
            <button
              onClick={() => setActiveDoc("security")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeDoc === "security"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Security & SLA
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto max-h-[58vh] text-sm text-zinc-600 leading-relaxed space-y-5">
          {/* TERMS OF SERVICE */}
          {activeDoc === "terms" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl text-xs text-zinc-600 leading-relaxed">
                <strong>Notice:</strong> These Merchant Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between Ninthwave Technologies (&ldquo;Ninthwave&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) and the business entity or individual operating <strong>{storeName}</strong> (&ldquo;Merchant&rdquo;, &ldquo;you&rdquo;).
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">1. Acceptance & Scope of Service</h4>
                <p>
                  Vanij is an enterprise e-commerce infrastructure platform providing storefront hosting, order workflow management, real-time analytics, inventory catalogs, AI merchant assistants, and integrated payment processing services. By authenticating into this administrative portal, you represent that you have authority to bind the Merchant and agree to abide by these Terms.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">2. Account Responsibility & Access Control</h4>
                <p>
                  You are solely responsible for maintaining the confidentiality of your administrative credentials, one-time passwords (OTP), and API keys. Any action taken through authenticated sessions linked to your store shall be deemed authorized by the Merchant. You agree to notify Ninthwave immediately of any suspected unauthorized access.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">3. Merchant Product Content & Compliance</h4>
                <p>
                  The Merchant retains full intellectual property ownership of all uploaded product catalogs, titles, imagery, and literature specifications. The Merchant warrants that all listed items, descriptions, and pricing comply with applicable consumer protection regulations, copyright laws, and trade requirements. Vanij prohibits the sale of counterfeit items, unauthorized copyrighted materials, or illegal goods.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">4. Payment Processing & Gateway Credentials</h4>
                <p>
                  Vanij provides native integration with licensed payment processors (including Razorpay). Merchant payment gateway secrets and webhook credentials stored in the platform are encrypted at rest using AES-256 standard encryption. Merchants are responsible for maintaining good standing with their respective payment gateway providers.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">5. Service Availability & Uptime (SLA)</h4>
                <p>
                  Ninthwave targets a 99.9% monthly operational uptime for storefront endpoints and administrative portals, excluding planned maintenance windows communicated in advance. Automated failover and CDN edge caching are employed to ensure uninterrupted customer checkout.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">6. Termination & Data Portability</h4>
                <p>
                  Either party may terminate subscription services in accordance with their service agreement. Upon termination, Merchants are entitled to export their product catalogs, customer inquiry logs, and order histories in standard formats (JSON/CSV) prior to account closure.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">7. Governing Law</h4>
                <p>
                  These Terms are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Kolkata, West Bengal, India.
                </p>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {activeDoc === "privacy" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                <strong>Data Privacy Commitment:</strong> Ninthwave Technologies respects your privacy and adheres to international data protection principles as well as India&apos;s Digital Personal Data Protection (DPDP) Act.
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">1. Information We Collect</h4>
                <ul className="list-disc pl-5 space-y-1 mt-1 text-xs sm:text-sm">
                  <li><strong>Merchant Information:</strong> Administrator name, registered email address, store contact phone number, and physical business location.</li>
                  <li><strong>Storefront Customer Data:</strong> Customer shipping addresses, contact numbers, email addresses, and ordered item records submitted during checkout.</li>
                  <li><strong>Telemetry & Security Logs:</strong> IP addresses, login timestamps, and device headers used strictly for brute-force prevention and session verification.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">2. Purpose of Processing</h4>
                <p>
                  We process data exclusively to: (a) operate and deliver your e-commerce storefront; (b) route automated email alerts (orders, customer leads, reviews, and security OTPs); (c) facilitate secure online transactions through encrypted gateway handoffs; and (d) power the Vanij AI merchant assistant for in-store catalog operations.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">3. Non-Sale of Data</h4>
                <p>
                  Ninthwave does <strong>never</strong> sell, rent, or trade Merchant data or your customer lists to third-party advertisers or data brokers.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">4. Sub-processors & Infrastructure Partners</h4>
                <p>
                  We partner only with verified, enterprise-grade cloud providers:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1 text-xs sm:text-sm">
                  <li><strong>Resend Technologies:</strong> For transactional email delivery under verified DKIM/SPF standards.</li>
                  <li><strong>UploadThing / AWS S3:</strong> For secure book and product image asset hosting.</li>
                  <li><strong>Razorpay:</strong> For PCI-DSS compliant direct payment checkout.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1">5. Data Retention & Right to Erasure</h4>
                <p>
                  Store records and order archives are preserved for the active duration of your merchant subscription. Merchants may request complete account data deletion or automated archive export by writing to <code>privacy@ninthwave.in</code>.
                </p>
              </div>
            </div>
          )}

          {/* SECURITY & SLA */}
          {activeDoc === "security" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <strong>Enterprise Security Architecture:</strong> Every tenant instance on Vanij is engineered with layered defense, cryptographic isolation, and zero-trust credential handling.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> AES-256 Encryption
                  </div>
                  <p className="text-xs text-zinc-500">
                    Payment gateway private secrets and webhook tokens are encrypted at rest with military-grade AES-256-GCM.
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> SHA-256 One-Time Codes
                  </div>
                  <p className="text-xs text-zinc-500">
                    Password recovery codes are hashed before persistence with 10-minute automated expiry TTL.
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Tenant Isolation
                  </div>
                  <p className="text-xs text-zinc-500">
                    Strict logical database tenancy prevents cross-store catalog and customer data exposure.
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                  <div className="flex items-center gap-2 font-bold text-zinc-900 text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> SSL / TLS 1.3
                  </div>
                  <p className="text-xs text-zinc-500">
                    All communications between browsers, storefronts, and API servers are encrypted with modern TLS 1.3.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-zinc-900 text-sm mb-1 mt-4">Security Incident Disclosure</h4>
                <p>
                  In the unlikely event of a security event affecting Merchant infrastructure, Ninthwave enforces a mandatory 24-hour notification protocol to affected tenant administrators with actionable audit trails.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>Vanij Commerce Cloud v2.4</span>
            <span>•</span>
            <a 
              href="https://ninthwave.in" 
              target="_blank" 
              rel="noreferrer"
              className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
            >
              ninthwave.in <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            I Understand & Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
