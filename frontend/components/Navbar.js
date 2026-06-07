"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";
import { ShoppingCart, Heart, User, LogOut, LayoutDashboard, ShoppingBag } from "lucide-react";

export default function Navbar() {
  const { user, logout, cart, wishlist } = useApp();

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getDashboardLink = () => {
    if (!user) return "/login";
    return `/dashboard/${user.role}`;
  };

  return (
    <header className="bg-clay-50 border-b border-clay-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-3xl font-bold tracking-tight text-terracotta-500 font-serif group-hover:text-terracotta-600 transition-colors">
                Artify
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-clay-500 bg-clay-100 px-2 py-0.5 rounded border border-clay-200">
                Handmade
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/products"
              className="text-sm font-semibold text-clay-800 hover:text-terracotta-500 transition-colors"
            >
              Explore Shop
            </Link>
            <Link
              href="/sellers"
              className="text-sm font-semibold text-clay-800 hover:text-terracotta-500 transition-colors"
            >
              Artisan Stories
            </Link>
            <Link
              href="/#about"
              className="text-sm font-semibold text-clay-800 hover:text-terracotta-500 transition-colors"
            >
              Our Mission
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            {/* Wishlist */}
            <Link
              href="/dashboard/customer?tab=wishlist"
              className="p-2 text-clay-800 hover:text-terracotta-500 transition-colors relative"
              title="Wishlist"
            >
              <Heart className="h-6 w-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="p-2 text-clay-800 hover:text-terracotta-500 transition-colors relative"
              title="Shopping Cart"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Auth Controls */}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={getDashboardLink()}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-terracotta-600 bg-terracotta-50 hover:bg-terracotta-100 rounded-lg transition-colors border border-terracotta-100"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 text-clay-600 hover:text-terracotta-600 hover:bg-clay-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-clay-800 hover:text-terracotta-500 transition-colors px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?register=true&role=seller"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-terracotta-500 hover:bg-terracotta-600 rounded-lg transition-colors shadow-sm"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Sell Craft
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
