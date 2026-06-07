"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { ShoppingBag, Heart, Star, Compass, ShoppingCart, Truck, Calendar, MapPin } from "lucide-react";
import Link from "next/link";

function CustomerDashboardContent() {
  const { user, apiRequest, addNotification, wishlist, toggleWishlist, addToCart } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "orders"); // orders or wishlist

  useEffect(() => {
    if (!user) {
      addNotification("Please sign in to view your dashboard.", "warning");
      router.push("/login");
      return;
    }

    if (user.role !== "customer") {
      router.push(`/dashboard/${user.role}`);
      return;
    }

    async function loadOrders() {
      try {
        const { status, data } = await apiRequest("/orders/customer");
        if (status === 200 && data.success) {
          setOrders(data.orders);
        }
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user]);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["orders", "wishlist"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.replace(`/dashboard/customer?tab=${tab}`, { scroll: false });
  };

  // Tracking progress logic helper
  const getTrackingSteps = (status) => {
    const steps = [
      { key: "pending", label: "Order Placed", desc: "Awaiting artisan validation" },
      { key: "processing", label: "Processing", desc: "Artisan preparing craft items" },
      { key: "shipped", label: "Shipped", desc: "Out for mock delivery courier" },
      { key: "delivered", label: "Delivered", desc: "Package received" }
    ];

    const statusIndexMap = {
      pending: 0,
      processing: 1,
      shipped: 2,
      delivered: 3,
      cancelled: -1
    };

    const activeIndex = statusIndexMap[status] ?? 0;

    return { steps, activeIndex };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Welcome Banner */}
      <div className="bg-clay-100 border border-clay-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8 shadow-xs">
        <div>
          <h1 className="text-3xl font-serif font-extrabold text-clay-950">Namaste, {user?.name}!</h1>
          <p className="text-sm text-clay-600 mt-1">Thank you for supporting handlooms and street makers.</p>
        </div>
        <div className="bg-white px-4 py-2 border border-clay-200 rounded-xl text-xs font-semibold uppercase text-clay-500">
          Role: <span className="text-terracotta-500 font-bold">Customer</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-clay-200 gap-6 mb-8 text-sm font-semibold">
        <button
          onClick={() => handleTabChange("orders")}
          className={`pb-4 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === "orders"
              ? "border-terracotta-500 text-terracotta-500 font-bold"
              : "border-transparent text-clay-500 hover:text-clay-800"
          }`}
        >
          <ShoppingBag className="h-4.5 w-4.5" />
          My Orders ({orders.length})
        </button>
        <button
          onClick={() => handleTabChange("wishlist")}
          className={`pb-4 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === "wishlist"
              ? "border-terracotta-500 text-terracotta-500 font-bold"
              : "border-transparent text-clay-500 hover:text-clay-800"
          }`}
        >
          <Heart className="h-4.5 w-4.5" />
          My Wishlist ({wishlist.length})
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className="space-y-8">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white border border-clay-200 rounded-2xl h-40"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-clay-200 p-8">
              <Compass className="h-12 w-12 text-clay-300 mx-auto mb-4" />
              <h3 className="font-serif font-bold text-lg text-clay-800">You haven't placed any orders yet</h3>
              <p className="text-sm text-clay-500 mt-1">Discover handcrafted goods uploaded by approved street makers.</p>
              <Link
                href="/products"
                className="mt-6 inline-block px-5 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Go Shop Catalogue
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const { steps, activeIndex } = getTrackingSteps(order.status);
                const isCancelled = order.status === "cancelled";

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-clay-200 rounded-2xl shadow-xs overflow-hidden"
                  >
                    {/* Order Metadata Header */}
                    <div className="bg-clay-50 px-6 py-4 border-b border-clay-200 flex flex-wrap gap-4 justify-between items-center text-xs text-clay-700">
                      <div className="flex gap-4">
                        <div>
                          <p className="font-semibold uppercase tracking-wider text-clay-400">Order Placed</p>
                          <p className="font-bold text-clay-800 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-wider text-clay-400">Total Price</p>
                          <p className="font-bold text-clay-950 mt-0.5">₹{parseFloat(order.total_amount).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-wider text-clay-400">Status</p>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isCancelled 
                              ? "bg-terracotta-50 text-terracotta-600 border border-terracotta-100" 
                              : order.status === "delivered" 
                              ? "bg-forest-50 text-forest-700 border border-forest-100" 
                              : "bg-clay-100 text-clay-700 border border-clay-200"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold uppercase tracking-wider text-clay-400">Mock Tracking ID</p>
                        <p className="font-bold text-forest-600 mt-0.5">{order.tracking_id}</p>
                      </div>
                    </div>

                    {/* Order Items & Timeline */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Items purchased */}
                      <div className="lg:col-span-5 space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-clay-500 mb-2">Items Purchased</h4>
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex gap-3 items-center">
                            <div className="h-12 w-12 rounded-lg bg-clay-50 border border-clay-100 overflow-hidden shrink-0">
                              <img
                                src={item.product?.image_url}
                                alt={item.product?.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/products/${item.product?.id}`}
                                className="font-bold text-xs text-clay-900 hover:text-terracotta-500 truncate block"
                              >
                                {item.product?.name || "Deleted Product"}
                              </Link>
                              <p className="text-[10px] text-clay-500 mt-0.5">
                                Qty: {item.quantity} × ₹{parseFloat(item.price_at_purchase).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right: Deliver System Tracker Timeline */}
                      <div className="lg:col-span-7 space-y-4 border-t lg:border-t-0 lg:border-l border-clay-100 pt-6 lg:pt-0 lg:pl-6">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-clay-500 flex items-center gap-1">
                          <Truck className="h-4 w-4 text-terracotta-500" />
                          Delivery tracking status
                        </h4>
                        
                        {isCancelled ? (
                          <div className="bg-terracotta-50 border border-terracotta-100 text-terracotta-600 rounded-xl p-4 text-xs font-semibold">
                            This order was cancelled. Product stocks have been replenished.
                          </div>
                        ) : (
                          /* Timeline progress steps */
                          <div className="grid grid-cols-4 gap-2 pt-2 text-center relative">
                            {/* Connector line */}
                            <div className="absolute top-[18px] left-[12%] right-[12%] h-[3px] bg-clay-200 -z-0">
                              <div
                                className="h-full bg-forest-500 transition-all duration-500"
                                style={{ width: `${(activeIndex / 3) * 100}%` }}
                              ></div>
                            </div>

                            {steps.map((step, idx) => {
                              const isCompleted = idx <= activeIndex;
                              const isActive = idx === activeIndex;

                              return (
                                <div key={step.key} className="space-y-2 relative z-10 flex flex-col items-center">
                                  <div
                                    className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                                      isCompleted
                                        ? "bg-forest-500 border-forest-600 text-white shadow-sm"
                                        : "bg-white border-clay-200 text-clay-400"
                                    }`}
                                  >
                                    {isCompleted ? "✓" : idx + 1}
                                  </div>
                                  <div>
                                    <p
                                      className={`text-[10px] font-bold ${
                                        isActive ? "text-forest-600" : isCompleted ? "text-clay-800" : "text-clay-400"
                                      }`}
                                    >
                                      {step.label}
                                    </p>
                                    <p className="hidden sm:block text-[8px] text-clay-400 leading-tight mt-0.5">
                                      {step.desc}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pt-2 text-[10px] font-semibold text-clay-500 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Address: {order.shipping_address}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Contact: {order.contact_phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Wishlist Tab */}
      {activeTab === "wishlist" && (
        <div>
          {wishlist.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-clay-200 p-8">
              <Heart className="h-12 w-12 text-clay-200 mx-auto mb-4" />
              <h3 className="font-serif font-bold text-lg text-clay-800">Your Wishlist is empty</h3>
              <p className="text-sm text-clay-500 mt-1">Click the heart button on products to save them here.</p>
              <Link
                href="/products"
                className="mt-6 inline-block px-5 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                View Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {wishlist.map((p) => (
                <div
                  key={p.id}
                  className="group relative bg-white border border-clay-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full bg-clay-50 overflow-hidden">
                    <img src={p.image_url} alt={p.name} className="object-cover w-full h-full" />
                    <button
                      onClick={() => toggleWishlist(p)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-terracotta-50 border border-terracotta-200 text-terracotta-500 cursor-pointer"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-clay-900 truncate">{p.name}</h3>
                      <p className="text-xs text-clay-500 mt-0.5 line-clamp-1">{p.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-clay-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-clay-950 font-serif">₹{parseFloat(p.price).toFixed(2)}</span>
                      <button
                        onClick={() => addToCart(p, 1)}
                        className="p-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg transition-colors cursor-pointer"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-8 w-8 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <CustomerDashboardContent />
    </Suspense>
  );
}
