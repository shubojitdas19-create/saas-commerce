"use client";

import { useState, useEffect, use } from "react";
import { Star, Eye, EyeOff, Trash2, MessageSquare, Loader2, X, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getAdminReviewsAction, 
  toggleReviewVisibilityAction, 
  replyToReviewAction, 
  deleteReviewAction 
} from "./actions";

type Review = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  location: string | null;
  rating: number;
  text: string;
  adminReply: string | null;
  isVisible: boolean;
  isVerified: boolean;
  createdAt: Date;
};

export default function AdminReviewsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = use(params);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    loadReviews();
  }, [storeSlug]);

  const loadReviews = async () => {
    setIsLoading(true);
    const res = await getAdminReviewsAction(storeSlug);
    if (res.success && res.data) {
      setReviews(res.data as Review[]);
    }
    setIsLoading(false);
  };

  const handleToggleVisibility = async (reviewId: string, currentStatus: boolean) => {
    setIsProcessing(reviewId);
    const res = await toggleReviewVisibilityAction(reviewId, !currentStatus, storeSlug);
    if (res.success) {
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, isVisible: !currentStatus } : r));
    }
    setIsProcessing(null);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently delete this review?")) return;
    
    setIsProcessing(reviewId);
    const res = await deleteReviewAction(reviewId, storeSlug);
    if (res.success) {
      setReviews(reviews.filter(r => r.id !== reviewId));
    }
    setIsProcessing(null);
  };

  const openReplyModal = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.adminReply || "");
    setReplyModalOpen(true);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    setIsProcessing("reply");
    const res = await replyToReviewAction(selectedReview.id, replyText, storeSlug);
    
    if (res.success) {
      setReviews(reviews.map(r => r.id === selectedReview.id ? { ...r, adminReply: replyText } : r));
      setReplyModalOpen(false);
    } else {
      alert("Failed to save reply.");
    }
    setIsProcessing(null);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
            Customer Reviews
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage feedback, reply to customers, and control storefront visibility.
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-zinc-200">
        <CardContent className="p-0">
          
          {/* =========================================
              DESKTOP VIEW (TABLE) 
              ========================================= */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap sm:whitespace-normal">
              <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-4 font-medium">Customer Details</th>
                  <th className="px-6 py-4 font-medium">Rating</th>
                  <th className="px-6 py-4 font-medium w-1/3">Feedback</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-zinc-500">
                      <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                      <p className="text-sm">Loading reviews...</p>
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-zinc-500 flex flex-col items-center">
                      <MessageCircle className="size-8 text-zinc-300 mb-3" />
                      <p className="text-sm font-medium text-zinc-900">No reviews yet</p>
                      <p className="text-xs">When customers submit feedback, it will appear here.</p>
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 align-top">
                        <div className="font-medium text-zinc-900">{review.customerName}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{review.email}</div>
                        <div className="text-xs text-zinc-500">{review.phone}</div>
                        <div className="text-[10px] text-zinc-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</div>
                      </td>
                      
                      <td className="px-6 py-4 align-top">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`size-4 ${i < review.rating ? "fill-current" : "fill-zinc-200 text-zinc-200"}`} />
                          ))}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 align-top">
                        <p className="text-zinc-700 text-sm line-clamp-3 leading-relaxed whitespace-normal min-w-[250px]">
                          "{review.text}"
                        </p>
                        {review.adminReply && (
                          <div className="mt-3 rounded-md bg-zinc-100 p-3 text-xs text-zinc-600 whitespace-normal border border-zinc-200">
                            <span className="font-bold text-zinc-900 block mb-1">Your Reply:</span>
                            {review.adminReply}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 align-top">
                        <button
                          onClick={() => handleToggleVisibility(review.id, review.isVisible)}
                          disabled={isProcessing === review.id}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                            review.isVisible 
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                        >
                          {review.isVisible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                          {review.isVisible ? "Visible" : "Hidden"}
                        </button>
                      </td>
                      
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openReplyModal(review)}
                            disabled={isProcessing === review.id}
                            className={`h-8 w-8 transition-colors ${
                              review.adminReply 
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800" 
                                : "text-zinc-600 hover:bg-zinc-100"
                            }`}
                            title="Reply to review"
                          >
                            <MessageSquare className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(review.id)}
                            disabled={isProcessing === review.id}
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
                            title="Delete review"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* =========================================
              MOBILE VIEW (STACKED CARDS) 
              ========================================= */}
          <div className="md:hidden divide-y divide-zinc-100">
            {isLoading ? (
              <div className="py-16 text-center text-zinc-500">
                <Loader2 className="mx-auto size-6 animate-spin mb-2" />
                <p className="text-sm">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 flex flex-col items-center">
                <MessageCircle className="size-8 text-zinc-300 mb-3" />
                <p className="text-sm font-medium text-zinc-900">No reviews yet</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-4 flex flex-col gap-4 bg-white">
                  
                  {/* Header: Name & Visibility Toggle */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-zinc-900 text-sm">{review.customerName}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{review.email} • {review.phone}</div>
                      <div className="text-[10px] text-zinc-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button
                      onClick={() => handleToggleVisibility(review.id, review.isVisible)}
                      disabled={isProcessing === review.id}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                        review.isVisible 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {review.isVisible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      <span className="hidden sm:inline">{review.isVisible ? "Visible" : "Hidden"}</span>
                    </button>
                  </div>

                  {/* Rating */}
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`size-4 ${i < review.rating ? "fill-current" : "fill-zinc-200 text-zinc-200"}`} />
                    ))}
                  </div>

                  {/* Feedback Text */}
                  <div>
                    <p className="text-zinc-700 text-sm leading-relaxed">
                      "{review.text}"
                    </p>
                    {review.adminReply && (
                      <div className="mt-3 rounded-md bg-zinc-100 p-3 text-xs text-zinc-600 border border-zinc-200">
                        <span className="font-bold text-zinc-900 block mb-1">Your Reply:</span>
                        {review.adminReply}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReplyModal(review)}
                      disabled={isProcessing === review.id}
                      className={`h-8 text-xs transition-colors ${
                        review.adminReply 
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                          : "text-zinc-600"
                      }`}
                    >
                      <MessageSquare className="size-3.5 mr-1.5" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(review.id)}
                      disabled={isProcessing === review.id}
                      className="h-8 w-8 text-red-600 border-red-100"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

        </CardContent>
      </Card>

      {/* Reply Modal */}
      {replyModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 border-none">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Reply to {selectedReview.customerName}</h3>
                <Button variant="ghost" size="icon" onClick={() => setReplyModalOpen(false)} className="h-8 w-8 text-zinc-400 hover:text-zinc-900 -mr-2">
                  <X className="size-4" />
                </Button>
              </div>
              
              <div className="mb-6 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 border border-zinc-100">
                <div className="mb-2 flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`size-3 ${i < selectedReview.rating ? "fill-current" : "fill-zinc-200 text-zinc-200"}`} />
                  ))}
                </div>
                <p className="italic">"{selectedReview.text}"</p>
              </div>

              <form onSubmit={handleReplySubmit}>
                <label className="mb-2 block text-sm font-semibold text-zinc-900">Your Public Reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your response here. This will be visible on the storefront..."
                  className="w-full resize-none rounded-lg border border-zinc-200 p-3 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 min-h-[120px]"
                />
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReplyModalOpen(false)}
                    className="text-zinc-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing === "reply"}
                    className="bg-zinc-950 text-white hover:bg-zinc-800"
                  >
                    {isProcessing === "reply" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <MessageSquare className="size-4 mr-2" />}
                    Save Reply
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}