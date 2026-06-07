"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("artify_user");
      const storedToken = localStorage.getItem("artify_token");
      const storedCart = localStorage.getItem("artify_cart");
      const storedWishlist = localStorage.getItem("artify_wishlist");

      if (storedUser && storedToken) {
        setUser({
          ...JSON.parse(storedUser),
          token: storedToken,
        });
      }

      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }

      if (storedWishlist) {
        setWishlist(JSON.parse(storedWishlist));
      }

      setLoading(false);
    }
  }, []);

  // Update localStorage when cart changes
  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("artify_cart", JSON.stringify(newCart));
  };

  // Update localStorage when wishlist changes
  const saveWishlist = (newWishlist) => {
    setWishlist(newWishlist);
    localStorage.setItem("artify_wishlist", JSON.stringify(newWishlist));
  };

  // 1. Auth Functions
  const login = (token, userData) => {
    localStorage.setItem("artify_token", token);
    localStorage.setItem("artify_user", JSON.stringify(userData));
    setUser({ ...userData, token });
    addNotification("Logged in successfully!", "success");
  };

  const logout = () => {
    localStorage.removeItem("artify_token");
    localStorage.removeItem("artify_user");
    setUser(null);
    addNotification("Logged out successfully.", "info");
  };

  const updateSellerApproval = (status) => {
    if (user && user.role === "seller") {
      const updatedUser = { ...user, isApprovedSeller: status };
      localStorage.setItem("artify_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  // 2. Cart Functions
  const addToCart = (product, quantity = 1) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let newCart = [...cart];

    if (existingIndex > -1) {
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart.push({ product, quantity });
    }

    saveCart(newCart);
    addNotification(`Added "${product.name}" to cart.`, "success");
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter((item) => item.product.id !== productId);
    saveCart(newCart);
    addNotification("Removed item from cart.", "info");
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const newCart = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  // 3. Wishlist Functions
  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    let newWishlist;

    if (exists) {
      newWishlist = wishlist.filter((item) => item.id !== product.id);
      addNotification(`Removed "${product.name}" from wishlist.`, "info");
    } else {
      newWishlist = [...wishlist, product];
      addNotification(`Added "${product.name}" to wishlist.`, "success");
    }

    saveWishlist(newWishlist);
  };

  // 4. Notifications Functions
  const addNotification = (message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);

    // Auto-remove notification after 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 5. Shared API Request Helper
  const apiRequest = async (endpoint, options = {}) => {
    const baseUrl = typeof window !== "undefined"
      ? `http://${window.location.hostname}:5000/api`
      : "http://localhost:5000/api";
    const headers = {
      "Content-Type": "application/json",
      ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
      const data = await response.json();
      return { status: response.status, data };
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      return { status: 500, data: { success: false, message: "Network error occurred." } };
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        cart,
        wishlist,
        notifications,
        loading,
        login,
        logout,
        updateSellerApproval,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        addNotification,
        removeNotification,
        apiRequest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
