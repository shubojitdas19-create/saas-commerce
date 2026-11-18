"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShoppingBag,
  Store,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForgotPasswordModal } from "./forgot-password-modal";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

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
        setError(result.error || "Invalid credentials.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please check your connection.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1efff] text-slate-950 lg:grid lg:grid-cols-[1.04fr_0.96fr]">
      <section className="relative isolate flex min-h-[285px] flex-col overflow-hidden bg-[#2816df] px-5 pb-12 pt-5 text-white sm:min-h-[330px] sm:px-8 lg:min-h-screen lg:px-12 lg:pb-12 lg:pt-9 xl:px-20">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(ellipse_at_18%_15%,rgba(112,96,255,0.9),transparent_38%),linear-gradient(145deg,#3122e9_0%,#2514df_48%,#1908c2_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-[13%] -z-10 size-72 rounded-full bg-[#8178ff]/30 blur-3xl motion-safe:animate-[login-float_9s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -right-20 top-[42%] -z-10 size-64 rounded-full bg-[#6754ff]/35 blur-3xl motion-safe:animate-[login-float_12s_ease-in-out_infinite_reverse]" />
        <div className="pointer-events-none absolute -bottom-[16%] -left-[8%] -z-10 h-[54%] w-[120%] -rotate-6 rounded-[48%] bg-[#5a4af0]/65" />
        <div className="pointer-events-none absolute -bottom-[26%] -right-[20%] -z-10 h-[44%] w-[100%] rotate-6 rounded-[50%] bg-[#8177ff]/50" />
        <div className="pointer-events-none absolute bottom-[8%] right-[14%] -z-10 h-[26%] w-[70%] rotate-[-12deg] rounded-[50%] bg-[#3929df]/65" />

        <header className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-4 backdrop-blur-md">
            <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-white">
              <img src="/logo/vanij-icon.png" alt="" className="size-7 object-contain" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Vanij</span>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/90 backdrop-blur-md sm:text-xs">STORE ADMIN</span>
        </header>

        <div className="relative z-10 mt-8 max-w-xl sm:mt-10 lg:mt-[clamp(4rem,13vh,10rem)]">
          <div className="mb-5 flex items-center gap-3 sm:mb-6">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/25 bg-white/95 shadow-lg shadow-indigo-950/20 sm:size-14">
              {logoUrl ? (
                <img src={logoUrl} alt={`${storeName} logo`} className="size-full object-contain p-1.5" />
              ) : (
                <Store className="size-6 text-indigo-700 sm:size-7" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-100 sm:text-[11px]">Your workspace</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white sm:text-base">{storeName}</p>
            </div>
          </div>
          <h1 className="max-w-lg text-[2rem] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[clamp(3.25rem,5vw,5rem)]">
            Your store,
            <br />
            <span className="text-[#c7c2ff]">in full flow.</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-indigo-100/90 sm:mt-5 sm:text-base sm:leading-7">
            Products, orders, and everything behind your business—together in one workspace.
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-5 right-5 z-10 hidden w-[158px] rounded-2xl border border-white/30 bg-white/95 p-3 text-slate-900 shadow-[0_18px_50px_-18px_rgba(16,8,80,0.65)] backdrop-blur-xl sm:block sm:bottom-8 sm:right-8 sm:w-[205px] sm:rounded-[22px] sm:p-4 lg:bottom-[13%] lg:right-[8%] lg:w-[250px] motion-safe:animate-[login-float_7s_ease-in-out_infinite]">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:text-[10px]">Store overview</p>
              <p className="mt-1 text-xs font-semibold sm:text-sm">Looking good</p>
            </div>
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet-50 text-violet-700 sm:size-9 sm:rounded-xl">
              <TrendingUp className="size-4" aria-hidden="true" />
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:size-9 sm:rounded-xl"><ShoppingBag className="size-3.5 sm:size-4" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <div className="h-1.5 w-4/5 rounded-full bg-slate-100"><div className="h-full w-3/4 rounded-full bg-violet-500" /></div>
              <div className="mt-1.5 h-1 w-1/2 rounded-full bg-slate-100" />
            </div>
            <BadgeCheck className="size-4 text-emerald-500 sm:size-[18px]" aria-hidden="true" />
          </div>
        </div>

        <div className="relative z-10 mt-auto hidden items-center gap-2 text-xs font-medium text-indigo-100/80 lg:flex">
          <Boxes className="size-4" aria-hidden="true" />
          <span>Commerce made simple</span>
          <span className="mx-1 size-1 rounded-full bg-indigo-200/70" />
          <span>Secure admin access</span>
        </div>
      </section>

      <section className="relative z-10 -mt-6 flex flex-1 flex-col px-4 pb-7 sm:px-8 lg:mt-0 lg:min-h-screen lg:items-center lg:justify-center lg:px-10 lg:py-12 xl:px-16">
        <div className="mx-auto w-full max-w-[440px] rounded-[26px] border border-white bg-white px-5 py-7 shadow-[0_24px_70px_-32px_rgba(43,25,130,0.24)] sm:rounded-[32px] sm:px-9 sm:py-9 lg:px-10 lg:py-10">
          <div className="mb-7 flex items-center gap-2 text-xs font-medium text-slate-500">
            <LockKeyhole className="size-3.5 text-violet-700" aria-hidden="true" />
            <span>Secure access to</span>
            <span className="max-w-[180px] truncate font-semibold text-slate-700">{storeName}</span>
          </div>

          <div className="mb-7 sm:mb-8">
            <p className="mb-2 text-sm font-semibold text-violet-700">Welcome back</p>
            <h2 className="text-[1.7rem] font-semibold tracking-[-0.035em] text-slate-950 sm:text-3xl">Sign in to continue</h2>
            <p className="mt-2.5 text-sm leading-6 text-slate-500">Use your store admin account to pick up where you left off.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@yourstore.com"
                required
                className="h-[50px] rounded-xl border-slate-200 bg-white px-4 text-base shadow-sm placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-violet-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="rounded text-xs font-semibold text-violet-700 transition-colors hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 sm:text-sm"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  className="h-[50px] rounded-xl border-slate-200 bg-white pl-4 pr-12 text-base shadow-sm placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-violet-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="group mt-1 h-[50px] w-full rounded-xl bg-[#3120e8] text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(49,32,232,0.8)] transition-all hover:-translate-y-0.5 hover:bg-[#2717cf] focus-visible:ring-violet-400"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="size-5 animate-spin" aria-hidden="true" /><span>Signing in…</span></>
              ) : (
                <>Sign in to workspace <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500 sm:mt-7 sm:pt-6">
            <BadgeCheck className="size-4 text-violet-600" aria-hidden="true" />
            <span>Protected by Vanij security</span>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-400 lg:mt-7">© {new Date().getFullYear()} Vanij · Commerce made simple</p>
      </section>

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
    </main>
  );
}
