"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import { X, CheckCircle, Info, AlertTriangle } from "lucide-react";

export default function NotificationToast() {
  const { notifications, removeNotification } = useApp();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
      {notifications.map((n) => {
        let bgColor = "bg-clay-800 text-white";
        let icon = <Info className="h-5 w-5 text-clay-200" />;

        if (n.type === "success") {
          bgColor = "bg-forest-700 text-white";
          icon = <CheckCircle className="h-5 w-5 text-forest-100" />;
        } else if (n.type === "error" || n.type === "warning") {
          bgColor = "bg-terracotta-700 text-white";
          icon = <AlertTriangle className="h-5 w-5 text-terracotta-100" />;
        }

        return (
          <div
            key={n.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-xl transition-all duration-300 transform translate-y-0 scale-100 ${bgColor} border border-opacity-10 border-white`}
          >
            <div className="flex items-center gap-3">
              {icon}
              <p className="text-sm font-medium">{n.message}</p>
            </div>
            <button
              onClick={() => removeNotification(n.id)}
              className="ml-4 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
