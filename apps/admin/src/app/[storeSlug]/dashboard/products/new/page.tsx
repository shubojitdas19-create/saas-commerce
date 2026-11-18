"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, X, Plus, Trash2, Box, Info, CheckSquare, Image as ImageIcon, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadDropzone } from "@/lib/uploadthing";
import { createProductAction, getCategoriesAction } from "./actions";
import { bulkImportAsianPaintsAction } from "./actions";
import asianPaintsData from "./asian-paints-products.json";

// --- High-End Animated Tooltip Component ---
const InfoTooltip = ({ text }: { text: string }) => {
  return (
    <div className="group relative inline-flex items-center justify-center ml-1.5 cursor-help">
      <Info className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-700 transition-colors" />
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 sm:w-60 p-2.5 bg-zinc-900 text-white text-xs rounded-lg shadow-xl opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
        {text}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45"></div>
      </div>
    </div>
  );
};

// --- Variant Templates ---
const TEMPLATES = {
  clothing: [
    { title: "Small (S)", sku: "", priceOverride: "", stockQuantity: "10", attachedImageIndex: -1 },
    { title: "Medium (M)", sku: "", priceOverride: "", stockQuantity: "10", attachedImageIndex: -1 },
    { title: "Large (L)", sku: "", priceOverride: "", stockQuantity: "10", attachedImageIndex: -1 },
    { title: "Extra Large (XL)", sku: "", priceOverride: "", stockQuantity: "10", attachedImageIndex: -1 },
  ],
  paint: [
    { title: "1 Liter", sku: "", priceOverride: "", stockQuantity: "20", attachedImageIndex: -1 },
    { title: "4 Liters", sku: "", priceOverride: "", stockQuantity: "15", attachedImageIndex: -1 },
    { title: "10 Liters", sku: "", priceOverride: "", stockQuantity: "10", attachedImageIndex: -1 },
    { title: "20 Liters", sku: "", priceOverride: "", stockQuantity: "5", attachedImageIndex: -1 },
  ]
};

