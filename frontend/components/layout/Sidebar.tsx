"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  CreditCard,
  Award,
  ClipboardList,
  Dumbbell,
  Salad,
  LogOut,
  ChevronRight,
  Zap,
  TrendingUp,
  Megaphone,
  UserPlus,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navSections = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: <LayoutDashboard size={18} /> },
      { label: "Reports", href: "/reports", icon: <TrendingUp size={18} /> },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Members", href: "/members", icon: <Users size={18} /> },
      { label: "Trainers", href: "/trainers", icon: <UserCheck size={18} /> },
      { label: "Attendance", href: "/attendance", icon: <CalendarCheck size={18} /> },
      { label: "Announcements", href: "/announcements", icon: <Megaphone size={18} /> },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payments", href: "/payments", icon: <CreditCard size={18} /> },
      { label: "Memberships", href: "/memberships", icon: <Award size={18} /> },
      { label: "Plans", href: "/plans", icon: <ClipboardList size={18} /> },
    ],
  },
  {
    title: "Programs",
    items: [
      { label: "Workouts", href: "/workouts", icon: <Dumbbell size={18} /> },
      { label: "Diet Plans", href: "/diets", icon: <Salad size={18} /> },
    ],
  },
];

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const getFilteredSections = () => {
    const isTrainer = admin?.role === 'trainer';
    const permissions = admin?.permissions || {
      canManageMembers: false,
      canViewReports: false,
      canManageTrainers: false,
      canManagePlans: false,
      canManagePayments: false
    };

    const sections = [];

    // Overview Section
    if (!isTrainer && permissions.canViewReports) {
      sections.push({
        title: "Overview",
        items: [
          { label: "Dashboard", href: "/", icon: <LayoutDashboard size={18} /> },
          { label: "Reports", href: "/reports", icon: <TrendingUp size={18} /> },
        ]
      });
    }

    const mgmtItems = [];
    if (!isTrainer && permissions.canManageMembers) {
      mgmtItems.push({ label: "Leads", href: "/leads", icon: <UserPlus size={18} /> });
    }
    mgmtItems.push({ label: "Members", href: "/members", icon: <Users size={18} /> });
    if (!isTrainer) {
      if (permissions.canManageTrainers) {
        mgmtItems.push({ label: "Trainers", href: "/trainers", icon: <UserCheck size={18} /> });
      }
      mgmtItems.push({ label: "Attendance", href: "/attendance", icon: <CalendarCheck size={18} /> });
      mgmtItems.push({ label: "Announcements", href: "/announcements", icon: <Megaphone size={18} /> });
    }
    sections.push({
      title: "Management",
      items: mgmtItems
    });

    // Finance Section
    if (!isTrainer) {
      const finItems = [];
      if (permissions.canManagePayments) {
        finItems.push({ label: "Payments", href: "/payments", icon: <CreditCard size={18} /> });
      }
      finItems.push({ label: "Memberships", href: "/memberships", icon: <Award size={18} /> });
      if (permissions.canManagePlans) {
        finItems.push({ label: "Plans", href: "/plans", icon: <ClipboardList size={18} /> });
      }
      if (finItems.length > 0) {
        sections.push({
          title: "Finance",
          items: finItems
        });
      }
    }

    // Programs Section
    sections.push({
      title: "Programs",
      items: [
        { label: "Workouts", href: "/workouts", icon: <Dumbbell size={18} /> },
        { label: "Diet Plans", href: "/diets", icon: <Salad size={18} /> },
      ]
    });

    return sections;
  };

  const filteredSections = getFilteredSections();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Logo */}
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              boxShadow: "0 0 16px rgba(232,25,44,0.2)",
              background: "var(--logo-bg)"
            }}
          >
            <img 
              src="/GymLogo.png" 
              alt="Logo" 
              style={{ width: "100%", height: "100%", objectFit: "contain" }} 
            />
          </div>
          <div className="sidebar-logo-text">
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "18px",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              <span style={{ color: "var(--silver-200)" }}>ALPHA</span>
              <span style={{ color: "var(--red-500)" }}>LIFT</span>
            </div>
            <div style={{ fontSize: "9px", color: "var(--silver-600)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Gym Management
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {filteredSections.map((section) => (
            <div key={section.title}>
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-item ${isActive(item.href) ? "active" : ""}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {isActive(item.href) && (
                    <ChevronRight size={12} style={{ marginLeft: "auto", color: "var(--red-500)" }} className="nav-label" />
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Admin profile + logout */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div
              className="avatar"
              style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}
            >
              {(admin?.fullName || admin?.username || "A").charAt(0)}
            </div>
            <div className="sidebar-logo-text" style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {admin?.fullName || admin?.username || "Admin"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--silver-600)", textTransform: "capitalize" }}>
                {admin?.role || "admin"}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-ghost"
            style={{ width: "100%", justifyContent: "center", color: "var(--silver-500)" }}
          >
            <LogOut size={15} />
            <span className="nav-label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
