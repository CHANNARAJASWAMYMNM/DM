"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { Search, SlidersHorizontal, Heart, ShoppingCart, RefreshCw, X } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const { apiRequest, addToCart, toggleWishlist, wishlist } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(["All", "Ceramics", "Textiles", "Woodwork", "Paintings"]);

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [sellerId, setSellerId] = useState(searchParams.get("sellerId") || "");

  // Load products based on filter changes
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      let endpoint = `/products?sortBy=${sortBy}`;
      
      if (category && category !== "All") endpoint += `&category=${category}`;
      if (search) endpoint += `&search=${encodeURIComponent(search)}`;
      if (minPrice) endpoint += `&minPrice=${minPrice}`;
      if (maxPrice) endpoint += `&maxPrice=${maxPrice}`;
      if (sellerId) endpoint += `&sellerId=${sellerId}`;

      try {
        const { data } = await apiRequest(endpoint);
        if (data.success) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();

    // Update query parameters in address bar
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category && category !== "All") params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sortBy) params.set("sortBy", sortBy);
    if (sellerId) params.set("sellerId", sellerId);
    
    router.replace(`/products?${params.toString()}`, { scroll: false });

  }, [category, search, minPrice, maxPrice, sortBy, sellerId]);

  const handleClearFilters = () => {
    setSearch("");
    setCategory("All");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setSellerId("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* 1. Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0 bg-white border border-clay-200 rounded-2xl p-6 shadow-sm self-start">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold font-serif text-lg text-clay-900 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-terracotta-500" />
              Filters
            </h3>
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-terracotta-500 hover:text-terracotta-600 transition-colors flex items-center gap-0.5"
            >
              Reset
            </button>
          </div>

          <div className="space-y-6">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-clay-500 mb-3">
                Craft Category
              </label>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      category === cat
                        ? "bg-terracotta-500 text-white shadow-sm"
                        : "text-clay-700 hover:bg-clay-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-clay-500 mb-3">
                Price Range (₹)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border border-clay-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border border-clay-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                />
              </div>
            </div>

            {/* Sort Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-clay-500 mb-3">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-clay-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
            
            {/* Active Seller Banner */}
            {sellerId && (
              <div className="bg-clay-100 border border-clay-200 rounded-xl p-4 text-xs font-medium flex items-center justify-between">
                <span>Filtering by Artisan</span>
                <button onClick={() => setSellerId("")} className="p-0.5 hover:bg-clay-200 rounded">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* 2. Main Product Grid */}
        <section className="flex-grow space-y-6">
          {/* Top Bar (Search + Info) */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white border border-clay-200 rounded-2xl p-4 shadow-sm">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-clay-400">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Search handmade items, street crafts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-11 pr-4 py-2.5 border border-clay-200 rounded-xl bg-clay-50/20 text-clay-950 placeholder-clay-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-sm"
              />
            </div>
            <p className="text-sm text-clay-600 font-medium whitespace-nowrap">
              Showing <span className="text-clay-900 font-bold">{products.length}</span> items
            </p>
          </div>

          {/* Grid list */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-clay-200 p-4 space-y-4 animate-pulse">
                  <div className="aspect-square bg-clay-100 rounded-xl"></div>
                  <div className="h-4 bg-clay-100 rounded w-2/3"></div>
                  <div className="h-3 bg-clay-100 rounded w-1/2"></div>
                  <div className="h-6 bg-clay-100 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-clay-200 p-8">
              <h3 className="font-bold font-serif text-xl text-clay-800">No crafts match your criteria</h3>
              <p className="text-sm text-clay-500 mt-1">Try adjusting your category selection, search terms, or price filters.</p>
              <button
                onClick={handleClearFilters}
                className="mt-6 px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-lg text-sm transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {products.map((p) => {
                const inWishlist = wishlist.some((item) => item.id === p.id);
                return (
                  <div
                    key={p.id}
                    className="group relative bg-white border border-clay-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Image */}
                    <div className="relative aspect-square w-full bg-clay-50 overflow-hidden">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => toggleWishlist(p)}
                        className={`absolute top-3 right-3 p-2 rounded-full border shadow-sm transition-colors cursor-pointer ${
                          inWishlist 
                            ? "bg-terracotta-50 border-terracotta-200 text-terracotta-500" 
                            : "bg-white border-clay-200 text-clay-400 hover:text-terracotta-500"
                        }`}
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                      <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-clay-800/80 text-white backdrop-blur-xs">
                        {p.category}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <p className="text-xs text-clay-500 font-bold uppercase tracking-wider">
                          {p.seller?.business_name || "Artisan Shop"}
                        </p>
                        <Link href={`/products/${p.id}`} className="block mt-1">
                          <h3 className="font-serif font-bold text-clay-900 group-hover:text-terracotta-500 transition-colors line-clamp-1 text-base">
                            {p.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-clay-500 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-4 pt-4 border-t border-clay-100 flex items-center justify-between">
                        <span className="text-lg font-bold text-clay-950 font-serif">
                          ₹{parseFloat(p.price).toFixed(2)}
                        </span>
                        
                        {p.stock > 0 ? (
                          <button
                            onClick={() => addToCart(p, 1)}
                            className="p-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                            title="Add to Cart"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span>Add</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-terracotta-600 bg-terracotta-50 px-2 py-1 rounded">
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
