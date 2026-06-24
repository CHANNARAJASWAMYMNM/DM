"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { Trash2, ShoppingBag, MapPin, Phone, CreditCard, ChevronRight, CheckCircle, Package } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, user, apiRequest, addNotification } = useApp();
  const router = useRouter();

  // Checkout form states
  const [shippingAddress, setShippingAddress] = useState("");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod or online
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null); // Will hold confirmed order details

  // Simulated credit card states
  const [cardNum, setCardNum] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const validCart = cart.filter((item) => item && item.product && item.product.id);
  const subtotal = validCart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
  const shippingCharge = subtotal > 50 ? 0 : 5.0; // Free shipping over ₹50
  const grandTotal = subtotal + shippingCharge;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      addNotification("Please login to place an order.", "warning");
      router.push("/login");
      return;
    }
    if (user.role !== "customer") {
      addNotification("Only customer accounts can place orders.", "warning");
      return;
    }
    if (validCart.length === 0) {
      addNotification("Your cart is empty.", "warning");
      return;
    }

    // Prepare payload
    const cartItemsPayload = validCart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    setCheckoutLoading(true);
    const { status, data } = await apiRequest("/orders", {
      method: "POST",
      body: JSON.stringify({
        cartItems: cartItemsPayload,
        shippingAddress,
        contactPhone,
        paymentMethod,
      }),
    });
    setCheckoutLoading(false);

    if (status === 201 && data.success) {
      addNotification("Order placed successfully!", "success");
      setOrderSuccess(data.order);
      clearCart();
    } else {
      addNotification(data.message || "Checkout failed. Please try again.", "error");
    }
  };

  // If order was successfully completed, show checkout landing success screen
  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="h-16 w-16 bg-forest-100 text-forest-600 rounded-full flex items-center justify-center mx-auto border border-forest-200">
          <CheckCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-serif font-extrabold text-clay-950">Thank You For Supporting Handcrafts!</h2>
          <p className="text-sm text-clay-600">
            Your order has been placed. 90% of your payment is directly routed to the artisan shop.
          </p>
        </div>

        <div className="bg-white border border-clay-200 rounded-2xl p-6 text-left shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-clay-900 border-b border-clay-100 pb-2">Order Information</h3>
          <div className="grid grid-cols-2 gap-y-2.5 text-xs">
            <span className="text-clay-500 font-semibold uppercase">Order ID</span>
            <span className="text-clay-900 font-bold text-right truncate">{orderSuccess.id}</span>
            
            <span className="text-clay-500 font-semibold uppercase">Total Amount</span>
            <span className="text-clay-900 font-bold text-right">₹{parseFloat(orderSuccess.total_amount).toFixed(2)}</span>
            
            <span className="text-clay-500 font-semibold uppercase">Payment Method</span>
            <span className="text-clay-900 font-bold text-right uppercase">{orderSuccess.payment_method}</span>

            <span className="text-clay-500 font-semibold uppercase">Tracking Number</span>
            <span className="text-forest-600 font-bold text-right">{orderSuccess.tracking_id}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
          <Link
            href="/dashboard/customer"
            className="px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Track Order Status
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 bg-clay-100 hover:bg-clay-200 text-clay-800 border border-clay-200 font-semibold rounded-xl text-sm transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (validCart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-6">
        <Package className="h-16 w-16 text-clay-300 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-clay-800">Your Shopping Cart is Empty</h2>
          <p className="text-xs text-clay-500 max-w-xs mx-auto">
            Browse our catalog to discover beautiful clay kitchenware, handloom shawls, and woodwork decorations.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-block px-6 py-3 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
        >
          Browse Shop Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-clay-950 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Cart Items List */}
        <div className="lg:col-span-7 space-y-4">
          {validCart.map((item) => (
            <div
              key={item.product.id}
              className="bg-white border border-clay-200 rounded-2xl p-5 shadow-xs flex gap-4 items-center justify-between"
            >
              <div className="h-16 w-16 bg-clay-50 rounded-xl overflow-hidden shrink-0 border border-clay-100">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title & Seller details */}
              <div className="flex-grow min-w-0">
                <Link href={`/products/${item.product.id}`} className="hover:text-terracotta-500">
                  <h3 className="font-bold text-clay-900 text-sm truncate">{item.product.name}</h3>
                </Link>
                <p className="text-[10px] text-clay-500 uppercase font-semibold mt-0.5">
                  Category: {item.product.category}
                </p>
                <span className="text-sm font-bold text-clay-900 font-serif mt-1 block">
                  ₹{parseFloat(item.product.price).toFixed(2)} each
                </span>
              </div>

              {/* Qty update controls */}
              <div className="flex items-center border border-clay-200 rounded-lg overflow-hidden bg-clay-50 mr-2 shrink-0">
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  className="px-2.5 py-1 text-clay-700 hover:bg-clay-100 font-bold text-xs"
                >
                  -
                </button>
                <span className="px-3 py-1 font-bold text-xs text-clay-900 w-8 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  className="px-2.5 py-1 text-clay-700 hover:bg-clay-100 font-bold text-xs"
                >
                  +
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => removeFromCart(item.product.id)}
                className="p-2 text-clay-400 hover:text-terracotta-500 hover:bg-terracotta-50 rounded-lg transition-colors shrink-0"
                title="Remove item"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          ))}

          {/* Quick Info */}
          <div className="bg-clay-100 border border-clay-200 rounded-xl p-4 text-xs text-clay-700 font-semibold flex items-center justify-between">
            <span>🛡️ Secure SSL Mock Processing</span>
            <span>🌿 Sustainable Earth-Friendly Packaging</span>
          </div>
        </div>

        {/* Right Side: Checkout Form & Total */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-clay-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-serif font-bold text-lg text-clay-900 border-b border-clay-100 pb-3">
              Order Checkout
            </h3>

            {/* Total Details */}
            <div className="space-y-2.5 border-b border-clay-100 pb-4 text-xs font-semibold">
              <div className="flex justify-between text-clay-600">
                <span>Items Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-clay-600">
                <span>Shipping Delivery</span>
                <span>{shippingCharge === 0 ? "FREE" : `₹${shippingCharge.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-clay-950 font-bold text-sm pt-2">
                <span>Grand Total</span>
                <span className="font-serif text-base text-terracotta-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout input form */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              {/* Shipping Address */}
              <div>
                <label className="block text-sm font-semibold text-clay-800 mb-1.5 flex items-center gap-1">
                  <MapPin className="h-4.5 w-4.5 text-terracotta-500" />
                  Delivery Shipping Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street name, landmark, City, Pin/Zip Code, State"
                  className="block w-full border border-clay-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20 placeholder-clay-400"
                />
              </div>

              {/* Phone number */}
              <div>
                <label className="block text-sm font-semibold text-clay-800 mb-1.5 flex items-center gap-1">
                  <Phone className="h-4.5 w-4.5 text-terracotta-500" />
                  Contact Mobile Phone
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="block w-full border border-clay-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-clay-50/20 placeholder-clay-400"
                />
              </div>

              {/* Payment selector */}
              <div>
                <label className="block text-sm font-semibold text-clay-800 mb-2.5 flex items-center gap-1">
                  <CreditCard className="h-4.5 w-4.5 text-terracotta-500" />
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "cod"
                        ? "bg-terracotta-50 border-terracotta-500 text-terracotta-700 shadow-xs"
                        : "bg-clay-50 border-clay-200 text-clay-700 hover:bg-clay-100"
                    }`}
                  >
                    💵 Cash on Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("online")}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "online"
                        ? "bg-terracotta-50 border-terracotta-500 text-terracotta-700 shadow-xs"
                        : "bg-clay-50 border-clay-200 text-clay-700 hover:bg-clay-100"
                    }`}
                  >
                    💳 Card / Online UPI
                  </button>
                </div>
              </div>

              {/* Simulated Card Forms if Online Selected */}
              {paymentMethod === "online" && (
                <div className="bg-clay-100 border border-clay-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-clay-800 uppercase tracking-wider">Simulated Payment Gateway</h4>
                  <div className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        placeholder="Card Number (e.g. 4111 2222 3333 4444)"
                        required
                        value={cardNum}
                        onChange={(e) => setCardNum(e.target.value)}
                        className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-white placeholder-clay-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-white placeholder-clay-400"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full border border-clay-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 focus:border-terracotta-500 text-clay-950 bg-white placeholder-clay-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Checkout */}
              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-3.5 px-4 bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-clay-300 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-4"
              >
                {checkoutLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Confirm & Pay ₹{grandTotal.toFixed(2)}</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
