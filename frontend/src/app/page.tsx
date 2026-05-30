"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="page-container">
      <div className="submit-btn" style={{ padding: "1.5rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <span className="loading-spinner"></span>
        <span style={{ fontSize: "0.95rem", fontWeight: 600, fontFamily: "sans-serif" }}>
          Initializing Secure Session...
        </span>
      </div>
    </div>
  );
}
