"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { MapPin, ArrowRight, Quote, Award } from "lucide-react";
import Link from "next/link";

export default function SellersPage() {
  const { apiRequest } = useApp();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSellers() {
      try {
        const { status, data } = await apiRequest("/sellers");
        if (status === 200 && data.success) {
          setSellers(data.sellers);
        }
      } catch (err) {
        console.error("Error fetching sellers list:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSellers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-terracotta-500 bg-terracotta-50 border border-terracotta-100 px-3 py-1 rounded-full">
          meet the creators
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-serif text-clay-950 mt-3">Artisan Stories</h1>
        <p className="text-sm text-clay-600 mt-2">
          Discover the hands and hearts behind traditional Indian street crafts, clay pottery, and handloom textiles.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-clay-200 rounded-2xl h-56 p-6"></div>
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-clay-200 rounded-2xl p-8 max-w-md mx-auto">
          <Award className="h-12 w-12 text-clay-300 mx-auto mb-4" />
          <h3 className="font-serif font-bold text-lg text-clay-800">No approved artisans yet</h3>
          <p className="text-sm text-clay-500 mt-1">Sellers are currently registering and waiting for verification.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sellers.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-clay-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold font-serif text-clay-950">{s.business_name}</h3>
                    <p className="text-xs text-clay-500 font-semibold uppercase tracking-wider mt-0.5">{s.craft_type}</p>
                  </div>
                  <span className="text-xs font-bold text-forest-600 bg-forest-50 px-2.5 py-1 rounded border border-forest-100 uppercase">
                    Verified
                  </span>
                </div>

                <div className="relative pl-6 pt-2">
                  <Quote className="absolute top-0 left-0 h-5 w-5 text-clay-200" />
                  <p className="text-sm text-clay-700 leading-relaxed italic">
                    "{s.story}"
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 pt-4 border-t border-clay-100 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-clay-600">
                  <MapPin className="h-4 w-4 text-terracotta-500" />
                  {s.city}, {s.state}
                </span>

                <Link
                  href={`/products?sellerId=${s.id}`}
                  className="px-4 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg flex items-center gap-1 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  Browse Shop Crafts
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
