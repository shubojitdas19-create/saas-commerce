"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForgotPasswordModal } from "./forgot-password-modal";
import { LegalModal, LegalDocType } from "./legal-modal";

const CYCLE_MS = 4200;

const HIGHLIGHTS = [
  {
    id: "vanij-ai",
    tab: "Vanij AI",
    kicker: "Vanij AI · 24/7 Assistant",
    headline: "Your dedicated 24/7 store assistant",
    summary:
      "Draft listings, automate daily tasks, and get instant store help anytime.",
    icon: Sparkles,
  },
  {
    id: "store-ops",
    tab: "All-in-One",
    kicker: "Complete Store Control",
    headline: "Products to orders, all in one place",
    summary:
      "Add products, track live inventory, and manage deliveries from one workspace.",
    icon: Layers,
  },
  {
    id: "security",
    tab: "Payments & Trust",
    kicker: "Payments & Security",
    headline: "Fast checkout with encrypted access",
    summary:
      "Accept payments smoothly with real-time order updates and AES-256 protection.",
    icon: ShieldCheck,
  },
] as const;

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Security", href: "/security" },
  { label: "Help", href: "/help" },
];

export default function LoginForm({
  storeSlug,
  storeName,
  logoUrl,
}: {
  storeSlug: string;
  storeName: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Synced infinite loop (resets cleanly on manual tap/click)
  useEffect(() => {
    if (isPaused) return;
    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % HIGHLIGHTS.length);
    }, CYCLE_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, isPaused]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/tenant-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, slug: storeSlug }),
      });
      const result = await res.json();

      if (result.success) {
        router.push(`/${storeSlug}/dashboard`);
      } else {
        setError(result.error || "Invalid email or password.");
        setErrorKey((k) => k + 1);
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please check your connection and try again.");
      setErrorKey((k) => k + 1);
      setIsLoading(false);
    }
  };

  const activeHighlight = HIGHLIGHTS[activeIndex] ?? HIGHLIGHTS[0];
  const ActiveIcon = activeHighlight.icon;
  const showStoreLogo = Boolean(logoUrl) && !logoError;

  return (
    <main className="flex min-h-dvh flex-col bg-[#160e7a] text-zinc-950 lg:grid lg:grid-cols-[1.06fr_0.94fr] lg:bg-white">
      <style>{`
        @keyframes vanij-enter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vanij-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vanij-ambient {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.45; }
          50% { transform: translate(16px, -12px) scale(1.06); opacity: 0.65; }
        }
        @keyframes vanij-bar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes vanij-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
        }
        .v-enter {
          animation: vanij-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .v-slide-up {
          animation: vanij-slide-up 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .v-ambient {
          animation: vanij-ambient 12s ease-in-out infinite;
        }
        .v-bar {
          transform-origin: left;
          animation: vanij-bar ${CYCLE_MS}ms linear forwards;
        }
        .v-shake {
          animation: vanij-shake 0.32s ease-in-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .v-enter, .v-ambient, .v-shake {
            animation: none !important;
          }
          .v-slide-up {
            animation-duration: 0.15s !important;
          }
        }
      `}</style>

      {/* LEFT / TOP: Dominant Vanij Brand Header & Auto-Looping Showcase */}
      <section
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") setIsPaused(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setIsPaused(false);
        }}
        className="relative isolate flex flex-col justify-between overflow-hidden bg-[#181082] px-6 pb-11 pt-7 text-white sm:px-8 lg:min-h-dvh lg:px-14 lg:py-10 xl:px-20"
      >
        {/* Smooth Cobalt Gradient + Subtle Ambient Motion */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(125%_95%_at_0%_0%,#3b2dff_0%,#2113cb_48%,#100959_100%)]"
        />
        <div
          aria-hidden="true"
          className="v-ambient pointer-events-none absolute -left-24 -top-24 -z-10 size-96 rounded-full bg-[#7362ff]/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="v-ambient pointer-events-none absolute -bottom-28 -right-24 -z-10 size-80 rounded-full bg-[#4a2eff]/35 blur-3xl lg:size-[420px] [animation-delay:-6s]"
        />

        {/* Dominant Vanij Brand Lockup */}
        <header className="v-enter relative z-10 flex items-center justify-between gap-3">
          <a
            href="https://ninthwave.in"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-3.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-105 lg:size-[52px]">
              <img
                src="/logo/vanij-icon.png"
                onError={(e) => {
                  e.currentTarget.src = "https://juip68hrv7.ufs.sh/f/rbcDy8QRznHhem5fUSF6Z0dYSM3sKUi1NLaCEcpA4r2hGDvT";
                }}
                alt="Vanij"
                className="size-8 object-contain lg:size-9"
              />
            </span>
            <div className="flex flex-col">
              <span className="text-[24px] font-bold leading-none tracking-[-0.035em] text-white lg:text-[26px]">
                Vanij
              </span>
              <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200/85">
                Commerce Cloud
              </span>
            </div>
          </a>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-md">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
            </span>
            Vanij AI 24/7
          </span>
        </header>

        {/* MOBILE: Expanded Auto-Looping Feature Showcase (Fixed Height, Never Truncated) */}
        <div
          className="v-enter relative z-10 mt-7 lg:hidden"
          style={{ animationDelay: "70ms" }}
        >
          <button
            type="button"
            onClick={() =>
              setActiveIndex((prev) => (prev + 1) % HIGHLIGHTS.length)
            }
            className="block w-full text-left focus-visible:outline-none"
            aria-label="Show next Vanij feature"
          >
            <div
              key={activeHighlight.id}
              className="v-slide-up min-h-[82px]"
            >
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-200/90">
                <ActiveIcon className="size-3.5 text-indigo-200" aria-hidden="true" />
                <span>{activeHighlight.kicker}</span>
              </div>
              <h2 className="mt-1.5 text-[18px] font-semibold leading-snug tracking-[-0.02em] text-white">
                {activeHighlight.headline}
              </h2>
              <p className="mt-1 text-[13px] leading-5 text-indigo-100/80">
                {activeHighlight.summary}
              </p>
            </div>
          </button>

          {/* Animated Loop Progress Bars */}
          <div
            className="mt-4 flex items-center gap-2"
            role="tablist"
            aria-label="Vanij features"
          >
            {HIGHLIGHTS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                aria-label={item.tab}
                onClick={() => setActiveIndex(idx)}
                className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20"
              >
                {idx === activeIndex && (
                  <span
                    key={`${item.id}-${activeIndex}`}
                    className="v-bar block h-full w-full rounded-full bg-white"
                  />
                )}
                {idx < activeIndex && (
                  <span className="block h-full w-full rounded-full bg-white/75" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* DESKTOP: Editorial Centerpiece + Single Clean Feature Switcher */}
        <div className="relative z-10 my-auto hidden max-w-[495px] py-8 lg:block">
          <h1
            className="v-enter text-[clamp(2.4rem,3.5vw,3.35rem)] font-semibold leading-[1.08] tracking-[-0.038em] text-white"
            style={{ animationDelay: "60ms" }}
          >
            One workspace to run
            <br />
            <span className="text-indigo-200">your entire store.</span>
          </h1>

          <p
            className="v-enter mt-4 max-w-[430px] text-[15px] leading-7 text-indigo-100/75"
            style={{ animationDelay: "120ms" }}
          >
            Manage products, orders, and payments in one calm dashboard—backed
            by your dedicated 24/7 assistant,{" "}
            <span className="font-medium text-white">Vanij AI</span>.
          </p>

          {/* Single Minimal Auto-Looping Spotlight */}
          <div
            className="v-enter mt-10 border-t border-white/15 pt-6"
            style={{ animationDelay: "180ms" }}
          >
            <div
              role="tablist"
              aria-label="Vanij platform features"
              className="flex items-center gap-6"
            >
              {HIGHLIGHTS.map((item, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative pb-2.5 text-[13px] font-medium transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-indigo-200/55 hover:text-indigo-100/90"
                    }`}
                  >
                    {item.tab}
                    <span className="absolute inset-x-0 bottom-0 h-[1.5px] overflow-hidden rounded-full bg-white/10">
                      {isActive && (
                        <span
                          key={`${item.id}-${activeIndex}`}
                          className={`block h-full w-full bg-white ${
                            isPaused ? "" : "v-bar"
                          }`}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              key={activeHighlight.id}
              role="tabpanel"
              className="v-slide-up mt-5 flex min-h-[78px] items-start gap-3.5"
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-100 ring-1 ring-white/15">
                <ActiveIcon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-white">
                  {activeHighlight.headline}
                </h3>
                <p className="mt-1 text-[13.5px] leading-6 text-indigo-100/75">
                  {activeHighlight.summary}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Left Footer */}
        <div
          className="v-enter relative z-10 hidden items-center justify-between text-xs text-indigo-200/65 lg:flex"
          style={{ animationDelay: "220ms" }}
        >
          <span>© {new Date().getFullYear()} Ninthwave Technologies</span>
          <span>Powered by Vanij</span>
        </div>
      </section>

      {/* RIGHT / BOTTOM: Tight Native White Sheet on Mobile, Open Canvas on Desktop */}
      <section className="relative z-10 -mt-5 flex flex-1 flex-col rounded-t-[28px] bg-white px-6 pb-5 pt-6 shadow-[0_-12px_32px_-12px_rgba(12,8,70,0.35)] sm:px-8 lg:mt-0 lg:min-h-dvh lg:rounded-none lg:px-14 lg:py-10 lg:shadow-none">
        {/* Form Column: Top-aligned on mobile (no dead top gap), centered on desktop */}
        <div
          className="v-enter mx-auto flex w-full max-w-[392px] flex-1 flex-col justify-start lg:justify-center"
          style={{ animationDelay: "100ms" }}
        >
          {/* Compact Connected Store Row */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 px-3 py-2.5 lg:mb-7 lg:border-0 lg:bg-transparent lg:p-0">
            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200/90 bg-white">
              {showStoreLogo ? (
                <img
                  src={logoUrl!}
                  alt={`${storeName} logo`}
                  onError={() => setLogoError(true)}
                  className="size-full object-contain p-1.5"
                />
              ) : (
                <Store className="size-[18px] text-[#2518e6]" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-zinc-900">
                {storeName}
              </p>
              <p className="mt-0.5 truncate font-mono text-xs text-zinc-400">
                /{storeSlug}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 lg:hidden">
              Workspace
            </span>
          </div>

          {/* Form Header */}
          <div className="mb-5 lg:mb-6">
            <h1 className="text-[1.6rem] font-semibold tracking-[-0.03em] text-zinc-950 lg:text-[1.75rem]">
              Sign in to Vanij
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Enter your <strong className="font-semibold text-zinc-800">{storeName}</strong> administrator credentials to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error && (
              <div
                key={errorKey}
                role="alert"
                aria-live="polite"
                className="v-shake flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] font-medium leading-5 text-red-700"
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0 text-red-600"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="email"
                className="text-[13px] font-medium text-zinc-700"
              >
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400"
                  aria-hidden="true"
                />
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="username"
                  enterKeyHint="next"
                  placeholder="you@yourstore.com"
                  required
                  className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 pl-10 pr-4 text-base text-zinc-950 shadow-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-[#2518e6] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#2518e6]/10 lg:h-11 lg:text-[15px] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#ffffff] [&:-webkit-autofill]:[-webkit-text-fill-color:#09090b]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label
                  htmlFor="password"
                  className="text-[13px] font-medium text-zinc-700"
                >
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="rounded text-[13px] font-medium text-[#2518e6] transition-colors hover:text-[#180ea8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2518e6]/40 focus-visible:ring-offset-2"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-zinc-400"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  enterKeyHint="go"
                  placeholder="Enter your password"
                  required
                  className="h-12 rounded-xl border-zinc-200 bg-zinc-50/50 pl-10 pr-11 text-base text-zinc-950 shadow-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-[#2518e6] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#2518e6]/10 lg:h-11 lg:text-[15px] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#ffffff] [&:-webkit-autofill]:[-webkit-text-fill-color:#09090b]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2518e6]/40"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="size-[18px]" aria-hidden="true" />
                  ) : (
                    <Eye className="size-[18px]" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="group relative mt-1.5 h-12 w-full overflow-hidden rounded-xl bg-[#2518e6] text-[15px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_20px_-10px_rgba(37,24,230,0.65)] transition-all hover:bg-[#1e12c8] active:scale-[0.985] focus-visible:ring-4 focus-visible:ring-[#2518e6]/25 disabled:opacity-60 lg:h-11"
              disabled={isLoading}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100"
              />
              {isLoading ? (
                <>
                  <Loader2
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Continue to dashboard</span>
                  <ArrowRight
                    className="ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>

            {/* Concise Legal Consent */}
            <p className="mt-1 text-center text-xs leading-5 text-zinc-400">
              By signing in, you agree to our{" "}
              <button
                type="button"
                onClick={() => setLegalDoc("terms")}
                className="text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-950 cursor-pointer"
              >
                Terms
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setLegalDoc("privacy")}
                className="text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-950 cursor-pointer"
              >
                Privacy Policy
              </button>
              .
            </p>
          </form>
        </div>

        {/* Grounded Legal Footer */}
        <footer className="mx-auto mt-6 flex w-full max-w-[392px] flex-col items-center gap-2 border-t border-zinc-100 pt-4 text-xs text-zinc-400 sm:flex-row sm:justify-between lg:mt-8">
          <nav aria-label="Legal links" className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLegalDoc("privacy")}
              className="transition-colors hover:text-zinc-700 cursor-pointer"
            >
              Privacy
            </button>
            <button
              type="button"
              onClick={() => setLegalDoc("terms")}
              className="transition-colors hover:text-zinc-700 cursor-pointer"
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => setLegalDoc("security")}
              className="transition-colors hover:text-zinc-700 cursor-pointer"
            >
              Security
            </button>
            <a
              href={`mailto:security@ninthwave.in?subject=Vanij%20Merchant%20Support%20-%20${encodeURIComponent(storeName)}`}
              className="transition-colors hover:text-zinc-700 cursor-pointer"
            >
              Help
            </a>
          </nav>
          <span className="text-[11px] text-zinc-400 lg:hidden">
            © {new Date().getFullYear()} Ninthwave Technologies
          </span>
        </footer>
      </section>

      {/* 1. Working Resend OTP Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        storeSlug={storeSlug}
        storeName={storeName}
        initialEmail={email}
        onPasswordResetSuccess={(resetEmail) => {
          setEmail(resetEmail);
          setPassword("");
        }}
      />

      {/* 2. Interactive Legal Policies Modal */}
      <LegalModal
        isOpen={Boolean(legalDoc)}
        onClose={() => setLegalDoc(null)}
        initialDoc={legalDoc || "terms"}
        storeName={storeName}
      />
    </main>
  );
}