"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, FolderTree, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createCategoryAction } from "./actions";
import { getCategoriesAction } from "../products/new/actions";
import { toast } from "sonner"; // NEW: Imported Sonner for toasts

export default function CategoriesPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [categoryList, setCategoryList] = useState<{id: string, name: string, slug: string}[]>([]);

  // Fetch existing categories to display on the page TEST
  const loadCategories = () => {
    getCategoriesAction(storeSlug).then((data) => setCategoryList(data));
  };

  useEffect(() => {
    loadCategories();
  }, [storeSlug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    
    const result = await createCategoryAction(storeSlug, name);

    if (result?.success) {
      setName(""); // Clear the input
      toast.success("Category created successfully!"); // NEW: Success Toast
      loadCategories(); // Instantly refresh the list
      router.refresh(); 
    } else {
      toast.error(result?.error || "Failed to create category."); // NEW: Error Toast
    }
    
    setIsLoading(false);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-zinc-100 rounded-xl flex items-center justify-center border border-zinc-200">
            <FolderTree className="h-5 w-5 text-zinc-900" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
              Categories
            </h1>
            <p className="text-sm text-zinc-500">Organize your products for the storefront.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        
        {/* Left Column: Add Category Form */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-zinc-200 sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Add Category</CardTitle>
              <CardDescription>Create a new product grouping.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-900 font-medium">Category Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Interior Emulsions" 
                    className="bg-white border-zinc-200 transition-all focus:ring-2 focus:ring-zinc-900 outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {/* NEW: Added active:scale-[0.98] and transition to the button for tactile feedback */}
                <Button 
                  type="submit" 
                  disabled={isLoading || !name.trim()} 
                  className="w-full bg-zinc-950 text-white hover:bg-zinc-800 transition-all duration-200 active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Category
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Existing Categories List test*/}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-zinc-200">
            <CardHeader>
              <CardTitle className="text-lg">Active Categories</CardTitle>
              <CardDescription>All categories currently available in your store.</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                  <Tags className="h-8 w-8 text-zinc-300 mb-3" />
                  <p className="text-sm font-medium text-zinc-900">No categories found</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Create your first category using the form to get started.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {categoryList.map((category) => (
                    <div 
                      key={category.id} 
                      // NEW: Added hover:-translate-y-1, hover:shadow-md, cursor-pointer, and active:scale-[0.98] 
                      className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white shadow-sm hover:border-zinc-300 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900">{category.name}</span>
                        <span className="text-xs font-mono text-zinc-500 mt-0.5">/{category.slug}</span>
                      </div>
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full ring-1 ring-inset ring-emerald-600/20">
                        Active
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
