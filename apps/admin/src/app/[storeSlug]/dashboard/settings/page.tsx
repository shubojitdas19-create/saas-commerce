"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";
import { 
  Loader2, 
  CheckCircle2, 
  Store, 
  Palette, 
  Globe, 
  Truck, 
  Receipt, 
  Key,
  Lock,
  MapPin,
  CreditCard,
  Info,
  ShieldCheck // NEW: Icon for OTP
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateStoreLogoAction, updateGooglePlaceIdAction, updatePaymentCredentialsAction, getPaymentSettingsAction } from "./actions";

export default function SettingsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = use(params);
  const router = useRouter();
  
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  const [placeIdInput, setPlaceIdInput] = useState("");
  const [isSavingPlaceId, setIsSavingPlaceId] = useState(false);
  const [placeIdSuccess, setPlaceIdSuccess] = useState(false);

  // Payment Settings State
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [acceptCOD, setAcceptCOD] = useState(true);
  const [paymentProvider, setPaymentProvider] = useState("none");
  const [gatewayKeyId, setGatewayKeyId] = useState("");
  const [gatewaySecret, setGatewaySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [hasWebhook, setHasWebhook] = useState(false); // NEW STATE
  
  const [isSavingPayments, setIsSavingPayments] = useState(false);
  const [paymentsSuccess, setPaymentsSuccess] = useState(false);

  // OTP Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [otpStep, setOtpStep] = useState<"hidden" | "sending" | "input">("hidden");
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    async function loadInitialSettings() {
      const res = await getPaymentSettingsAction(storeSlug);
      if (res.success && res.data) {
        setAcceptCOD(res.data.isCodEnabled);
        setPaymentProvider(res.data.paymentProvider || "none");
        setGatewayKeyId(res.data.gatewayKeyId || "");
        setHasWebhook(res.data.hasWebhookSecret);
        
        // NEW LOGIC: Lock ONLY if they have selected a provider AND configured the webhook
        if (res.data.paymentProvider && res.data.paymentProvider !== "none" && res.data.hasWebhookSecret) {
          setIsLocked(true);
        }
      }
      setIsLoadingSettings(false);
    }
    loadInitialSettings();
  }, [storeSlug]);

  const handleLogoUpload = async (url: string) => {
    setIsUploading(true);
    setSuccessMsg("");
    const result = await updateStoreLogoAction(storeSlug, url);
    if (result.success) {
      setSuccessMsg("Logo updated successfully!");
      router.refresh(); 
    } else {
      alert(result.error);
    }
    setIsUploading(false);
  };

  const handleSavePlaceId = async () => {
    setIsSavingPlaceId(true);
    setPlaceIdSuccess(false);
    const result = await updateGooglePlaceIdAction(storeSlug, placeIdInput);
    if (result.success) {
      setPlaceIdSuccess(true);
      setTimeout(() => setPlaceIdSuccess(false), 3000);
    } else {
      alert(result.error);
    }
    setIsSavingPlaceId(false);
  };

  const handleSavePayments = async () => {
    setIsSavingPayments(true);
    setPaymentsSuccess(false);
    const result = await updatePaymentCredentialsAction(storeSlug, {
      isCodEnabled: acceptCOD,
      paymentProvider,
      gatewayKeyId,
      gatewaySecret,
      webhookSecret
    });
    
    if (result.success) {
      setPaymentsSuccess(true);
      
      // If a webhook was typed in during this save, mark it as configured
      const newlyConfiguredWebhook = webhookSecret.trim() !== "";
      if (newlyConfiguredWebhook) setHasWebhook(true);

      setGatewaySecret("");
      setWebhookSecret("");
      
      // Re-lock if a provider is selected AND a webhook is now officially configured
      if (paymentProvider !== "none" && (hasWebhook || newlyConfiguredWebhook)) {
        setIsLocked(true); 
      }
      
      setTimeout(() => setPaymentsSuccess(false), 3000);
    } else {
      alert(result.error);
    }
    setIsSavingPayments(false);
  };

  const handleSendOtp = () => {
    setOtpStep("sending");
    // TODO: Actually trigger your SMS/Email OTP API here
    setTimeout(() => setOtpStep("input"), 1500); // MOCK: Simulate network delay
  };

  const handleVerifyOtp = () => {
    // TODO: Actually verify the code against your backend here
    if (otpCode.length > 3) {
      setIsLocked(false);
      setOtpStep("hidden");
      setOtpCode("");
    } else {
      alert("Invalid OTP code.");
    }
  };

  const ComingSoonBadge = () => (
    <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-zinc-200">
      <Lock className="size-2.5" /> Coming Soon
    </span>
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-8">
      
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">Store Settings</h1>
        <p className="text-sm text-zinc-500">Manage your brand identity, domains, and general configurations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* COLUMN 1 */}
        <div className="space-y-6">
          <Card className="shadow-sm border-zinc-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-zinc-800 to-zinc-400"></div>
            <CardHeader className="pb-5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-zinc-950">
                <Palette className="size-5 text-zinc-400" /> Brand & Integrations
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1.5 text-zinc-500">
                Manage your logo, theme, and external connections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-3">
                <Label className="font-semibold text-zinc-900 text-sm">Store Logo</Label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:w-2/3">
                    <UploadDropzone
                      endpoint="productImage"
                      onUploadBegin={() => setIsUploading(true)}
                      onClientUploadComplete={(res) => {
                        if (res?.[0]) handleLogoUpload(res[0].url);
                      }}
                      onUploadError={(error: Error) => {
                        setIsUploading(false);
                        alert(`Upload failed: ${error.message}`);
                      }}
                      className="border-2 border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer rounded-xl ut-button:bg-zinc-950 ut-button:ut-readying:bg-zinc-950/50 ut-label:text-zinc-600 ut-allowed-content:text-zinc-400 py-6"
                    />
                  </div>
                  <div className="w-full sm:w-1/3 flex flex-col justify-center">
                    {isUploading && (
                      <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </div>
                    )}
                    {successMsg && !isUploading && (
                      <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-2.5 rounded-lg border border-emerald-200/60">
                        <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
                      </div>
                    )}
                    {!isUploading && !successMsg && (
                      <div className="text-xs text-zinc-500 bg-zinc-50 px-3 py-2.5 rounded-lg border border-zinc-100 leading-relaxed">
                        <span className="font-medium text-zinc-700">Recommended:</span> 256x256px<br/>
                        <span className="font-medium text-zinc-700">Max size:</span> 4MB
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-5 border-t border-zinc-100">
                <Label className="font-semibold text-zinc-900 text-sm flex items-center gap-2">
                  <MapPin className="size-4 text-zinc-400" /> Google Reviews Integration
                </Label>
                <p className="text-xs text-zinc-500 mb-2">Connect your Google Business profile to automatically sync live reviews to your storefront.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="Enter your Google Maps Place ID" 
                    value={placeIdInput}
                    onChange={(e) => setPlaceIdInput(e.target.value)}
                    className="flex-1 bg-white"
                  />
                  <Button 
                    onClick={handleSavePlaceId}
                    disabled={isSavingPlaceId}
                    className="w-full sm:w-auto bg-zinc-950 hover:bg-zinc-800 text-white shrink-0"
                  >
                    {isSavingPlaceId ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                    {placeIdSuccess ? <CheckCircle2 className="size-4 mr-2 text-emerald-400" /> : null}
                    Save ID
                  </Button>
                </div>
                <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline">
                  How to find your Place ID?
                </a>
              </div>

            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 bg-zinc-50/30">
            <CardHeader className="pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-zinc-950">
                    <Store className="size-5 text-zinc-400" /> General Details
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed mt-1.5 text-zinc-500">
                    Basic information about your business.
                  </CardDescription>
                </div>
                <ComingSoonBadge />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium text-zinc-700">Store Name</Label>
                <Input disabled placeholder="Store Name" className="bg-white text-zinc-500 cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-zinc-700">Support Email</Label>
                  <Input disabled placeholder="support@store.com" className="bg-white text-zinc-500 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-zinc-700">Phone Number</Label>
                  <Input disabled placeholder="+91 00000 00000" className="bg-white text-zinc-500 cursor-not-allowed" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUMN 2 */}
        <div className="space-y-6">

          <Card className="shadow-sm border-zinc-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            <CardHeader className="pb-5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-zinc-950">
                <CreditCard className="size-5 text-zinc-400" /> Payment Settings
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-1.5 text-zinc-500">
                Choose how your customers can pay you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              
              {isLoadingSettings ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="size-6 animate-spin text-zinc-300" />
                </div>
              ) : (
                <>
                  {/* COD Toggle - Always accessible */}
                  <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
                    <div className="space-y-0.5">
                      <Label className="font-semibold text-zinc-900 text-sm">Cash on Delivery (COD)</Label>
                      <p className="text-xs text-zinc-500 max-w-[200px] sm:max-w-[250px]">Allow customers to pay upon receiving their physical order.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={acceptCOD} 
                        onChange={(e) => setAcceptCOD(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Online Gateway Section */}
                  <div className="space-y-5 pt-1">
                    {isLocked ? (
                      // LOCKED VIEW
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="bg-white p-3 rounded-full border border-zinc-100 shadow-sm">
                          <ShieldCheck className="size-6 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">Gateway Locked Securely</p>
                          <p className="text-xs text-zinc-500 mt-1">Your store is currently collecting payments via <strong>{paymentProvider.toUpperCase()}</strong>. To modify your API keys or switch providers, you must verify your identity.</p>
                        </div>
                        
                        {otpStep === "hidden" && (
                          <Button variant="outline" onClick={handleSendOtp} className="mt-2 text-xs bg-white text-zinc-700">
                            Send OTP to Unlock
                          </Button>
                        )}
                        {otpStep === "sending" && (
                          <Button variant="outline" disabled className="mt-2 text-xs bg-white">
                            <Loader2 className="size-3 mr-2 animate-spin" /> Sending to phone...
                          </Button>
                        )}
                        {otpStep === "input" && (
                          <div className="flex flex-col gap-2 mt-2 items-center w-full max-w-[200px]">
                            <Input 
                              type="text"
                              value={otpCode} 
                              onChange={e => setOtpCode(e.target.value)} 
                              placeholder="Enter 4-6 digit OTP" 
                              className="text-center bg-white" 
                            />
                            <Button onClick={handleVerifyOtp} className="w-full text-xs bg-zinc-950 text-white">
                              Verify & Unlock
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // UNLOCKED VIEW
                      <>
                        <div className="space-y-2">
                          <Label className="font-semibold text-zinc-900 text-sm">Online Gateway Provider</Label>
                          <select 
                            value={paymentProvider}
                            onChange={(e) => setPaymentProvider(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                          >
                            <option value="none">None (Offline / COD only)</option>
                            <option value="razorpay">Razorpay</option>
                            <option value="stripe">Stripe</option>
                            <option value="cashfree">Cashfree</option>
                          </select>
                        </div>

                        {paymentProvider !== "none" && (
                          <>
                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 space-y-2">
                              <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                                <Info className="size-4" /> How to find your {paymentProvider.charAt(0).toUpperCase() + paymentProvider.slice(1)} keys
                              </div>
                              <ul className="list-disc pl-4 space-y-1.5 opacity-90">
                                {paymentProvider === "razorpay" && (
                                  <>
                                    <li><strong>API Keys:</strong> Go to Razorpay Dashboard → Settings → API Keys → Generate Key.</li>
                                    <li><strong>Webhook:</strong> Go to Settings → Webhooks → Add New. Paste the URL below, type your own random password as the Secret, and check <code className="bg-blue-100 px-1 rounded">payment.captured</code>.</li>
                                  </>
                                )}
                                {paymentProvider === "stripe" && (
                                  <>
                                    <li><strong>API Keys:</strong> Go to Stripe Dashboard → Developers → API Keys. (Publishable Key = Key ID).</li>
                                    <li><strong>Webhook:</strong> Go to Developers → Webhooks → Add Endpoint. Paste the URL below, and click 'Reveal' to copy the Signing Secret.</li>
                                  </>
                                )}
                                {paymentProvider === "cashfree" && (
                                  <>
                                    <li><strong>API Keys:</strong> Go to Cashfree Dashboard → Developers → API Keys. (App ID = Key ID).</li>
                                    <li><strong>Webhook:</strong> Go to Developers → Webhooks. Paste the URL below and copy your Webhook Secret Key.</li>
                                  </>
                                )}
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <Label className="font-semibold text-zinc-900 text-sm">Gateway Key ID (Public)</Label>
                              <Input 
                                placeholder={paymentProvider === "stripe" ? "pk_live_..." : paymentProvider === "razorpay" ? "rzp_live_..." : "Enter public key ID"} 
                                value={gatewayKeyId}
                                onChange={(e) => setGatewayKeyId(e.target.value)}
                                className="bg-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="font-semibold text-zinc-900 text-sm">Gateway Secret (Private)</Label>
                              <Input 
                                type="password"
                                placeholder="Paste secret here (encrypted before saving)" 
                                value={gatewaySecret}
                                onChange={(e) => setGatewaySecret(e.target.value)}
                                className="bg-white"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="font-semibold text-zinc-900 text-sm">Webhook Secret</Label>
                              <Input 
                                type="password"
                                placeholder="Paste webhook secret to enable auto-verification" 
                                value={webhookSecret}
                                onChange={(e) => setWebhookSecret(e.target.value)}
                                className="bg-white"
                              />
                              <div className="bg-zinc-50 border border-zinc-200 rounded p-2.5 mt-2">
                                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Your Webhook URL</p>
                                <code className="text-xs text-zinc-700 break-all select-all">
  {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/webhooks/{storeSlug}/payments
</code>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <Button 
                    onClick={handleSavePayments}
                    disabled={isSavingPayments}
                    className="w-full bg-zinc-950 hover:bg-zinc-800 text-white mt-4"
                  >
                    {isSavingPayments ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                    {paymentsSuccess ? <CheckCircle2 className="size-4 mr-2 text-emerald-400" /> : null}
                    Save Payment Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-zinc-200 bg-zinc-50/30">
            <CardHeader className="pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-zinc-950">
                    <Globe className="size-5 text-zinc-400" /> Domains
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed mt-1.5 text-zinc-500">
                    Connect a custom domain to your storefront.
                  </CardDescription>
                </div>
                <ComingSoonBadge />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="font-medium text-zinc-700">Primary Domain</Label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Input disabled placeholder="www.yourstore.com" className="bg-white text-zinc-500 cursor-not-allowed" />
                  <Button disabled variant="outline" className="w-full sm:w-auto shrink-0">Verify Domain</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 bg-zinc-50/30">
            <CardHeader className="pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-zinc-950">
                    <Truck className="size-5 text-zinc-400" /> Shipping
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed mt-1.5 text-zinc-500">
                    Set how much you charge for delivery.
                  </CardDescription>
                </div>
                <ComingSoonBadge />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 relative max-w-[200px]">
                <Label className="font-medium text-zinc-700">Flat Shipping Rate</Label>
                <span className="absolute left-3 top-[28px] text-zinc-400 text-sm">₹</span>
                <Input disabled type="number" placeholder="0.00" className="bg-white pl-7 text-zinc-500 cursor-not-allowed" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200 bg-zinc-50/30">
            <CardHeader className="pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-zinc-950">
                    <Receipt className="size-5 text-zinc-400" /> Taxes
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed mt-1.5 text-zinc-500">
                    Configure global tax rates applied at checkout.
                  </CardDescription>
                </div>
                <ComingSoonBadge />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-[200px]">
                <Label className="font-medium text-zinc-700">Global Tax Rate (%)</Label>
                <Input disabled type="number" placeholder="18.0" className="bg-white text-zinc-500 cursor-not-allowed" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-800 bg-zinc-950 text-zinc-400 overflow-hidden">
            <CardHeader className="pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2.5 text-zinc-100">
                    <Key className="size-5 text-zinc-500" /> API Keys
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed mt-1.5 text-zinc-400">
                    Your private key to connect the frontend UI to this admin portal.
                  </CardDescription>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700">
                  <Lock className="size-2.5" /> Coming Soon
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="font-medium text-zinc-300">Storefront API Key</Label>
                <Input disabled type="password" value="sk_live_xxxx_xxxx_xxxx" className="bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed" />
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}