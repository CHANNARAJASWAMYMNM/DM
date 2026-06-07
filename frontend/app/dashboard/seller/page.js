"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { 
  Plus, Edit, Trash, ShoppingBag, BarChart3, Settings, 
  MapPin, AlertTriangle, CheckCircle, Package, DollarSign, ExternalLink
} from "lucide-react";

export default function SellerDashboard() {
  const { user, apiRequest, addNotification, updateSellerApproval } = useApp();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState("analytics"); // analytics, products, orders, profile

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    business_name: "",
    story: "",
    craft_type: "",
    city: "",
    state: "",
    upi_id: "",
    bank_details: "",
    is_approved: false
  });

  // Product Form modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null); // holds product when editing
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image_url: "",
    category: "Ceramics",
  });

  const [imageUploading, setImageUploading] = useState(false);

  // File upload handler converting local file to Base64 and posting to backend
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setImageUploading(true);
      try {
        const { status, data } = await apiRequest("/products/upload", {
          method: "POST",
          body: JSON.stringify({
            base64: reader.result,
            filename: file.name
          })
        });

        if (status === 200 && data.success) {
          setProductForm((prev) => ({
            ...prev,
            image_url: data.url
          }));
          addNotification("Image uploaded and linked successfully!", "success");
        } else {
          addNotification(data.message || "Failed to upload image.", "error");
        }
      } catch (err) {
        console.error("Image upload failure:", err);
        addNotification("Image upload failed.", "error");
      } finally {
        setImageUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  async function loadSellerData() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch profile & analytics
      const analyticRes = await apiRequest("/sellers/dashboard/analytics");
      if (analyticRes.status === 200 && analyticRes.data.success) {
        setAnalytics(analyticRes.data.analytics);
        setRecentSales(analyticRes.data.recentSales);
      }

      // 2. Fetch seller products (filter by seller_id in products API)
      const userRes = await apiRequest("/auth/me");
      if (userRes.status === 200 && userRes.data.success) {
        const sellerProfile = userRes.data.user.sellerProfile;
        if (sellerProfile) {
          setProfileForm(sellerProfile);
          updateSellerApproval(sellerProfile.is_approved);

          // Fetch products for this specific seller
          const prodRes = await apiRequest(`/products?sellerId=${sellerProfile.id}`);
          if (prodRes.data.success) {
            setProducts(prodRes.data.products);
          }
        }
      }

      // 3. Fetch fulfillment orders
      const orderRes = await apiRequest("/orders/seller");
      if (orderRes.status === 200 && orderRes.data.success) {
        setOrders(orderRes.data.items);
      }

    } catch (err) {
      console.error("Error loading seller dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      addNotification("Please sign in to view dashboard.", "warning");
      router.push("/login");
      return;
    }
    if (user.role !== "seller") {
      router.push(`/dashboard/${user.role}`);
      return;
    }
    loadSellerData();
  }, [user?.id]);

  // Handle Profile Update Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const { status, data } = await apiRequest("/sellers/profile", {
      method: "PUT",
      body: JSON.stringify(profileForm),
    });

    if (status === 200 && data.success) {
      addNotification("Story and settings updated successfully!", "success");
      loadSellerData();
    } else {
      addNotification(data.message || "Failed to update settings.", "error");
    }
  };

  // Helper to convert Google Drive share link to direct embeddable image URL
  const convertDriveUrl = (url) => {
    if (!url) return "";
    const fileDRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const openIdRegex = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
    const ucIdRegex = /docs\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/;

    let fileId = "";
    const matchD = url.match(fileDRegex);
    const matchOpen = url.match(openIdRegex);
    const matchUc = url.match(ucIdRegex);

    if (matchD) {
      fileId = matchD[1];
    } else if (matchOpen) {
      fileId = matchOpen[1];
    } else if (matchUc) {
      fileId = matchUc[1];
    }

    if (fileId) {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return url;
  };

  // Handle Product Create/Update Submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.is_approved) {
      addNotification("Cannot submit products. Account pending admin approval.", "error");
      return;
    }

    const endpoint = editProduct ? `/products/${editProduct.id}` : "/products";
    const method = editProduct ? "PUT" : "POST";

    const payload = {
      ...productForm,
      image_url: convertDriveUrl(productForm.image_url)
    };

    const { status, data } = await apiRequest(endpoint, {
      method,
      body: JSON.stringify(payload),
    });

    if (data.success) {
      addNotification(`Product ${editProduct ? "updated" : "uploaded"} successfully!`, "success");
      setShowProductModal(false);
      setEditProduct(null);
      setProductForm({ name: "", description: "", price: "", stock: "", image_url: "", category: "Ceramics" });
      loadSellerData();
    } else {
      addNotification(data.message || "Failed to save product.", "error");
    }
  };

  // Trigger edit modal
  const startEditProduct = (prod) => {
    setEditProduct(prod);
    setProductForm({
      name: prod.name,
      description: prod.description,
      price: prod.price,
      stock: prod.stock,
      image_url: prod.image_url,
      category: prod.category,
    });
    setShowProductModal(true);
  };

  // Handle delete product
  const handleDeleteProduct = async (prodId) => {
    if (!confirm("Are you sure you want to delete this product from your shop?")) return;
    const { status, data } = await apiRequest(`/products/${prodId}`, {
      method: "DELETE"
    });

    if (data.success) {
      addNotification("Product deleted successfully.", "info");
      loadSellerData();
    } else {
      addNotification("Failed to delete product.", "error");
    }
  };

  // Update order status
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    const { status, data } = await apiRequest(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus })
    });

    if (data.success) {
      addNotification("Order status updated successfully!", "success");
      loadSellerData();
    } else {
      addNotification("Failed to update order status.", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* 1. Header and Status banners */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white border border-clay-200 rounded-2xl p-6 shadow-xs">
        <div>
          <h1 className="text-3xl font-serif font-extrabold text-clay-950">Artisan Workspace</h1>
          <p className="text-sm text-clay-600 mt-1">Manage your storefront, upload products, and write your story.</p>
        </div>
        <div className="flex items-center gap-2">
          {profileForm.is_approved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-forest-50 text-forest-700 border border-forest-100 shadow-xs">
              <CheckCircle className="h-4.5 w-4.5 text-forest-500" />
              Verified Maker
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-terracotta-50 text-terracotta-700 border border-terracotta-100 animate-pulse">
              <AlertTriangle className="h-4.5 w-4.5 text-terracotta-500" />
              Pending Admin Review
            </span>
          )}
        </div>
      </div>

      {/* Pending Banner Alert if not approved */}
      {!profileForm.is_approved && (
        <div className="bg-terracotta-50 border border-terracotta-200 rounded-2xl p-5 mb-8 flex gap-4 text-sm text-terracotta-800">
          <AlertTriangle className="h-6 w-6 text-terracotta-600 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold text-base">Account Registration Under Review</h4>
            <p>
              Your seller account is currently pending activation by our platform administrator. You can update your bio/story, input your UPI/Bank details, and draft products. Once approved, your products will automatically appear in the public catalog and search listings.
            </p>
          </div>
        </div>
      )}

      {/* 2. Tabs */}
      <div className="flex border-b border-clay-200 gap-6 mb-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-4 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === "analytics"
              ? "border-terracotta-500 text-terracotta-500 font-bold"
              : "border-transparent text-clay-500 hover:text-clay-800"
          }`}
        >
          <BarChart3 className="h-4.5 w-4.5" />
          Shop Analytics
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`pb-4 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === "products"
              ? "border-terracotta-500 text-terracotta-500 font-bold"
              : "border-transparent text-clay-500 hover:text-clay-800"
          }`}
        >
          <Package className="h-4.5 w-4.5" />
          My Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-4 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === "orders"
              ? "border-terracotta-500 text-terracotta-500 font-bold"
              : "border-transparent text-clay-500 hover:text-clay-800"
          }`}
        >
          <ShoppingBag className="h-4.5 w-4.5" />
          Fulfillment ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-4 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === "profile"
              ? "border-terracotta-500 text-terracotta-500 font-bold"
              : "border-transparent text-clay-500 hover:text-clay-800"
          }`}
        >
          <Settings className="h-4.5 w-4.5" />
          Artisan Story & Payouts
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: Analytics panel */}
          {activeTab === "analytics" && analytics && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="bg-white border border-clay-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-terracotta-50 text-terracotta-600 rounded-xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-clay-400">Total Sales</p>
                    <p className="text-xl font-bold font-serif text-clay-950 mt-0.5">₹{analytics.totalRevenue}</p>
                  </div>
                </div>

                <div className="bg-white border border-clay-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-forest-50 text-forest-600 rounded-xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-clay-400">Net Payout (90%)</p>
                    <p className="text-xl font-bold font-serif text-forest-600 mt-0.5">₹{analytics.netEarnings}</p>
                  </div>
                </div>

                <div className="bg-white border border-clay-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-clay-50 text-clay-600 rounded-xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-clay-400">Commission Deducted</p>
                    <p className="text-xl font-bold font-serif text-clay-500 mt-0.5">₹{analytics.commissionDeducted}</p>
                  </div>
                </div>

                <div className="bg-white border border-clay-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-clay-50 text-clay-600 rounded-xl">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-clay-400">Product Catalog Count</p>
                    <p className="text-xl font-bold font-serif text-clay-900 mt-0.5">{analytics.productCount} items</p>
                  </div>
                </div>
              </div>

              {/* Recent Orders table */}
              <div className="bg-white border border-clay-200 rounded-2xl p-6 shadow-xs">
                <h3 className="font-serif font-bold text-lg text-clay-950 border-b border-clay-100 pb-3 mb-4">
                  Recent Sales Log
                </h3>
                {recentSales.length === 0 ? (
                  <p className="text-xs text-clay-500">Sales transactions will appear here.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-clay-200 text-clay-400 font-bold uppercase">
                          <th className="pb-3">Product</th>
                          <th className="pb-3">Price</th>
                          <th className="pb-3">Qty</th>
                          <th className="pb-3">Total Amount</th>
                          <th className="pb-3">Payment Status</th>
                          <th className="pb-3">Order Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map((sale) => (
                          <tr key={sale.id} className="border-b border-clay-100 text-clay-700 hover:bg-clay-50/50">
                            <td className="py-3.5 font-bold text-clay-950 flex items-center gap-2">
                              <img src={sale.product?.image_url} className="h-7 w-7 rounded object-cover border border-clay-100" />
                              <span>{sale.product?.name}</span>
                            </td>
                            <td className="py-3.5">₹{parseFloat(sale.price_at_purchase).toFixed(2)}</td>
                            <td className="py-3.5">{sale.quantity}</td>
                            <td className="py-3.5">₹{(parseFloat(sale.price_at_purchase) * sale.quantity).toFixed(2)}</td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                sale.order?.payment_status === "paid" ? "bg-forest-50 text-forest-600" : "bg-clay-100 text-clay-500"
                              }`}>
                                {sale.order?.payment_status}
                              </span>
                            </td>
                            <td className="py-3.5 uppercase font-bold text-[10px] text-clay-600">{sale.order?.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Products panel */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white border border-clay-200 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-clay-500 font-semibold">Add or manage your products. Ensure your details reflect your packaging story.</p>
                <button
                  disabled={!profileForm.is_approved}
                  onClick={() => {
                    setEditProduct(null);
                    setProductForm({ name: "", description: "", price: "", stock: "", image_url: "", category: "Ceramics" });
                    setShowProductModal(true);
                  }}
                  className="px-4 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-clay-300 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="h-4.5 w-4.5" />
                  Add Product
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-clay-200">
                  <Package className="h-12 w-12 text-clay-300 mx-auto mb-4" />
                  <h3 className="font-serif font-bold text-lg text-clay-800">Your Shop is Empty</h3>
                  <p className="text-sm text-clay-500 mt-1">Click Add Product to list your clay pottery, woodwork or textiles!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  {products.map((p) => (
                    <div key={p.id} className="bg-white border border-clay-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
                      <div className="aspect-square bg-clay-50 w-full relative">
                        <img src={p.image_url} alt={p.name} className="object-cover w-full h-full" />
                        <span className="absolute bottom-2 left-2 text-[8px] uppercase tracking-wider font-bold bg-clay-950/80 text-white px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="font-serif font-bold text-clay-950 text-sm truncate">{p.name}</h3>
                          <p className="text-xs text-clay-500 mt-0.5 line-clamp-2">{p.description}</p>
                          <div className="grid grid-cols-2 gap-2 mt-3 text-xs border-t border-clay-100 pt-3">
                            <div>
                              <p className="text-[10px] text-clay-400 font-bold uppercase">Price</p>
                              <p className="font-bold text-clay-900 mt-0.5">₹{parseFloat(p.price).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-clay-400 font-bold uppercase">Stock</p>
                              <p className={`font-bold mt-0.5 ${p.stock > 0 ? "text-clay-800" : "text-terracotta-500"}`}>{p.stock} units</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-clay-100">
                          <button
                            onClick={() => startEditProduct(p)}
                            className="flex-1 py-1.5 bg-clay-50 hover:bg-clay-100 border border-clay-200 rounded-lg text-xs font-semibold text-clay-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="py-1.5 px-3 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-600 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                            title="Delete craft"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Fulfillment orders panel */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-clay-200">
                  <ShoppingBag className="h-12 w-12 text-clay-300 mx-auto mb-4" />
                  <h3 className="font-serif font-bold text-lg text-clay-800">No Orders Received</h3>
                  <p className="text-sm text-clay-500 mt-1">When customers buy your products, items will show up here for shipping fulfillment.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((item) => (
                    <div key={item.id} className="bg-white border border-clay-200 rounded-2xl shadow-xs p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Product & Order quantity */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={item.product?.image_url} className="h-12 w-12 rounded-lg object-cover border border-clay-100" />
                          <div>
                            <h4 className="font-bold text-clay-950 text-sm">{item.product?.name}</h4>
                            <p className="text-xs text-clay-500">Ordered Quantity: <span className="font-bold text-clay-900">{item.quantity} units</span></p>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-clay-600">
                          <p>Price at purchase: ₹{parseFloat(item.price_at_purchase).toFixed(2)}</p>
                          <p className="mt-0.5">Payment Method: <span className="uppercase text-clay-800">{item.order?.payment_method}</span></p>
                          <p className="mt-0.5">Payment Status: <span className="uppercase text-clay-800">{item.order?.payment_status}</span></p>
                        </div>
                      </div>

                      {/* Customer info & shipping details */}
                      <div className="text-xs space-y-1.5">
                        <h5 className="font-bold uppercase tracking-wider text-clay-400 mb-1">Customer Shipping Address</h5>
                        <p className="flex items-center gap-1 font-bold text-clay-800"><MapPin className="h-3.5 w-3.5 text-terracotta-500" /> {item.order?.shipping_address}</p>
                        <p className="text-clay-500">Phone: {item.order?.contact_phone}</p>
                        <p className="text-[10px] text-clay-400 uppercase font-semibold">Ordered: {new Date(item.order?.created_at).toLocaleString()}</p>
                      </div>

                      {/* Shipping status updates */}
                      <div className="space-y-3 border-t md:border-t-0 md:border-l border-clay-100 pt-4 md:pt-0 md:pl-6">
                        <h5 className="font-bold uppercase tracking-wider text-clay-400">Fulfillment Status</h5>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-clay-700">Tracking Status:</span>
                            <span className="text-xs font-bold uppercase text-terracotta-600">{item.order?.status}</span>
                          </div>
                          
                          {/* Status Actions */}
                          {item.order?.status !== "cancelled" && item.order?.status !== "delivered" ? (
                            <div className="flex gap-2">
                              {item.order?.status === "pending" && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(item.order.id, "processing")}
                                  className="w-full py-1.5 bg-clay-800 hover:bg-clay-900 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  Process Craft
                                </button>
                              )}
                              {item.order?.status === "processing" && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(item.order.id, "shipped")}
                                  className="w-full py-1.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  Mark Shipped
                                </button>
                              )}
                              {item.order?.status === "shipped" && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(item.order.id, "delivered")}
                                  className="w-full py-1.5 bg-forest-500 hover:bg-forest-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  Confirm Delivered
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleOrderStatusUpdate(item.order.id, "cancelled")}
                                className="px-2 py-1.5 bg-clay-50 hover:bg-clay-100 text-clay-500 border border-clay-200 rounded-lg text-xs"
                                title="Cancel Order"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="bg-clay-50 border border-clay-200 rounded-xl p-3 text-xs text-clay-500 flex items-center justify-center gap-1.5">
                              {item.order?.status === "delivered" ? "✅ Completed & Delivered" : "🚫 Cancelled / Refunded"}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Profile & Story settings panel */}
          {activeTab === "profile" && (
            <div className="bg-white border border-clay-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="font-serif font-bold text-xl text-clay-950 border-b border-clay-100 pb-3 mb-6">
                Store Story and Settings
              </h3>
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Shop Name */}
                  <div>
                    <label className="block text-sm font-semibold text-clay-800 mb-1.5">Artisan Business Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.business_name}
                      onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                      className="block w-full border border-clay-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                    />
                  </div>

                  {/* Craft Type */}
                  <div>
                    <label className="block text-sm font-semibold text-clay-800 mb-1.5">Craft Type Details</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Terracotta clay dolls, Handwoven cotton rugs"
                      value={profileForm.craft_type}
                      onChange={(e) => setProfileForm({ ...profileForm, craft_type: e.target.value })}
                      className="block w-full border border-clay-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-semibold text-clay-800 mb-1.5">City / Village</label>
                    <input
                      type="text"
                      required
                      value={profileForm.city}
                      onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="block w-full border border-clay-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-semibold text-clay-800 mb-1.5">State</label>
                    <input
                      type="text"
                      required
                      value={profileForm.state}
                      onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                      className="block w-full border border-clay-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                    />
                  </div>
                </div>

                {/* Artisan Story */}
                <div>
                  <label className="block text-sm font-semibold text-clay-800 mb-1.5 flex justify-between">
                    <span>Artisan Heritage Story (Origin bio)</span>
                    <span className="text-xs text-clay-400 font-normal">Displayed on product details</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={profileForm.story}
                    onChange={(e) => setProfileForm({ ...profileForm, story: e.target.value })}
                    className="block w-full border border-clay-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20 placeholder-clay-400 leading-relaxed"
                  />
                </div>

                {/* Payout Details */}
                <div className="bg-clay-100 border border-clay-200 rounded-xl p-5 space-y-4">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-clay-800">UPI/Bank Payout details</h4>
                  <p className="text-xs text-clay-500 leading-relaxed">Payments made online are split. We charge a 10% platform facilitation fee and routing is prepared to settle details below.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-clay-700 mb-1.5">UPI ID (Razorpay/GPay)</label>
                      <input
                        type="text"
                        placeholder="e.g. sreshkumar@okhdfc"
                        value={profileForm.upi_id || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, upi_id: e.target.value })}
                        className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-clay-700 mb-1.5">Bank Account details</label>
                      <input
                        type="text"
                        placeholder="A/C No: 123456, IFSC: SBIN0001, SBI Bank"
                        value={profileForm.bank_details || ""}
                        onChange={(e) => setProfileForm({ ...profileForm, bank_details: e.target.value })}
                        className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3.5 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl shadow-md text-sm transition-colors cursor-pointer"
                >
                  Save Store Info
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* 3. Add/Edit Product Modal Dialog */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-clay-900/60 backdrop-blur-xs px-4">
          <div className="bg-white rounded-2xl border border-clay-200 max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="bg-terracotta-500 py-4 px-6 text-white flex justify-between items-center">
              <h3 className="font-serif font-bold text-lg">{editProduct ? "Modify Craft details" : "Upload New Craft"}</h3>
              <button onClick={() => setShowProductModal(false)} className="text-white hover:text-clay-100 font-bold">✕</button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-clay-800 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Handmade Terracotta Teacups (Set of 6)"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-clay-800 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 15.00"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-clay-800 mb-1">Inventory Stock</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 10"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                  />
                </div>
              </div>

              {/* Image URL & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-clay-800 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                  >
                    <option value="Ceramics">Ceramics & Clay Pottery</option>
                    <option value="Textiles">Handloom & Textiles</option>
                    <option value="Woodwork">Wooden Carvings</option>
                    <option value="Paintings">Traditional Paintings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-clay-800 mb-1">Product Image</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-xs text-clay-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-terracotta-50 file:text-terracotta-700 hover:file:bg-terracotta-100 transition-colors file:cursor-pointer"
                    />
                    {imageUploading && (
                      <p className="text-[10px] text-terracotta-500 animate-pulse font-semibold">Uploading image file...</p>
                    )}
                    <input
                      type="text"
                      placeholder="Or paste an image URL"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-clay-800 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the materials used (e.g. riverbed clay, organic paints) and origin background."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-clay-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 border border-clay-200 text-clay-700 rounded-xl text-xs hover:bg-clay-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editProduct ? "Update Craft" : "Publish Craft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
