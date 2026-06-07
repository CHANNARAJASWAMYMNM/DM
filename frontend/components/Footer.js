"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-clay-900 text-clay-100 border-t border-clay-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <span className="text-2xl font-bold font-serif text-terracotta-400">Artify</span>
            <p className="text-sm text-clay-300 leading-relaxed">
              Empowering local street artisans, pottery makers, and handmade creators to share their heritage crafts and stories with the world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Shop Categories</h4>
            <ul className="space-y-2 text-sm text-clay-300">
              <li>
                <Link href="/products?category=Ceramics" className="hover:text-terracotta-400 transition-colors">
                  Ceramics & Clay Pottery
                </Link>
              </li>
              <li>
                <Link href="/products?category=Textiles" className="hover:text-terracotta-400 transition-colors">
                  Handloom & Textiles
                </Link>
              </li>
              <li>
                <Link href="/products?category=Woodwork" className="hover:text-terracotta-400 transition-colors">
                  Wooden Carvings
                </Link>
              </li>
              <li>
                <Link href="/products?category=Paintings" className="hover:text-terracotta-400 transition-colors">
                  Traditional Paintings
                </Link>
              </li>
            </ul>
          </div>

          {/* Artisan Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">For Artisans</h4>
            <ul className="space-y-2 text-sm text-clay-300">
              <li>
                <Link href="/login?register=true&role=seller" className="hover:text-terracotta-400 transition-colors">
                  Create Seller Account
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-terracotta-400 transition-colors">
                  Sponsorship Programs
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-terracotta-400 transition-colors">
                  Artisan Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal/Contact Column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-4">Contact & Help</h4>
            <p className="text-sm text-clay-300 mb-2">
              Have questions or need support?
            </p>
            <p className="text-sm text-terracotta-400 font-bold">
              support@artify.com
            </p>
            <p className="text-xs text-clay-400 mt-4 leading-relaxed">
              © {new Date().getFullYear()} Artify Inc. All rights reserved. Designed with ❤️ for traditional artisans.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
