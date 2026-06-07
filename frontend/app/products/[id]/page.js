"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { ShoppingCart, Heart, Star, MapPin, Gift, AlertCircle, Quote } from "lucide-react";
import Link from "next/link";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { apiRequest, addToCart, toggleWishlist, wishlist, user, addNotification } = useApp();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add to cart quantity state
  const [quantity, setQuantity] = useState(1);

  // New review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  async function loadProductDetails() {
    try {
      const { status, data } = await apiRequest(`/products/${id}`);
      if (status === 200 && data.success) {
        setProduct(data.product);
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setReviewCount(data.reviewCount);
      } else {
        addNotification("Product not found.", "error");
        router.push("/products");
      }
    } catch (err) {
      console.error("Fetch product details page error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProductDetails();
  }, [id]);

  const handleAddCart = () => {
    if (!product) return;
    addToCart(product, quantity);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      addNotification("Please sign in as a customer to write reviews.", "warning");
      router.push("/login");
      return;
    }
    if (user.role !== "customer") {
      addNotification("Only customer accounts can write reviews.", "warning");
      return;
    }
    if (!reviewComment.trim()) {
      addNotification("Please enter a review comment.", "warning");
      return;
    }

    setSubmittingReview(true);
    const { status, data } = await apiRequest("/orders/review", {
      method: "POST",
      body: JSON.stringify({
        productId: id,
        rating: reviewRating,
        comment: reviewComment,
      }),
    });
    setSubmittingReview(false);

    if (data.success) {
      addNotification("Review submitted successfully!", "success");
      setReviewComment("");
      loadProductDetails(); // Reload to refresh rating/reviews
    } else {
      addNotification(data.message || "Failed to submit review. You can only review items you purchased.", "error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-clay-100 rounded-2xl"></div>
          <div className="space-y-4">
            <div className="h-4 bg-clay-100 rounded w-1/4"></div>
            <div className="h-8 bg-clay-100 rounded w-3/4"></div>
            <div className="h-6 bg-clay-100 rounded w-1/2"></div>
            <div className="h-32 bg-clay-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const inWishlist = wishlist.some((item) => item.id === product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* 1. Main Info Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Product Image Showcase */}
        <div className="relative rounded-2xl border border-clay-200 bg-white overflow-hidden aspect-square shadow-md">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute top-4 left-4 px-3 py-1 text-xs font-bold bg-clay-800 text-white rounded-full">
            {product.category}
          </span>
        </div>

        {/* Product Details Actions */}
        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold text-terracotta-500 uppercase tracking-widest">
              {product.seller?.business_name}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-clay-950 mt-1">
              {product.name}
            </h1>
            
            {/* Rating Summary */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-0.5 text-terracotta-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4.5 w-4.5 ${
                      i < Math.round(averageRating) ? "fill-current" : "text-clay-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-clay-800">{averageRating || "No reviews"}</span>
              <span className="text-xs text-clay-500">({reviewCount} reviews)</span>
            </div>
          </div>

          <div className="py-4 border-y border-clay-200">
            <span className="text-3xl font-extrabold text-clay-950 font-serif">
              ₹{parseFloat(product.price).toFixed(2)}
            </span>
            <p className="text-xs text-clay-500 mt-1.5 flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-full ${product.stock > 0 ? "bg-forest-500" : "bg-terracotta-500"}`}></span>
              {product.stock > 0 ? `In Stock: ${product.stock} items left` : "Out of Stock"}
            </p>
          </div>

          <p className="text-sm text-clay-700 leading-relaxed">
            {product.description}
          </p>

          {/* Add to Cart Actions */}
          {product.stock > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-clay-200 rounded-lg overflow-hidden bg-clay-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-clay-700 hover:bg-clay-100 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-bold text-sm text-clay-900 w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 text-clay-700 hover:bg-clay-100 font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddCart}
                  className="flex-grow py-3.5 px-6 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Shopping Cart
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-3.5 rounded-xl border shadow-sm transition-all cursor-pointer ${
                    inWishlist
                      ? "bg-terracotta-50 border-terracotta-200 text-terracotta-500"
                      : "bg-white border-clay-200 text-clay-600 hover:text-terracotta-500"
                  }`}
                  title="Add to Wishlist"
                >
                  <Heart className="h-5 w-5 fill-current" />
                </button>
              </div>
            </div>
          )}

          {/* Trust points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-clay-100 p-4 rounded-xl border border-clay-200 text-xs font-semibold text-clay-700">
            <span className="flex items-center gap-1.5">🤝 Direct Artisan Income</span>
            <span className="flex items-center gap-1.5">📦 Custom Earthy Packaging</span>
          </div>
        </div>
      </div>

      {/* 2. Artisan Story Section (Heritage Spotlight) */}
      <section className="bg-clay-100 border border-clay-200 rounded-2xl p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-5">
          <Quote className="h-40 w-40" />
        </div>
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1 text-xs font-bold text-terracotta-600 bg-terracotta-50 border border-terracotta-100 px-3 py-1 rounded-full">
            <MapPin className="h-3 w-3" />
            {product.seller?.city}, {product.seller?.state}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-clay-950">
            The Story Behind: <span className="text-terracotta-500">{product.seller?.business_name}</span>
          </h2>
          <p className="text-sm sm:text-base text-clay-700 leading-relaxed italic">
            "{product.seller?.story}"
          </p>
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-clay-500">Craft Details</h4>
            <p className="text-sm font-semibold text-clay-800 mt-1">{product.seller?.craft_type}</p>
          </div>
        </div>
      </section>

      {/* 3. Reviews & Comments */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Review Submission Form */}
        <div className="bg-white border border-clay-200 rounded-2xl p-6 shadow-sm self-start space-y-4">
          <h3 className="font-serif font-bold text-lg text-clay-900 border-b border-clay-100 pb-3">
            Write a Review
          </h3>
          {user ? (
            user.role === "customer" ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-clay-500 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setReviewRating(stars)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            stars <= reviewRating ? "text-terracotta-500 fill-current" : "text-clay-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-clay-800 mb-1.5">Your Feedback</label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the texture, color, and finish. Did you like the packaging?"
                    className="block w-full border border-clay-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20 placeholder-clay-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-clay-300 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            ) : (
              <div className="bg-clay-50 border border-clay-200 rounded-xl p-4 text-xs font-medium text-clay-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-terracotta-500 shrink-0" />
                <span>Reviews are reserved for customers who bought this product.</span>
              </div>
            )
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-clay-500">Sign in to review your purchase and share your experience.</p>
              <Link
                href="/login"
                className="inline-block px-4 py-2 bg-clay-100 hover:bg-clay-200 text-xs font-bold text-clay-800 rounded-lg transition-colors border border-clay-200"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-serif font-bold text-xl text-clay-950 border-b border-clay-200 pb-3 flex items-center gap-2">
            Customer Feedback
            <span className="text-xs font-bold bg-clay-100 text-clay-700 px-2 py-0.5 rounded border border-clay-200">
              {reviews.length} reviews
            </span>
          </h3>

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-clay-200 p-6">
              <Star className="h-8 w-8 text-clay-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-clay-700">No reviews yet</p>
              <p className="text-xs text-clay-500 mt-0.5">Be the first to share feedback for this handcrafted craft!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white border border-clay-200 rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-clay-900 text-sm">{r.customer?.name || "Customer"}</h4>
                      <p className="text-[10px] text-clay-400 font-semibold uppercase tracking-wider">
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-0.5 text-terracotta-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < r.rating ? "fill-current" : "text-clay-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-clay-700 leading-relaxed">"{r.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
