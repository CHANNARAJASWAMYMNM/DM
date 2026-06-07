"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import { ArrowRight, ShoppingBag, Gift, Heart, HelpCircle, Star, Quote } from "lucide-react";

export default function HomePage() {
  const { apiRequest, toggleWishlist, wishlist } = useApp();
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const prodRes = await apiRequest("/products?limit=4");
        if (prodRes.data.success) {
          setProducts(prodRes.data.products.slice(0, 4));
        }

        const sellerRes = await apiRequest("/sellers");
        if (sellerRes.data.success) {
          setSellers(sellerRes.data.sellers.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load homepage data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = [
    { name: "Ceramics", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=400", desc: "Clay pottery & jars" },
    { name: "Textiles", image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=400", desc: "Handwoven fabrics" },
    { name: "Woodwork", image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=400", desc: "Hand-carved wood decor" },
    { name: "Paintings", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400", desc: "Traditional art" },
  ];

  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. Hero Section */}
      <section className="relative bg-clay-100 py-24 sm:py-32 overflow-hidden border-b border-clay-200">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          {/* Subtle background decoration */}
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-terracotta-400 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-forest-500 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-terracotta-100 text-terracotta-800 border border-terracotta-200">
                ⭐ 100% Traditional & Handcrafted
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-serif text-clay-900 leading-tight">
                Crafts with a <span className="text-terracotta-500">Soul</span>,<br />
                Stories with a <span className="text-forest-500">Heart</span>.
              </h1>
              <p className="text-base sm:text-lg text-clay-700 max-w-xl leading-relaxed">
                Connect directly with street artisans, clay sculptors, and heritage weavers. We bypass corporate middlemen to ensure 90% of every sale goes directly to the creator.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/products"
                  className="px-6 py-4 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Explore Shop
                </Link>
                <Link
                  href="/login?register=true&role=seller"
                  className="px-6 py-4 bg-white hover:bg-clay-50 border border-clay-300 text-clay-800 font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  Join as Artisan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Clay Pottery Hero Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative max-w-md w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600"
                  alt="Artisan sculpting clay vase"
                  className="object-cover w-full h-full"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-clay-950/80 to-transparent p-6 text-white">
                  <p className="text-xs uppercase tracking-widest text-terracotta-300 font-bold">Featured Story</p>
                  <h3 className="text-lg font-bold font-serif mt-1">Suresh Kumar, Clay Sculptor</h3>
                  <p className="text-xs text-clay-200 mt-1">Crafting terracotta cookware in Kumhar Gram for 34 years.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-bold font-serif mb-3">Shop by Craft</h2>
          <p className="text-sm text-clay-600">
            Explore heritage crafts from diverse regions, crafted using sustainable local materials.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((c, i) => (
            <Link
              key={i}
              href={`/products?category=${c.name}`}
              className="group flex flex-col bg-white rounded-2xl border border-clay-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-clay-100">
                <img
                  src={c.image}
                  alt={c.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-bold font-serif text-base text-clay-900 group-hover:text-terracotta-500 transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-xs text-clay-500 mt-0.5">{c.desc}</p>
                </div>
                <div className="text-xs font-bold text-terracotta-500 mt-3 flex items-center gap-1">
                  View Category <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold font-serif mb-3">Latest Arrivals</h2>
            <p className="text-sm text-clay-600">
              Each item is one-of-a-kind and handmade. Limited stock available.
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1 transition-colors"
          >
            See All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-clay-200 p-4 space-y-4 animate-pulse">
                <div className="aspect-square bg-clay-100 rounded-xl"></div>
                <div className="h-4 bg-clay-100 rounded w-2/3"></div>
                <div className="h-3 bg-clay-100 rounded w-1/2"></div>
                <div className="h-6 bg-clay-100 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-clay-200 p-8">
            <Gift className="h-12 w-12 text-clay-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-clay-800">No products uploaded yet</h3>
            <p className="text-sm text-clay-500 mt-1">Check back later or register as a seller to add products!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {products.map((p) => {
              const inWishlist = wishlist.some((item) => item.id === p.id);
              return (
                <div
                  key={p.id}
                  className="group relative bg-white rounded-2xl border border-clay-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
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

                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-clay-500 font-semibold uppercase tracking-wider">
                        {p.seller?.business_name || "Artisan Shop"}
                      </p>
                      <Link href={`/products/${p.id}`} className="block mt-1">
                        <h3 className="font-bold text-clay-900 group-hover:text-terracotta-500 transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-clay-500 mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-clay-100">
                      <span className="text-lg font-bold text-clay-950 font-serif">
                        ₹{parseFloat(p.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-clay-500">
                        {p.stock > 0 ? `${p.stock} left` : "Out of stock"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Meet Our Artisans (Spotlight Stories) */}
      <section className="bg-clay-100 py-16 border-y border-clay-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-bold font-serif mb-3">Meet the Makers</h2>
            <p className="text-sm text-clay-600">
              Read the stories behind the hands. Discover who makes your items and where they live.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-6 h-64"></div>
              ))}
            </div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-clay-500">Artisan spotlights will appear here shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {sellers.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-clay-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-1 text-terracotta-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <div className="relative">
                      <Quote className="absolute -top-3 -left-3 h-8 w-8 text-clay-100 -z-0" />
                      <p className="text-sm text-clay-700 italic relative z-10 leading-relaxed line-clamp-4">
                        "{s.story}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-clay-100">
                    <div>
                      <h4 className="font-bold text-clay-950 font-serif">{s.business_name}</h4>
                      <p className="text-xs text-clay-500">{s.city}, {s.state}</p>
                    </div>
                    <Link
                      href={`/products?sellerId=${s.id}`}
                      className="px-3 py-1.5 bg-clay-50 hover:bg-clay-100 border border-clay-200 text-xs font-semibold text-clay-800 rounded-lg transition-colors"
                    >
                      View Crafts
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Mission Statement */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold font-serif leading-tight">
              Empowering Street Craftsmen, Preserving Heritage
            </h2>
            <p className="text-sm sm:text-base text-clay-700 leading-relaxed">
              Traditional Indian street artisans create stunning, organic, and highly durable goods. Unfortunately, they lack digital visibility and fall prey to local middle-brokers who pay peanuts.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="p-2.5 h-10 w-10 bg-terracotta-50 border border-terracotta-100 text-terracotta-600 rounded-lg shrink-0 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-clay-900 text-sm">Direct Seller Payouts</h4>
                  <p className="text-xs text-clay-500 mt-0.5">Platform takes only 10% commission for operations; 90% goes to the maker.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="p-2.5 h-10 w-10 bg-forest-50 border border-forest-100 text-forest-600 rounded-lg shrink-0 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-clay-900 text-sm">Verified Authenticity</h4>
                  <p className="text-xs text-clay-500 mt-0.5">Every seller registration is manually reviewed by platform admins.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-clay-100 shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?w=500"
                alt="Artisan hands painting pottery"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-clay-100 shadow-lg mt-8">
              <img
                src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500"
                alt="Terracotta clay cups"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
