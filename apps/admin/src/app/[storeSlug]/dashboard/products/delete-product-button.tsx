"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function DeleteProductButton({ 
  productId, 
  deleteAction 
}: { 
  productId: string, 
  deleteAction: (id: string) => Promise<{ success: boolean; error?: string }> 
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    // Optional: Add a confirmation dialog here if desired
    startTransition(async () => {
      const result = await deleteAction(productId);
      if (result.success) {
        toast.success("Product deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete product");
      }
    });
  };

  return (
    <Button 
      onClick={handleDelete}
      disabled={isPending}
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}