"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  DollarSign, 
  Plus, 
  Key, 
  Copy, 
  Check, 
  Search,
  Loader2,
  Pencil,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { deployTenantAction, getTenantsAction, updateTenantAction } from "./actions";

type StoreRecord = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  apiKey: string;
  isQuoteBased: boolean; // NEW
  status: string | null;
  plan: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: Date | string;
};

export default function SuperAdminOverview() {
  const [stores, setStores] = useState<StoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  
  // Modals
  const [activeKeyModal, setActiveKeyModal] = useState<StoreRecord | null>(null);
  const [activeEditModal, setActiveEditModal] = useState<StoreRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State (Create)
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSlug, setNewStoreSlug] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newCurrency, setNewCurrency] = useState("INR");
  const [newPlan, setNewPlan] = useState("Starter");
  const [newIsQuoteBased, setNewIsQuoteBased] = useState("false"); // NEW

  // Form State (Edit)
  const [editStoreName, setEditStoreName] = useState("");
  const [editStoreSlug, setEditStoreSlug] = useState("");
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPassword, setEditAdminPassword] = useState(""); // Blank unless changing
  const [editCurrency, setEditCurrency] = useState("INR");
  const [editPlan, setEditPlan] = useState("Starter");
  const [editStatus, setEditStatus] = useState("Active");
  const [editIsQuoteBased, setEditIsQuoteBased] = useState("false"); // NEW

  // Fetch real data on component mount
  const fetchStores = async () => {
    setIsLoading(true);
    const res = await getTenantsAction();
    if (res.success && res.data) {
      // @ts-ignore
      setStores(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Populate Edit Modal when opened
  useEffect(() => {
    if (activeEditModal) {
      setEditStoreName(activeEditModal.name || "");
      setEditStoreSlug(activeEditModal.slug || "");
      setEditAdminName(activeEditModal.ownerName || "");
      setEditAdminEmail(activeEditModal.ownerEmail || "");
      setEditAdminPassword(""); // Always empty for security, only update if typed
      setEditCurrency(activeEditModal.currency || "INR");
      setEditPlan(activeEditModal.plan || "Starter");
      setEditStatus(activeEditModal.status || "Active");
      setEditIsQuoteBased(activeEditModal.isQuoteBased ? "true" : "false"); // Populate toggle
    }
  }, [activeEditModal]);

  const handleNameChange = (name: string, isEdit: boolean = false) => {
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    if (isEdit) {
      setEditStoreName(name);
      setEditStoreSlug(slug);
    } else {
      setNewStoreName(name);
      setNewStoreSlug(slug);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreSlug || !newAdminEmail || !newAdminName) return;
    setIsDeploying(true);
    
    const res = await deployTenantAction({
      name: newStoreName, slug: newStoreSlug, adminName: newAdminName,
      adminEmail: newAdminEmail, adminPassword: newAdminPassword,
      currency: newCurrency, plan: newPlan,
      isQuoteBased: newIsQuoteBased === "true" // NEW
    });

    if (res.success) {
      await fetchStores();
      setIsCreateOpen(false);
      setNewStoreName(""); setNewStoreSlug(""); setNewAdminName("");
      setNewAdminEmail(""); setNewAdminPassword("");
    } else {
      alert("Failed to provision tenant.");
    }
    setIsDeploying(false);
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditModal) return;
    setIsDeploying(true);

    const res = await updateTenantAction({
      storeId: activeEditModal.id,
      name: editStoreName,
      slug: editStoreSlug,
      adminName: editAdminName,
      adminEmail: editAdminEmail,
      adminPassword: editAdminPassword, // If blank, action ignores it
      currency: editCurrency,
      plan: editPlan,
      status: editStatus,
      isQuoteBased: editIsQuoteBased === "true" // NEW
    });

    if (res.success) {
      await fetchStores();
      setActiveEditModal(null);
    } else {
      alert("Failed to update store details.");
    }
    setIsDeploying(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const filteredStores = stores.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.slug?.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 w-full">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Platform Instances & Tenants
          </h1>
          <p className="text-sm text-zinc-500">
            Create client stores, dispatch isolated tenant admin credentials, and manage system keys.
          </p>
        </div>

        {/* Create Store Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm">
              <Plus className="h-4 w-4" />
              Create Client Store
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] p-0 bg-white border-zinc-200 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[85vh]">
            <form onSubmit={handleCreateStore} className="flex flex-col h-full overflow-hidden">
              <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-white shrink-0">
                <DialogTitle className="text-lg font-semibold text-zinc-950">Deploy New Client Store</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Provision a secure, isolated database tenant and generate initial admin credentials.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-6">
                  {/* Create Form Fields */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-zinc-900">1. Business Identity</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label className="text-xs text-zinc-700">Brand / Store Name</Label>
                        <Input placeholder="e.g. Modern Luxe Boutique" value={newStoreName} onChange={(e) => handleNameChange(e.target.value)} className="bg-zinc-50/50 border-zinc-200 text-sm" required disabled={isDeploying} />
                      </div>
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label className="text-xs text-zinc-700">Tenant Slug (URL Route)</Label>
                        <Input placeholder="modern-luxe" value={newStoreSlug} onChange={(e) => setNewStoreSlug(e.target.value)} className="bg-zinc-50/50 border-zinc-200 font-mono text-xs" required disabled={isDeploying} />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-zinc-100" />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-zinc-900">2. Primary Administrator</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label className="text-xs text-zinc-700">Admin Full Name</Label>
                        <Input placeholder="John Doe" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} className="bg-zinc-50/50 border-zinc-200 text-sm" required disabled={isDeploying} />
                      </div>
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label className="text-xs text-zinc-700">Login ID (Email Address)</Label>
                        <Input type="email" placeholder="john@brand.com" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="bg-zinc-50/50 border-zinc-200 text-sm" required disabled={isDeploying} />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-xs text-zinc-700">Initial Temporary Password</Label>
                        <Input type="text" placeholder="Generates temporary login credential" value={newAdminPassword} onChange={(e) => setNewAdminPassword(e.target.value)} className="bg-zinc-50/50 border-zinc-200 font-mono text-xs" required disabled={isDeploying} />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-zinc-100" />

                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-zinc-900">3. SaaS Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label className="text-xs text-zinc-700">Store Type</Label>
                        <Select value={newIsQuoteBased} onValueChange={setNewIsQuoteBased} disabled={isDeploying}>
                          <SelectTrigger className="bg-zinc-50/50 border-zinc-200 text-sm font-medium text-blue-700"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Standard E-Commerce</SelectItem>
                            <SelectItem value="true">Quote / B2B Request</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label className="text-xs text-zinc-700">Default Currency</Label>
                        <Select value={newCurrency} onValueChange={setNewCurrency} disabled={isDeploying}>
                          <SelectTrigger className="bg-zinc-50/50 border-zinc-200 text-sm font-mono"><SelectValue placeholder="INR" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label className="text-xs text-zinc-700">Subscription Tier</Label>
                        <Select value={newPlan} onValueChange={setNewPlan} disabled={isDeploying}>
                          <SelectTrigger className="bg-zinc-50/50 border-zinc-200 text-sm"><SelectValue placeholder="Starter" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Starter">Starter Plan</SelectItem>
                            <SelectItem value="Growth">Growth Plan</SelectItem>
                            <SelectItem value="Premium">Premium Plan</SelectItem>
                            <SelectItem value="Enterprise">Enterprise Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="text-xs" disabled={isDeploying}>Cancel</Button>
                <Button type="submit" className="bg-zinc-950 text-white hover:bg-zinc-800 text-xs w-[140px]" disabled={isDeploying}>
                  {isDeploying ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Provision Tenant"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-xs border-zinc-200/80 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Client Stores</CardTitle>
            <Building2 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900">{isLoading ? "-" : stores.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Multi-tenant stores connected to MySQL</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-zinc-200/80 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tenant Admins</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900">{isLoading ? "-" : stores.filter(s => s.ownerEmail).length}</div>
            <p className="text-xs text-zinc-500 mt-1">Authorized client management seats</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-zinc-200/80 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Default Currency</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-zinc-900">INR (₹)</div>
            <p className="text-xs text-zinc-500 mt-1">Universal base transaction unit</p>
          </CardContent>
        </Card>
      </div>

      {/* Stores Directory with Real-time Search */}
      <Card className="shadow-xs border-zinc-200/80 bg-white overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-zinc-950">Tenant Directory</CardTitle>
            <p className="text-xs text-zinc-500">Filter by name, slug, or administrative contact.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input placeholder="Search stores or admins..." className="pl-9 text-xs bg-white border-zinc-200" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow>
                  <TableHead className="w-[200px] pl-6">Client Store</TableHead>
                  <TableHead>Primary Admin</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Client Portal Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Access Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mx-auto" />
                      <p className="text-xs text-zinc-500 mt-2">Connecting to cluster...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-xs text-zinc-500">No client stores found.</TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((store) => {
                    const loginUrl = `http://localhost:3000/${store.slug}/login`;
                    const isCopied = copiedLink === store.id;

                    return (
                      <TableRow key={store.id} className="hover:bg-zinc-50/80 transition-colors group">
                        <TableCell className="pl-6">
                          <p className="font-semibold text-zinc-900">{store.name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{store.slug}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-zinc-900">{store.ownerName || "Pending Invite"}</p>
                          <p className="text-xs text-zinc-500">{store.ownerEmail || "N/A"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 text-[10px] uppercase font-semibold">
                            {store.isQuoteBased ? "Quote" : "Retail"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button onClick={() => copyToClipboard(loginUrl, store.id)} className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-2 py-1 rounded-md transition-colors w-fit" title="Click to copy full portal URL">
                            <span>/{store.slug}/login</span>
                            {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-zinc-400" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-medium uppercase tracking-wider ${
                            store.status === "Active" ? "text-emerald-700 bg-emerald-50 border-emerald-200/60" : "text-amber-700 bg-amber-50 border-amber-200/60"
                          }`}>
                            {store.status || "Provisioning"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 space-x-1.5">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100" onClick={() => setActiveEditModal(store)} title="Edit Store">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100" onClick={() => setActiveKeyModal(store)} title="View API Key">
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button size="sm" className="h-8 text-xs bg-zinc-950 text-white hover:bg-zinc-800 shadow-sm ml-1" onClick={() => window.open(`/${store.slug}/login`, "_blank")}>
                            Enter Portal
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* --- MODALS --- */}

      {/* Edit Store Dialog */}
      <Dialog open={!!activeEditModal} onOpenChange={(open) => !open && setActiveEditModal(null)}>
        <DialogContent className="sm:max-w-[700px] p-0 bg-white border-zinc-200 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[85vh]">
          <form onSubmit={handleUpdateStore} className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-zinc-100 bg-white shrink-0">
              <DialogTitle className="text-lg font-semibold text-zinc-950 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-zinc-500" /> Configure Tenant: {activeEditModal?.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Update business identity, change admin login credentials, or adjust billing plans.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                
                {/* Store Details */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-zinc-900">1. Business Identity</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-zinc-700">Brand / Store Name</Label>
                      <Input value={editStoreName} onChange={(e) => handleNameChange(e.target.value, true)} className="bg-white border-zinc-200 text-sm focus-visible:ring-1 focus-visible:ring-zinc-950" required disabled={isDeploying} />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-zinc-700">Tenant Slug (URL Route)</Label>
                      <Input value={editStoreSlug} onChange={(e) => setEditStoreSlug(e.target.value)} className="bg-zinc-50 border-zinc-200 font-mono text-xs text-zinc-500 cursor-not-allowed" disabled={true} title="Changing slugs breaks existing links." />
                    </div>
                  </div>
                </div>

                <Separator className="bg-zinc-100" />

                {/* Admin Credentials */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-zinc-900">2. Primary Administrator</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-zinc-700">Admin Full Name</Label>
                      <Input value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="bg-white border-zinc-200 text-sm focus-visible:ring-1 focus-visible:ring-zinc-950" required disabled={isDeploying} />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-zinc-700">Login ID (Email Address)</Label>
                      <Input type="email" value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="bg-white border-zinc-200 text-sm focus-visible:ring-1 focus-visible:ring-zinc-950" required disabled={isDeploying} />
                    </div>
                    <div className="space-y-1.5 col-span-2 relative">
                      <Label className="text-xs text-zinc-700">Reset Password (Leave blank to keep current)</Label>
                      <Input type="text" placeholder="Enter new password to override..." value={editAdminPassword} onChange={(e) => setEditAdminPassword(e.target.value)} className="bg-white border-zinc-200 font-mono text-xs focus-visible:ring-1 focus-visible:ring-zinc-950" disabled={isDeploying} />
                    </div>
                  </div>
                </div>

                <Separator className="bg-zinc-100" />

                {/* Platform Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-zinc-900">3. SaaS Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-zinc-700">Store Type</Label>
                      <Select value={editIsQuoteBased} onValueChange={setEditIsQuoteBased} disabled={isDeploying}>
                        <SelectTrigger className="bg-white border-zinc-200 text-sm font-medium text-blue-700 focus:ring-1 focus:ring-zinc-950"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Standard E-Commerce</SelectItem>
                          <SelectItem value="true">Quote / B2B Request</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-zinc-700">Account Status</Label>
                      <Select value={editStatus} onValueChange={setEditStatus} disabled={isDeploying}>
                        <SelectTrigger className="bg-white border-zinc-200 text-sm focus:ring-1 focus:ring-zinc-950"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-zinc-700">Subscription Tier</Label>
                      <Select value={editPlan} onValueChange={setEditPlan} disabled={isDeploying}>
                        <SelectTrigger className="bg-white border-zinc-200 text-sm focus:ring-1 focus:ring-zinc-950"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Starter">Starter Plan</SelectItem>
                          <SelectItem value="Growth">Growth Plan</SelectItem>
                          <SelectItem value="Premium">Premium Plan</SelectItem>
                          <SelectItem value="Enterprise">Enterprise Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 shrink-0">
              <Button type="button" variant="outline" onClick={() => setActiveEditModal(null)} className="text-xs bg-white" disabled={isDeploying}>Cancel</Button>
              <Button type="submit" className="bg-zinc-950 text-white hover:bg-zinc-800 text-xs w-[140px] shadow-sm" disabled={isDeploying}>
                {isDeploying ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View API Key Modal */}
      <Dialog open={!!activeKeyModal} onOpenChange={(open) => !open && setActiveKeyModal(null)}>
        <DialogContent className="sm:max-w-[460px] bg-white border border-zinc-200 shadow-2xl rounded-xl">
          <DialogHeader className="space-y-1.5 pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-zinc-950">
              <Key className="h-4 w-4" /> Store API Credentials
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Backend API key for <strong className="text-zinc-900">{activeKeyModal?.name}</strong>. Used by custom client storefronts to communicate with your SaaS engine.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-xs font-medium text-zinc-700">Live Secret Key</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={activeKeyModal?.apiKey || ""} className="font-mono text-xs bg-zinc-50 text-zinc-800 border-zinc-200" />
              <Button variant="outline" size="sm" className="bg-white border-zinc-200" onClick={() => { if (activeKeyModal) { copyToClipboard(activeKeyModal.apiKey, "modal_key"); }}}>
                {copiedLink === "modal_key" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter className="pt-2 border-t border-zinc-100">
            <Button className="bg-zinc-950 text-white hover:bg-zinc-800 text-xs" onClick={() => setActiveKeyModal(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}