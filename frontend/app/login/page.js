"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { User, Mail, Lock, Phone, ArrowRight, UserCheck } from "lucide-react";

export default function LoginPage() {
  const { login, user, apiRequest, addNotification } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState("customer"); // customer or seller
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  // Read search params for initial registration state
  useEffect(() => {
    if (searchParams.get("register") === "true") {
      setIsRegister(true);
    }
    if (searchParams.get("role") === "seller") {
      setRole("seller");
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(`/dashboard/${user.role}`);
    }
  }, [user, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isRegister ? "/auth/register" : "/auth/login";
    const payload = isRegister 
      ? { ...formData, role }
      : { email: formData.email, password: formData.password };

    const { status, data } = await apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (data.success) {
      login(data.token, data.user);
      router.push(`/dashboard/${data.user.role}`);
    } else {
      addNotification(data.message || "Authentication failed.", "error");
    }
  };

  return (
    <div className="min-h-screen py-16 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-clay-50 to-clay-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-clay-200 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-terracotta-500 py-8 px-6 text-center text-white">
          <h2 className="text-3xl font-bold font-serif">
            {isRegister ? "Join Artify" : "Welcome Back"}
          </h2>
          <p className="text-terracotta-100 text-sm mt-2 font-medium">
            {isRegister 
              ? "Discover and buy directly from traditional craftsmen" 
              : "Support local street artisans and explore handmade designs"}
          </p>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Toggle Role Selector for Registration */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-clay-500 mb-2">
                  I want to:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      role === "customer"
                        ? "bg-terracotta-50 border-terracotta-500 text-terracotta-700 shadow-sm"
                        : "bg-clay-50 border-clay-200 text-clay-700 hover:bg-clay-100"
                    }`}
                  >
                    <User className="h-4 w-4" />
                    Buy Crafts
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("seller")}
                    className={`py-3 px-4 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      role === "seller"
                        ? "bg-terracotta-50 border-terracotta-500 text-terracotta-700 shadow-sm"
                        : "bg-clay-50 border-clay-200 text-clay-700 hover:bg-clay-100"
                    }`}
                  >
                    <UserCheck className="h-4 w-4" />
                    Sell Crafts
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name (Registration only) */}
              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-clay-800 mb-1.5">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-clay-400">
                      <User className="h-5 w-5" />
                    </span>
                    <input
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Ram Charan"
                      className="block w-full pl-11 pr-4 py-3 border border-clay-200 rounded-xl bg-clay-50/50 text-clay-950 placeholder-clay-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-clay-800 mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-clay-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. ram@mail.com"
                    className="block w-full pl-11 pr-4 py-3 border border-clay-200 rounded-xl bg-clay-50/50 text-clay-950 placeholder-clay-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Phone (Registration only) */}
              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-clay-800 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-clay-400">
                      <Phone className="h-5 w-5" />
                    </span>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 9876543210"
                      className="block w-full pl-11 pr-4 py-3 border border-clay-200 rounded-xl bg-clay-50/50 text-clay-950 placeholder-clay-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-all text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-clay-800 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-clay-400">
                    <Lock className="h-5 w-5" />
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="block w-full pl-11 pr-4 py-3 border border-clay-200 rounded-xl bg-clay-50/50 text-clay-950 placeholder-clay-400 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-clay-300 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isRegister ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Link */}
          <div className="mt-8 text-center border-t border-clay-100 pt-6">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setFormData({ name: "", email: "", password: "", phone: "" });
              }}
              className="text-sm font-semibold text-terracotta-600 hover:text-terracotta-700 transition-colors"
            >
              {isRegister 
                ? "Already have an account? Sign In" 
                : "New to Artify? Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
