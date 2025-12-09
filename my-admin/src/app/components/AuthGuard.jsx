"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAdminToken } from "@/lib/api";
import LoginForm from "./LoginForm";

export default function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication on mount and when pathname changes
  useEffect(() => {
    const checkAuth = () => {
      const token = getAdminToken();
      console.log("AuthGuard check - token exists:", !!token); // Debug log
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();

    // Also check when storage changes (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === "admin_token") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Check periodically (in case of same-tab updates)
    const interval = setInterval(checkAuth, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}

