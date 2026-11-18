"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard caught an error:", error);
  }, [error]);

  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-50 text-red-500 mb-6">
        <AlertTriangle className="size-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-zinc-950 mb-2">Something went wrong</h2>
      <p className="text-zinc-500 max-w-md mx-auto mb-8">
        We encountered an issue loading this page. Our team has been notified.
      </p>
      <Button 
        onClick={() => reset()} 
        className="bg-zinc-950 hover:bg-zinc-800 text-white gap-2 rounded-full"
      >
        <RefreshCcw className="size-4" /> Try Again
      </Button>
    </div>
  );
}