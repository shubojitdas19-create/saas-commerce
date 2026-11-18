"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Mail, 
  Send, 
  Eye, 
  Pencil, 
  Sparkles, 
  Key, 
  Globe, 
  ShieldCheck, 
  Loader2, 
  RefreshCw,
  Info,
  Server,
  Paperclip,
  Trash2,
  ExternalLink,
  FileText,
  CheckCircle2,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  generateStoreLaunchHandoverHtml, 
  type StoreLaunchHandoverEmailOptions,
  type DomainOwnershipType,
  type HostingSetupType,
  type HandoverAttachment
} from "@/lib/email-templates/launch-handover";
import { UploadDropzone } from "@/lib/uploadthing";
import { sendLaunchHandoverEmailAction } from "./actions";

export interface TenantStoreRecord {
  id: string;
  name: string;
  slug: string;
  currency: string;
  apiKey?: string;
  isQuoteBased?: boolean;
  status: string | null;
  plan: string | null;
  customDomain?: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: Date | string;
}

interface LaunchEmailModalProps {
  store: TenantStoreRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function generateSecureTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pwd = "Vanij@";
  for (let i = 0; i < 4; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pwd += "!2026";
  return pwd;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function LaunchEmailModal({
  store,
  isOpen,
  onClose,
  onSuccess,
}: LaunchEmailModalProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSending, setIsSending] = useState(false);

  // Form State
  const [clientName, setClientName] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [storeName, setStoreName] = useState("");
  const [liveStoreUrl, setLiveStoreUrl] = useState("");
  const [adminPortalUrl, setAdminPortalUrl] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  
  // Dynamic Domain & Hosting States
  const [domainOwnership, setDomainOwnership] = useState<DomainOwnershipType>("complimentary");
  const [hostingSetup, setHostingSetup] = useState<HostingSetupType>("vanij_managed");
  const [registeredDomain, setRegisteredDomain] = useState("");
  const [planName, setPlanName] = useState("Domain + Managed Cloud Hosting (Complimentary — Year 1)");
  const [activationDate, setActivationDate] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  
  // Attachments State
  const [attachments, setAttachments] = useState<HandoverAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Custom Note
  const [customNote, setCustomNote] = useState("");

  // Populate data when store changes
  useEffect(() => {
    if (store && isOpen) {
      const now = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(now.getFullYear() + 1);

      const hasCustomDomain = Boolean(store.customDomain && store.customDomain.trim() !== "");
      const resolvedDomain = store.customDomain || (store.slug ? `${store.slug}.vanij.app` : "yourdomain.com");
      const resolvedStoreUrl = hasCustomDomain
        ? (store.customDomain!.startsWith("http") ? store.customDomain! : `https://${store.customDomain!}`)
        : `https://${store.slug}.vanij.app`;

      setClientName(store.ownerName || "Valued Merchant");
      setToEmail(store.ownerEmail || "");
      setStoreName(store.name || "");
      setLiveStoreUrl(resolvedStoreUrl);
      setAdminPortalUrl(`https://vanij.ninthwave.in/${store.slug}/login`);
      setLoginEmail(store.ownerEmail || "");
      setTemporaryPassword(generateSecureTempPassword());
      
      // Auto-detect ownership based on existing configuration
      setDomainOwnership(hasCustomDomain ? "client_owned" : "complimentary");
      setHostingSetup("vanij_managed");

      setRegisteredDomain(resolvedDomain);
      setPlanName("Domain + Managed Cloud Hosting (Complimentary — Year 1)");
      setActivationDate(formatDate(now));
      setRenewalDate(formatDate(nextYear));
      setAttachments([]);
      setCustomNote("");
      setActiveTab("edit");
    }
  }, [store, isOpen]);

  const handleGeneratePassword = () => {
    setTemporaryPassword(generateSecureTempPassword());
    toast.info("Generated new temporary password");
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    toast.info("Attachment removed");
  };

  // Compile options for preview & send
  const emailPayload: StoreLaunchHandoverEmailOptions = useMemo(() => {
    return {
      toEmail,
      clientName,
      storeName,
      storeSlug: store?.slug || "",
      liveStoreUrl,
      adminPortalUrl,
      loginEmail,
      temporaryPassword,
      domainOwnership,
      hostingSetup,
      registeredDomain,
      planName,
      activationDate,
      renewalDate,
      attachments,
      customNote: customNote.trim() ? customNote.trim() : undefined,
      supportEmail: "support@ninthwave.in",
    };
  }, [
    toEmail,
    clientName,
    storeName,
    store?.slug,
    liveStoreUrl,
    adminPortalUrl,
    loginEmail,
    temporaryPassword,
    domainOwnership,
    hostingSetup,
    registeredDomain,
    planName,
    activationDate,
    renewalDate,
    attachments,
    customNote,
  ]);

  const previewHtml = useMemo(() => {
    return generateStoreLaunchHandoverHtml(emailPayload);
  }, [emailPayload]);

  const handleSend = async () => {
    if (!toEmail || !toEmail.includes("@")) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }
    if (!storeName || !liveStoreUrl || !adminPortalUrl) {
      toast.error("Please ensure all store identity and portal URL fields are populated.");
      return;
    }

    setIsSending(true);
    try {
      const res = await sendLaunchHandoverEmailAction(emailPayload);
      if (res.success) {
        toast.success(`Official Launch Email successfully delivered to ${toEmail}!`, {
          description: `Store: ${storeName} • Password updated in database • Admin: ${loginEmail}`,
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to dispatch email via Resend.");
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSending && onClose()}>
      <DialogContent className="sm:max-w-[880px] p-0 bg-white border-zinc-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-zinc-950 text-white shrink-0 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-6 px-2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold flex items-center gap-1 border border-emerald-500/30">
                <Sparkles className="h-3 w-3" /> OFFICIAL HANDOVER
              </span>
              <span className="text-xs text-zinc-400">Vanij Commerce Cloud · Ninthwave</span>
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-white mt-1">
              Send Launch Handover Email — {store?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Deliver official admin credentials, dynamic domain details, cloud hosting validity, and attached certificates.
            </DialogDescription>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "edit"
                  ? "bg-white text-zinc-950 shadow-xs font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              Configure
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "preview"
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Live Preview
            </button>
          </div>
        </DialogHeader>

        {/* Tab 1: Edit Form */}
        {activeTab === "edit" && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            
            {/* 1. Recipient & Core Identity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-indigo-600" /> 1. Recipient &amp; Client Identity
                </h4>
                <span className="text-[11px] text-zinc-400">Pre-populated from store record</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-700 font-semibold">Client / Owner Name</Label>
                  <Input
                    value={clientName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientName(e.target.value)}
                    placeholder="e.g. Shubojit Das"
                    className="text-sm bg-zinc-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-700 font-semibold">Recipient Email (Delivery Address)</Label>
                  <Input
                    type="email"
                    value={toEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setToEmail(e.target.value);
                      setLoginEmail(e.target.value);
                    }}
                    placeholder="client@business.com"
                    className="text-sm bg-zinc-50/50 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-700 font-semibold">Store Brand Name</Label>
                  <Input
                    value={storeName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreName(e.target.value)}
                    placeholder="Rabines Stores"
                    className="text-sm bg-zinc-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-700 font-semibold">Live Storefront URL</Label>
                  <Input
                    value={liveStoreUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLiveStoreUrl(e.target.value)}
                    placeholder="https://rabines-stores.in"
                    className="text-sm bg-zinc-50/50 font-mono text-xs text-indigo-700 font-semibold"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-zinc-100" />

            {/* 2. Admin Credentials */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-indigo-600" /> 2. Admin Portal Credentials &amp; Automatic Database Sync
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-zinc-700 font-semibold">Admin Portal URL</Label>
                  <Input
                    value={adminPortalUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdminPortalUrl(e.target.value)}
                    className="text-xs font-mono bg-zinc-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-700 font-semibold">Login ID (Email)</Label>
                  <Input
                    value={loginEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
                    className="text-sm font-mono bg-zinc-50/50 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-700 font-semibold">Temporary Password</Label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Generate New
                    </button>
                  </div>
                  <Input
                    value={temporaryPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemporaryPassword(e.target.value)}
                    className="text-xs font-mono bg-red-50/40 border-red-200 text-red-900 font-bold"
                  />
                </div>
              </div>

              {/* Database Sync Callout */}
              <div className="rounded-xl bg-emerald-50/90 border border-emerald-200/80 p-3 text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-emerald-900">Automatic Database Password Sync Active:</strong>
                  <p className="mt-0.5 text-emerald-700">
                    When you click "Send Handover Email", this temporary password will immediately be hashed and updated into the MySQL database for this store's tenant administrator, guaranteeing the client can log in right away with zero credentials mismatch.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-zinc-100" />

            {/* 3. Dynamic Domain & Hosting Settings */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-indigo-600" /> 3. Domain Ownership &amp; Hosting Architecture (Dynamic)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Domain Ownership Selection */}
                <div className="space-y-2 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-indigo-600" /> Domain Ownership
                    </Label>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {domainOwnership === "complimentary" ? "Complimentary" : "Client-Owned"}
                    </span>
                  </div>
                  <select
                    value={domainOwnership}
                    onChange={(e) => setDomainOwnership(e.target.value as DomainOwnershipType)}
                    className="w-full text-xs font-medium rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-zinc-800 shadow-2xs focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value="complimentary">Complimentary 1-Year Domain (Provided by Vanij)</option>
                    <option value="client_owned">Client-Owned Custom Domain (Managed by Client &amp; DNS Pointed)</option>
                  </select>
                  <p className="text-[11px] text-zinc-500">
                    {domainOwnership === "complimentary"
                      ? "Email will highlight that 1-year free domain registration is included."
                      : "Email will state that the store is connected to their own domain and omit free domain claims."}
                  </p>
                </div>

                {/* Hosting Setup Selection */}
                <div className="space-y-2 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-emerald-600" /> Cloud Hosting Infrastructure
                    </Label>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {hostingSetup === "vanij_managed" ? "Vanij Cloud" : "Client-Managed"}
                    </span>
                  </div>
                  <select
                    value={hostingSetup}
                    onChange={(e) => setHostingSetup(e.target.value as HostingSetupType)}
                    className="w-full text-xs font-medium rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-zinc-800 shadow-2xs focus:border-indigo-600 focus:outline-hidden"
                  >
                    <option value="vanij_managed">Vanij Managed Cloud Hosting (Complimentary — Year 1)</option>
                    <option value="client_managed">Client-Managed Cloud / Server Infrastructure</option>
                  </select>
                  <p className="text-[11px] text-zinc-500">
                    {hostingSetup === "vanij_managed"
                      ? "Email will specify 1-Year Vanij managed hosting with automatic renewal reminder."
                      : "Email will specify that hosting is managed directly on the client's own cloud servers."}
                  </p>
                </div>

                {/* Domain & Plan text fields */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-700 font-semibold">Store Domain Name</Label>
                  <Input
                    value={registeredDomain}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegisteredDomain(e.target.value)}
                    placeholder="rabines-stores.in"
                    className="text-sm bg-zinc-50/50 font-semibold text-zinc-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-700 font-semibold">Plan Description in Email</Label>
                  <Input
                    value={planName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlanName(e.target.value)}
                    className="text-xs bg-zinc-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-700 font-semibold">Activation Date</Label>
                  <Input
                    value={activationDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActivationDate(e.target.value)}
                    className="text-xs bg-zinc-50/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-700 font-semibold">Renewal Date (+1 Year)</Label>
                  <Input
                    value={renewalDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenewalDate(e.target.value)}
                    className="text-xs bg-emerald-50/50 border-emerald-200 text-emerald-900 font-semibold"
                  />
                </div>

              </div>
            </div>

            <Separator className="bg-zinc-100" />

            {/* 4. File Attachments (PDFs, Certificates, Proofs) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 text-indigo-600" /> 4. File Attachments (SSL Certificate, Domain Proofs, Handover PDFs)
                </h4>
                <span className="text-[11px] text-zinc-400">PDF, JPG, PNG up to 16MB</span>
              </div>

              {/* Uploaded Attachments List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-700">Attached Files ({attachments.length}):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attachments.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-zinc-900 truncate">{file.name}</p>
                            <p className="text-[10px] text-zinc-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-zinc-400 hover:text-indigo-600 rounded transition-colors"
                            title="Preview file"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors"
                            title="Remove attachment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dropzone for Uploading */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-2">
                <UploadDropzone
                  endpoint="handoverAttachment"
                  onUploadBegin={() => setIsUploading(true)}
                  onClientUploadComplete={(res: any) => {
                    setIsUploading(false);
                    if (res && res.length > 0) {
                      const newFiles: HandoverAttachment[] = res.map((f: any) => ({
                        name: f.name || "Handover-Document.pdf",
                        url: f.url,
                        size: f.size,
                      }));
                      setAttachments((prev) => [...prev, ...newFiles]);
                      toast.success(`Successfully uploaded ${res.length} file(s) for email attachment.`);
                    }
                  }}
                  onUploadError={(e: any) => {
                    setIsUploading(false);
                    toast.error(`Upload failed: ${e.message}`);
                  }}
                  className="border-2 border-dashed border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all rounded-xl py-6 cursor-pointer"
                />
              </div>
            </div>

            <Separator className="bg-zinc-100" />

            {/* 5. Optional Custom Note */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-zinc-700">
                Custom Engineering Note / Personal Message (Optional)
              </Label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomNote(e.target.value)}
                placeholder="e.g. As discussed, we have already uploaded your first 20 products and verified your payment gateway test mode..."
                className="w-full rounded-md border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 shadow-2xs focus:border-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              />
              <p className="text-[11px] text-zinc-400">
                Appears in a highlighted engineering callout right before the executive sign-off in the email.
              </p>
            </div>

          </div>
        )}

        {/* Tab 2: Live HTML Visual Preview */}
        {activeTab === "preview" && (
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
            <div className="max-w-[650px] mx-auto bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-slate-300 px-4 py-2.5 text-[11px] font-mono flex items-center justify-between border-b border-slate-800">
                <span>To: &lt;{toEmail || "client@email.com"}&gt;</span>
                <span className="text-emerald-400 truncate max-w-[320px]">Subject: Your Store {storeName || "[Store]"} Is Now Live!</span>
              </div>
              <iframe
                title="Email Preview"
                srcDoc={previewHtml}
                className="w-full h-[600px] border-none"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/80 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Info className="h-4 w-4 text-zinc-400" />
            <span>Delivers via Resend from <strong>notifications@ninthwave.in</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSending || isUploading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || isUploading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm min-w-[170px]"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending via Resend...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Handover Email
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
