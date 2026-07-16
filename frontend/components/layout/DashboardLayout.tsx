"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--bg-base)",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Animated logo spinner */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "14px",
            background: "linear-gradient(135deg, #b01020, #e8192c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse-red 1.5s infinite",
            boxShadow: "0 0 30px rgba(232,25,44,0.5)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div style={{ color: "var(--silver-500)", fontSize: "13px" }}>Loading AlphaLift…</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)" }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          marginLeft: "var(--sidebar-width)",
          transition: "margin-left 0.3s ease",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Header onMenuToggle={() => setMobileOpen((p) => !p)} />

        <main
          style={{
            flex: 1,
            marginTop: "var(--header-height)",
            overflowX: "hidden",
          }}
        >
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          main + div, div > main { margin-left: var(--sidebar-collapsed) !important; }
        }
        @media (max-width: 768px) {
          div[style*="margin-left: var(--sidebar-width)"] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