export default function NewProductPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "", // NEW: Brand / Vendor
    description: "",
    basePrice: "",
    compareAtPrice: "",
    status: "draft",
    categoryId: "",
  });

  const [specs, setSpecs] = useState([
    { label: "Finish", value: "Smooth Matte / Velvet" },
    { label: "Coverage", value: "120 - 140 sq.ft/liter" },
  ]);

  // Enhanced Variant State
  const [variants, setVariants] = useState([
    { title: "Default Option", sku: "", priceOverride: "", stockQuantity: "10", attachedImageIndex: -1 }
  ]);
  
  // Bulk Edit State
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");

  useEffect(() => {
    getCategoriesAction(storeSlug).then((data) => setCategories(data));
  }, [storeSlug]);

  // --- Handlers ---
  const handleApplyTemplate = (type: keyof typeof TEMPLATES) => {
    setVariants(TEMPLATES[type].map(t => ({ ...t }))); // Deep copy
    setSelectedVariants(new Set());
  };

  const toggleVariantSelection = (index: number) => {
    const newSet = new Set(selectedVariants);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedVariants(newSet);
  };

  const selectAllVariants = () => {
    if (selectedVariants.size === variants.length) setSelectedVariants(new Set());
    else setSelectedVariants(new Set(variants.map((_, i) => i)));
  };

  const applyBulkEdit = () => {
    const newVariants = [...variants];
    selectedVariants.forEach(index => {
      if (bulkPrice !== "") newVariants[index].priceOverride = bulkPrice;
      if (bulkStock !== "") newVariants[index].stockQuantity = bulkStock;
    });
    setVariants(newVariants);
    setBulkPrice("");
    setBulkStock("");
    setSelectedVariants(new Set());
  };

  const handleSave = async () => {
    if (!formData.name || !formData.basePrice) {
      alert("Please provide at least a Product Title and Base Price.");
      return;
    }
    setIsLoading(true);
    
    // Will be sent to backend. Action update required next.
    const result = await createProductAction(storeSlug, {
      ...formData,
      images,
      specifications: specs.filter(s => s.label.trim() !== ""), 
      variants: variants.filter(v => v.title.trim() !== ""),
    });

    if (result.success) router.push(`/${storeSlug}/dashboard/products`);
    else {
      alert(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-28 sm:pb-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Button variant="outline" size="icon" asChild className="h-9 w-9 bg-white shrink-0">
            <Link href={`/${storeSlug}/dashboard/products`}>
              <ArrowLeft className="h-4 w-4 text-zinc-600" />
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">Add Product</h1>
        </div>
        
        <div className="flex gap-2">
          {/* TEMPORARY BULK IMPORT BUTTON */}
          <Button 
            type="button"
            onClick={async () => {
              if(confirm("Start bulk import? This will take a few seconds.")) {
                setIsLoading(true);
                // We pass the imported JSON directly into the action
                const res = await bulkImportAsianPaintsAction(storeSlug, asianPaintsData);
                setIsLoading(false);
                if(res.success) {
                  alert(`Success! Imported ${res.count} products.`);
                  router.push(`/${storeSlug}/dashboard/products`);
                } else {
                  alert(`Error: ${res.error}`);
                }
              }
            }} 
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Run Bulk Import
          </Button>

          <Button onClick={handleSave} disabled={isLoading} className="hidden sm:flex bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Product
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Info */}
          <Card className="shadow-sm border-zinc-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-zinc-800 to-zinc-400"></div>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                Basic Details
                <InfoTooltip text="This is the primary information customers will see on the product page." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-900 font-medium">Product Title</Label>
                <Input 
                  id="name" placeholder="e.g. Minimalist Cotton T-Shirt" className="bg-white"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-zinc-900 font-medium flex items-center">
                  Brand / Manufacturer
                  <InfoTooltip text="Use this to categorize products by their parent company (e.g., Asian Paints, Birla Opus). Customers can filter by this." />
                </Label>
                <Input 
                  id="brand" placeholder="e.g. Asian Paints" className="bg-white"
                  value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-900 font-medium">Description</Label>
                <textarea 
                  id="description" rows={4} placeholder="Describe the product..." 
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Baseline */}
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                Baseline Pricing
                <InfoTooltip text="This is the default price. If a specific size or color costs more, you can override this price in the Variants section below." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label className="text-zinc-900 font-medium">Base Price</Label>
                  <span className="absolute left-3 top-[28px] text-zinc-500 text-sm">₹</span>
                  <Input 
                    type="number" placeholder="0.00" className="pl-7 bg-white"
                    value={formData.basePrice} onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2 relative">
                  <Label className="text-zinc-900 font-medium flex items-center">
                    Compare-at Price
                    <InfoTooltip text="Enter a higher number here to show a 'strikethrough' discount price on the storefront." />
                  </Label>
                  <span className="absolute left-3 top-[28px] text-zinc-500 text-sm">₹</span>
                  <Input 
                    type="number" placeholder="0.00" className="pl-7 bg-white"
                    value={formData.compareAtPrice} onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-lg flex items-center">
                  Product Images
                  <InfoTooltip text="Upload all product photos here. Once uploaded, you can link specific photos to specific variants below." />
                </CardTitle>
                <CardDescription className="mt-1">First image becomes the cover.</CardDescription>
              </div>
              <div className="px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-md text-xs font-semibold tracking-wide">
                {images.length} / 4
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {images.map((url, index) => (
                    <div key={index} className={`relative rounded-xl overflow-hidden border border-zinc-200 group bg-zinc-50 aspect-square ${index === 0 ? "col-span-2 row-span-2" : ""}`}>
                      <img src={url} alt={`Upload ${index + 1}`} className="object-cover w-full h-full" />
                      {index === 0 && <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">Cover</div>}
                      <button type="button" onClick={() => setImages(images.filter((_, i) => i !== index))} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 shadow-sm">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {images.length < 4 && (
                <UploadDropzone
                  endpoint="productImage"
                  onClientUploadComplete={(res) => setImages((prev) => [...prev, ...res.map(f => f.url)].slice(0, 4))}
                  onUploadError={(e) => alert(`Upload failed: ${e.message}`)}
                  className="border-2 border-dashed border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer rounded-xl py-6"
                />
              )}
            </CardContent>
          </Card>

          {/* Variants & Inventory Engine */}
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    Variants & Inventory
                    <InfoTooltip text="Create different versions of this product (Sizes, Colors, Volumes). Each can have its own stock level and specific image." />
                  </CardTitle>
                </div>
                
                {/* Template Quick Actions */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-medium flex items-center mr-1">
                    <Wand2 className="h-3 w-3 mr-1" /> Quick Add:
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleApplyTemplate('clothing')} className="h-7 text-[10px] sm:text-xs">
                    Sizes (S-XL)
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleApplyTemplate('paint')} className="h-7 text-[10px] sm:text-xs">
                    Volumes (1L-20L)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 space-y-4 pt-4 sm:pt-6">
              
              {/* Bulk Edit Toolbar (Appears when items selected) */}
              {selectedVariants.size > 0 && (
                <div className="mx-4 sm:mx-0 p-3 bg-zinc-900 rounded-lg flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <span className="text-white text-sm font-medium mr-auto">
                    {selectedVariants.size} variant(s) selected
                  </span>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input 
                      placeholder="New Price" type="number" 
                      className="h-8 w-24 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 text-sm"
                      value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)}
                    />
                    <Input 
                      placeholder="Stock Qty" type="number" 
                      className="h-8 w-24 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400 text-sm"
                      value={bulkStock} onChange={(e) => setBulkStock(e.target.value)}
                    />
                    <Button type="button" size="sm" onClick={applyBulkEdit} className="h-8 bg-white text-zinc-900 hover:bg-zinc-200">
                      Apply
                    </Button>
                  </div>
                </div>
              )}

              {/* Desktop Table Header */}
              <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2">
                <div className="col-span-1 flex justify-center">
                  <button onClick={selectAllVariants} className="text-zinc-400 hover:text-zinc-900"><CheckSquare className="h-4 w-4" /></button>
                </div>
                <div className="col-span-3">Option Name</div>
                <div className="col-span-2">Price Override</div>
                <div className="col-span-2">Stock</div>
                <div className="col-span-3">Attach Image</div>
                <div className="col-span-1"></div>
              </div>

              {/* Variant Rows */}
              <div className="space-y-4 sm:space-y-2 px-4 pb-4 sm:p-0">
                {variants.map((variant, index) => (
                  <div key={index} className={`grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 sm:p-2 border rounded-lg sm:rounded-md items-center transition-colors ${selectedVariants.has(index) ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 bg-white'}`}>
                    
                    <div className="hidden sm:flex col-span-1 justify-center">
                      <input type="checkbox" checked={selectedVariants.has(index)} onChange={() => toggleVariantSelection(index)} className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer" />
                    </div>
                    
                    <div className="sm:col-span-3 space-y-1.5 sm:space-y-0">
                      <Label className="sm:hidden text-xs text-zinc-500 font-medium">Option Name</Label>
                      <Input placeholder="e.g. 1 Liter / XL" value={variant.title} onChange={(e) => { const v = [...variants]; v[index].title = e.target.value; setVariants(v); }} className="h-9 bg-white" />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5 sm:space-y-0 relative">
                      <Label className="sm:hidden text-xs text-zinc-500 font-medium">Override Price (Blank = Base)</Label>
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm hidden sm:block">₹</span>
                      <Input type="number" placeholder="Base" value={variant.priceOverride} onChange={(e) => { const v = [...variants]; v[index].priceOverride = e.target.value; setVariants(v); }} className="h-9 sm:pl-7 bg-white" />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5 sm:space-y-0 relative">
                      <Label className="sm:hidden text-xs text-zinc-500 font-medium">Stock Qty</Label>
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 hidden sm:block" />
                      <Input type="number" placeholder="0" value={variant.stockQuantity} onChange={(e) => { const v = [...variants]; v[index].stockQuantity = e.target.value; setVariants(v); }} className="h-9 sm:pl-8 bg-white" />
                    </div>

                    <div className="sm:col-span-3 space-y-1.5 sm:space-y-0">
                      <Label className="sm:hidden text-xs text-zinc-500 font-medium flex items-center">
                        Attach Image 
                        <InfoTooltip text="Select which uploaded image matches this specific variant." />
                      </Label>
                      <select 
                        value={variant.attachedImageIndex} 
                        onChange={(e) => { const v = [...variants]; v[index].attachedImageIndex = parseInt(e.target.value); setVariants(v); }}
                        className="w-full h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 disabled:bg-zinc-50 disabled:text-zinc-400"
                        disabled={images.length === 0}
                      >
                        <option value={-1}>No specific image</option>
                        {images.map((_, imgIdx) => (
                          <option key={imgIdx} value={imgIdx}>Image {imgIdx + 1} {imgIdx === 0 ? '(Cover)' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-1 flex justify-end absolute top-3 right-3 sm:static">
                      <Button type="button" variant="ghost" size="icon" disabled={variants.length === 1} onClick={() => setVariants(variants.filter((_, i) => i !== index))} className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4 sm:px-0 sm:pb-0">
                <Button type="button" variant="outline" onClick={() => setVariants([...variants, { title: "", sku: "", priceOverride: "", stockQuantity: "0", attachedImageIndex: -1 }])} className="w-full border-dashed text-zinc-600 hover:bg-zinc-50">
                  <Plus className="h-4 w-4 mr-2" /> Add Custom Variant Row
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ... (Specifications Card Remains the Same) ... */}
        </div>

        {/* Right Column: Status & Category */}
        <div className="space-y-6">
          <Card className="shadow-sm border-zinc-200 bg-zinc-50/30">
            <CardHeader>
              <CardTitle className="text-lg">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <Label className="text-zinc-900 font-medium">Status</Label>
                <select 
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active (Visible)</option>
                  <option value="draft">Draft (Hidden)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-900 font-medium flex items-center">
                  Category
                  <InfoTooltip text="Groups this item into storefront collections." />
                </Label>
                <select 
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky Save Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40">
        <Button onClick={handleSave} disabled={isLoading} className="w-full bg-zinc-950 text-white h-12 rounded-xl">
          {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
          Save Product
        </Button>
      </div>

    </div>
  );
}