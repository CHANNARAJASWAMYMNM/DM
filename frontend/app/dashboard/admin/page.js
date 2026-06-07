"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { 
  Users, ShoppingBag, BarChart3, CheckSquare, Trash2, 
  TrendingUp, Award, Clock, DollarSign, CheckCircle2, ShieldAlert
} from "lucide-react";

export default function AdminDashboard() {
  const { user, apiRequest, addNotification } = useApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("analytics"); // analytics, sellers, users
  const [loading, setLoading] = useState(true);

  // Platform details states
  const [analytics, setAnalytics] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [usersList, setUsersList] = useState([]);

  async function loadAdminData() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch dashboard analytics
      const analyticRes = await apiRequest("/admin/dashboard/analytics");
      if (analyticRes.status === 200 && analyticRes.data.success) {
        setAnalytics(analyticRes.data.analytics);
        setRecentUsers(analyticRes.data.recentUsers);
        setRecentOrders(analyticRes.data.recentOrders);
      }

      // 2. Fetch all sellers
      const sellerRes = await apiRequest("/admin/sellers");
      if (sellerRes.status === 200 && sellerRes.data.success) {
        setSellers(sellerRes.data.sellers);
      }

      // 3. Fetch all platform users
      const usersRes = await apiRequest("/admin/users");
      if (usersRes.status === 200 && usersRes.data.success) {
        setUsersList(usersRes.data.users);
      }

    } catch (err) {
      console.error("Error loading admin details:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      addNotification("Please sign in to access administration controls.", "warning");
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      router.push(`/dashboard/${user.role}`);
      return;
    }
    loadAdminData();
  }, [user]);

  // Handle seller approval
  const handleSellerApproval = async (sellerId, approveStatus) => {
    const { status, data } = await apiRequest(`/admin/sellers/${sellerId}/approve`, {
      method: "PUT",
      body: JSON.stringify({ approve: approveStatus })
    });

    if (data.success) {
      addNotification(data.message, "success");
      loadAdminData();
    } else {
      addNotification("Failed to update seller status.", "error");
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user from the platform? All associated data will be deleted.")) return;
    const { status, data } = await apiRequest(`/admin/users/${userId}`, {
      method: "DELETE"
    });

    if (data.success) {
      addNotification(data.message, "info");
      loadAdminData();
    } else {
      addNotification(data.message || "Failed to delete user.", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* 1. Header Banner */}
      <div className="bg-clay-900 border border-clay-800 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8 shadow-md">
        <div>
          <h1 className="text-3xl font-serif font-extrabold text-terracotta-400">Platform Control Hub</h1>
          <p className="text-xs text-clay-300 mt-1">Global settings, seller application approvals, and user accounts databases.</p>
        </div>
        <div className="bg-clay-800 px-4 py-2 border border-clay-700 rounded-xl text-xs font-semibold uppercase text-terracotta-400 flex items-center gap-1.5">
          <ShieldAlert className="h-4.5 w-4.5" />
          Role: <span className="font-bold">Administrator</span>
        </div>
      </div>

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
          Platform Analytics
        </button>
        <button
          onClick={() => setActiveTab("sellers")}
          className={`pb-4 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === "sellers"
              ? "border-terracotta-500 text-terracotta-500 font-bold"
              : "border-transparent text-clay-500 hover:text-clay-800"
          }`}
        >
          <CheckSquare className="h-4.5 w-4.5" />
          Sellers Approvals
          {sellers.filter(s => !s.is_approved).length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">
              {sellers.filter(s => !s.is_approved).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-4 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === "users"
              ? "border-terracotta-500 text-terracotta-500 font-bold"
              : "border-transparent text-clay-500 hover:text-clay-800"
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          Users Directory ({usersList.length})
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
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-clay-400">Gross Sales Volume</p>
                    <p className="text-xl font-bold font-serif text-clay-950 mt-0.5">₹{analytics.totalGrossSales}</p>
                  </div>
                </div>

                <div className="bg-white border border-clay-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-forest-50 text-forest-600 rounded-xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-clay-400">Platform Fees (10%)</p>
                    <p className="text-xl font-bold font-serif text-forest-600 mt-0.5">₹{analytics.totalCommissionRevenue}</p>
                  </div>
                </div>

                <div className="bg-white border border-clay-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-clay-50 text-clay-600 rounded-xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-clay-400">Total Members</p>
                    <p className="text-xl font-bold font-serif text-clay-900 mt-0.5">{analytics.totalUsers} profiles</p>
                  </div>
                </div>

                <div className="bg-white border border-clay-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-clay-50 text-clay-600 rounded-xl">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-clay-400">Artisan Applications</p>
                    <p className="text-xs font-bold text-clay-800 mt-1">
                      <span className="text-forest-600 font-extrabold">{analytics.approvedSellers} Verified</span> / {analytics.pendingSellers} Pending
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub Grids for Recents */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Registrations */}
                <div className="bg-white border border-clay-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="font-serif font-bold text-base text-clay-950 border-b border-clay-100 pb-3">
                    New Member Registrations
                  </h3>
                  <div className="divide-y divide-clay-100">
                    {recentUsers.map((u) => (
                      <div key={u.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-clay-950">{u.name}</p>
                          <p className="text-[10px] text-clay-400 mt-0.5">{u.email}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          u.role === "admin" 
                            ? "bg-clay-800 text-white" 
                            : u.role === "seller" 
                            ? "bg-terracotta-50 text-terracotta-600" 
                            : "bg-clay-100 text-clay-600"
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Platform Orders */}
                <div className="bg-white border border-clay-200 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="font-serif font-bold text-base text-clay-950 border-b border-clay-100 pb-3">
                    Global Orders History
                  </h3>
                  <div className="divide-y divide-clay-100">
                    {recentOrders.map((o) => (
                      <div key={o.id} className="py-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-clay-950">Amount: ₹{parseFloat(o.total_amount).toFixed(2)}</p>
                          <p className="text-[8px] text-clay-400 mt-0.5">Order ID: {o.id.substring(0, 8)}...</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            o.status === "delivered" ? "bg-forest-50 text-forest-600" : "bg-clay-100 text-clay-600"
                          }`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Sellers approvals list */}
          {activeTab === "sellers" && (
            <div className="space-y-6">
              {sellers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-clay-200">
                  <Clock className="h-12 w-12 text-clay-300 mx-auto mb-4" />
                  <h3 className="font-serif font-bold text-lg text-clay-800">No Sellers Registered</h3>
                  <p className="text-sm text-clay-500 mt-1">Artisans will show up here after signing up as a seller.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sellers.map((s) => (
                    <div
                      key={s.id}
                      className="bg-white border border-clay-200 rounded-2xl p-6 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                      {/* Shop bio and state */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-clay-950 text-base">{s.business_name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            s.is_approved ? "bg-forest-50 text-forest-600" : "bg-terracotta-50 text-terracotta-600"
                          }`}>
                            {s.is_approved ? "Active" : "Pending Approval"}
                          </span>
                        </div>
                        <p className="text-xs text-clay-500 flex items-center gap-0.5">📍 Location: {s.city}, {s.state}</p>
                        <p className="text-xs text-clay-600 font-semibold">Craft: {s.craft_type}</p>
                        <p className="text-xs text-clay-400 uppercase tracking-widest font-semibold mt-2">Registered Seller</p>
                      </div>

                      {/* Story description */}
                      <div className="text-xs space-y-2">
                        <h5 className="font-bold uppercase tracking-wider text-clay-400">Heritage Story Bio</h5>
                        <p className="text-clay-700 italic leading-relaxed">"{s.story}"</p>
                      </div>

                      {/* Admin validation controls */}
                      <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-clay-100 pt-4 lg:pt-0 lg:pl-6 text-xs font-semibold">
                        <div>
                          <h5 className="font-bold uppercase tracking-wider text-clay-400 mb-1">UPI Payout Credentials</h5>
                          <p className="text-clay-700 font-bold">UPI ID: {s.upi_id || "Not provided"}</p>
                          <p className="text-clay-500">Bank details: {s.bank_details || "Not provided"}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          {!s.is_approved ? (
                            <button
                              onClick={() => handleSellerApproval(s.id, true)}
                              className="w-full py-2 bg-forest-500 hover:bg-forest-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Approve Seller
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSellerApproval(s.id, false)}
                              className="w-full py-2 bg-clay-100 hover:bg-clay-200 text-terracotta-600 rounded-lg font-bold border border-clay-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              Suspend Seller
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Users directory */}
          {activeTab === "users" && (
            <div className="bg-white border border-clay-200 rounded-2xl p-6 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-clay-950 border-b border-clay-100 pb-3 mb-4">
                Registered Platform Profiles
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-clay-200 text-clay-400 font-bold uppercase">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Registered On</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id} className="border-b border-clay-100 text-clay-700 hover:bg-clay-50/50">
                        <td className="py-3.5 font-bold text-clay-950">{u.name}</td>
                        <td className="py-3.5">{u.email}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                            u.role === "admin" 
                              ? "bg-clay-800 text-white" 
                              : u.role === "seller" 
                              ? "bg-terracotta-50 text-terracotta-600 border border-terracotta-100" 
                              : "bg-clay-100 text-clay-600"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5">{u.phone || "N/A"}</td>
                        <td className="py-3.5">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            disabled={u.id === user.id}
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-clay-400 hover:text-terracotta-600 hover:bg-terracotta-50 rounded-lg transition-colors disabled:opacity-20 cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
