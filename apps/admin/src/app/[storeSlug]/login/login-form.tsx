"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Loader2, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
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

  const storeMark = (size: string) => (
    <div className={`${size} shrink-0 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm`}>
      {logoUrl ? (
        <img src={logoUrl} alt={`${storeName} logo`} className="h-full w-full object-contain p-2" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-violet-50 text-violet-700">
          <Store className="size-7" aria-hidden="true" />
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#fbfaff] text-slate-900 lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-violet-100 bg-gradient-to-br from-[#f5f1ff] via-[#f8f6ff] to-[#fff8f2] px-12 py-10 lg:flex xl:px-20 xl:py-12">
        <div className="pointer-events-none absolute -left-32 top-1/4 size-[28rem] rounded-full bg-violet-200/35 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-28 size-[30rem] rounded-full bg-fuchsia-100/50 blur-3xl" />
        <div className="relative z-10 flex items-center">
          <img src="/logo/Vanij-logo.png" alt="Vanij — Commerce made simple" className="h-auto w-36 object-contain" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-xl pb-4">
          <div className="mb-8 flex items-center gap-4">
            {storeMark("size-16")}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Your workspace</p>
              <p className="mt-1 truncate text-sm font-medium text-slate-600">{storeName}</p>
            </div>
          </div>
          <h1 className="max-w-lg text-4xl font-semibold leading-[1.16] tracking-tight text-slate-950 xl:text-5xl">
            Everything your store needs, <span className="text-violet-700">in one place.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
            Sign in to manage your products, orders, and storefront with confidence.
          </p>
          <div className="mt-10 inline-flex items-center gap-2.5 rounded-full border border-white/90 bg-white/75 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
            <ShieldCheck className="size-4 text-violet-700" aria-hidden="true" />
            A secure space for your business
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-violet-200/70 pt-5 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Vanij</span>
          <span>Commerce made simple</span>
        </div>
      </section>

      <section className="flex min-h-screen flex-col px-5 pb-6 pt-6 sm:px-8 sm:py-10 lg:items-center lg:justify-center lg:px-12">
        <header className="mb-10 flex items-center justify-between lg:hidden">
          <img src="/logo/Vanij-logo.png" alt="Vanij — Commerce made simple" className="h-auto w-28 object-contain" />
          <span className="rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-medium text-violet-700">Admin portal</span>
        </header>

        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            {storeMark("size-12 rounded-xl")}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-700">Store workspace</p>
              <p className="truncate text-sm font-semibold text-slate-800">{storeName}</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-violet-700">Welcome back</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">Sign in to your account</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Enter your details to continue to your store dashboard.</p>
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
                className="h-12 rounded-xl border-slate-200 bg-white px-4 text-base shadow-sm placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-violet-200"
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
                  className="rounded text-sm font-semibold text-violet-700 transition-colors hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
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
                  className="h-12 rounded-xl border-slate-200 bg-white pl-4 pr-12 text-base shadow-sm placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-violet-200"
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
              className="group mt-1 h-12 w-full rounded-xl bg-violet-700 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(91,33,182,0.6)] transition-all hover:bg-violet-800 focus-visible:ring-violet-400"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="size-5 animate-spin" aria-hidden="true" /><span>Signing in…</span></>
              ) : (
                <>Sign in <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></>
              )}
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="size-4 text-violet-600" aria-hidden="true" />
            <span>Secure sign in, powered by Vanij</span>
          </div>

          <footer className="mt-12 text-center text-xs text-slate-400 lg:hidden">
            © {new Date().getFullYear()} Vanij · Commerce made simple
          </footer>
        </div>

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
      </section>
    </main>
  );
}
