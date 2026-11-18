"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Loader2, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForgotPasswordModal } from "./forgot-password-modal";

export default function LoginForm({ 
  storeSlug, 
  storeName, 
  logoUrl 
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
    <div className="min-h-screen w-full flex bg-zinc-50 lg:bg-white">
      
      {/* LEFT SIDE: Brand Presentation (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 p-12 flex-col justify-between relative overflow-hidden">
         {/* Subtle background glow effect */}
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-950 z-0"></div>
         <div className="absolute top-1/4 -left-[20%] w-[80%] h-[80%] rounded-full bg-emerald-900/15 blur-[120px] z-0 pointer-events-none"></div>
         <div className="absolute -bottom-1/4 -right-[20%] w-[80%] h-[80%] rounded-full bg-blue-900/15 blur-[120px] z-0 pointer-events-none"></div>
         
         <div className="relative z-10 flex items-center gap-2 text-zinc-400 text-[11px] font-bold tracking-widest uppercase">
            Admin Workspace
         </div>

         <div className="relative z-10 max-w-lg">
            {logoUrl ? (
               <div className="h-24 w-24 mb-10 rounded-2xl bg-white p-2 shadow-2xl overflow-hidden border border-white/10">
                 <img src={logoUrl} alt={storeName} className="h-full w-full object-cover rounded-xl" />
               </div>
            ) : (
               <div className="h-20 w-20 bg-white/10 rounded-2xl flex items-center justify-center mb-10 backdrop-blur-sm border border-white/10 shadow-2xl">
                  <Store className="h-10 w-10 text-white" />
               </div>
            )}
            <h1 className="text-5xl font-bold text-white tracking-tight mb-5 leading-tight">
              {storeName}
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed font-medium">
              Manage your catalog, fulfill orders, and configure your storefront settings from a secure dashboard.
            </p>
         </div>

         <div className="relative z-10 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent"></div>
            <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">
              Powered by SJ Digital Studio
            </div>
         </div>
      </div>

      {/* RIGHT SIDE: Interactive Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12 relative">
        <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-xl lg:shadow-none lg:bg-transparent p-8 sm:p-10 lg:p-0 border border-zinc-100 lg:border-none">
           
           <div className="mb-8">
              {/* Mobile Logo */}
              <div className="lg:hidden flex mb-8">
                {logoUrl ? (
                   <div className="h-16 w-16 rounded-2xl shadow-sm border border-zinc-100 p-1.5 overflow-hidden">
                     <img src={logoUrl} alt={storeName} className="h-full w-full object-cover rounded-xl" />
                   </div>
                ) : (
                   <div className="h-14 w-14 bg-zinc-950 rounded-xl flex items-center justify-center shadow-md">
                      <Store className="h-7 w-7 text-white" />
                   </div>
                )}
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
                Sign in to <span className="lg:hidden">{storeName}</span>
              </h2>
              <p className="text-sm text-zinc-500 mt-2.5 leading-relaxed">
                Enter your administrative credentials to access the backend portal.
              </p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-5">
             
             {error && (
               <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium animate-in fade-in slide-in-from-top-1">
                 <AlertCircle className="h-4 w-4 shrink-0" /> {error}
               </div>
             )}

             <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-zinc-900 text-sm">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@brand.com" 
                  required 
                  className="h-12 rounded-xl bg-zinc-50/80 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-950 transition-all text-base px-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
             </div>
             
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <Label htmlFor="password" className="font-semibold text-zinc-900 text-sm">Password</Label>
                   <button
                     type="button"
                     onClick={() => setIsForgotModalOpen(true)}
                     className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                   >
                     Forgot password?
                   </button>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    required 
                    className="h-12 rounded-xl bg-zinc-50/80 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-950 transition-all text-base pl-4 pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 transition-colors focus:outline-none rounded-md"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
             </div>
             
             <Button 
               type="submit" 
               className="w-full h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white shadow-md text-sm font-semibold transition-all group mt-2 cursor-pointer" 
               disabled={isLoading}
             >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                )}
             </Button>
           </form>

           {/* Forgot Password Multi-Step Verification Modal */}
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

        </div>
      </div>
    </div>
  );
}
