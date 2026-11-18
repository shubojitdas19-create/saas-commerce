"use client";

import React, { useState, useEffect } from "react";
import { 
  KeyRound, 
  Mail, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  RotateCcw,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  storeName: string;
  initialEmail?: string;
  onPasswordResetSuccess?: (newEmail: string) => void;
}

type Step = "email" | "otp" | "password" | "success";

export function ForgotPasswordModal({
  isOpen,
  onClose,
  storeSlug,
  storeName,
  initialEmail = "",
  onPasswordResetSuccess,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync initialEmail when opened
  useEffect(() => {
    if (isOpen) {
      if (initialEmail) setEmail(initialEmail);
      setStep("email");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [isOpen, initialEmail]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ========================================================
  // 1. REQUEST OTP
  // ========================================================
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-otp",
          email: email.trim(),
          slug: storeSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to send verification code.");
        return;
      }

      toast.success("Verification code sent to your email!");
      setStep("otp");
      setResendCooldown(60);
    } catch (err: any) {
      setError("Network error. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================
  // 2. VERIFY OTP
  // ========================================================
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email: email.trim(),
          slug: storeSlug,
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid or expired code.");
        return;
      }

      setStep("password");
    } catch (err: any) {
      setError("Network error. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================================
  // 3. RESET PASSWORD
  // ========================================================
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email: email.trim(),
          slug: storeSlug,
          otp: otp.trim(),
          newPassword: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to update password.");
        return;
      }

      setStep("success");
      if (onPasswordResetSuccess) {
        onPasswordResetSuccess(email.trim());
      }
    } catch (err: any) {
      setError("Network error. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    onClose();
    toast.success("Password updated! You can now log in with your new password.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl bg-white border border-zinc-200 shadow-2xl">
        
        {/* Top Obsidian Branding Banner */}
        <div className="bg-zinc-950 text-white px-6 pt-6 pb-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              {step === "email" && <KeyRound className="size-5" />}
              {step === "otp" && <ShieldCheck className="size-5" />}
              {step === "password" && <Lock className="size-5" />}
              {step === "success" && <CheckCircle2 className="size-5 text-emerald-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {storeName}
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                  SECURITY
                </span>
              </div>
              <DialogTitle className="text-lg font-bold text-white mt-0.5 tracking-tight">
                {step === "email" && "Reset Password"}
                {step === "otp" && "Verify 6-Digit Code"}
                {step === "password" && "Create New Password"}
                {step === "success" && "Password Reset Complete"}
              </DialogTitle>
            </div>
          </div>
          
          <DialogDescription className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
            {step === "email" && "Enter your registered merchant email to receive a password recovery verification code."}
            {step === "otp" && `Enter the 6-digit code sent to ${email} to authorize this reset.`}
            {step === "password" && "Set a strong, new password for your merchant dashboard account."}
            {step === "success" && "Your credentials have been updated securely in the database."}
          </DialogDescription>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium animate-in fade-in">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: EMAIL */}
          {/* ======================================================== */}
          {step === "email" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-xs font-semibold text-zinc-800">
                  Registered Email Address
                </Label>
                <div className="relative">
                  <Mail className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="admin@yourbrand.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl pl-10 text-sm bg-zinc-50/80 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm shadow-sm transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Sending OTP to your email...
                  </>
                ) : (
                  <>
                    Send Verification Code <ArrowRight className="size-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 2: OTP */}
          {/* ======================================================== */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reset-otp" className="text-xs font-semibold text-zinc-800">
                    6-Digit Verification Code
                  </Label>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 underline"
                  >
                    Change email
                  </button>
                </div>
                
                <Input
                  id="reset-otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  disabled={isLoading}
                  className="h-14 rounded-xl text-center text-2xl font-mono font-bold tracking-[8px] bg-zinc-50 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-950"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                <span>Didn't receive the code?</span>
                {resendCooldown > 0 ? (
                  <span className="font-mono text-zinc-400">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isLoading}
                    className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <RotateCcw className="size-3" /> Resend Code
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || otp.trim().length !== 6}
                className="w-full h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm shadow-sm transition-all mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Verifying Code...
                  </>
                ) : (
                  <>
                    Verify & Continue <ArrowRight className="size-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 3: NEW PASSWORD */}
          {/* ======================================================== */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs font-semibold text-zinc-800">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl pl-4 pr-10 text-sm bg-zinc-50/80 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-semibold text-zinc-800">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-type your new password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl pl-4 pr-10 text-sm bg-zinc-50/80 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm shadow-sm transition-all mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Updating Password...
                  </>
                ) : (
                  <>Update Password</>
                )}
              </Button>
            </form>
          )}

          {/* ======================================================== */}
          {/* STEP 4: SUCCESS */}
          {/* ======================================================== */}
          {step === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="size-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="size-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-zinc-950">Password Updated Successfully!</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  Your administrator password for <strong>{storeName}</strong> has been updated. You can now log in to your dashboard.
                </p>
              </div>

              <Button
                onClick={handleFinish}
                className="w-full h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-semibold text-sm shadow-sm transition-all"
              >
                Back to Sign In
              </Button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
