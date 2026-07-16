"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Bell, Menu, Search, X, Check, Eye, EyeOff, Trash2, 
  CreditCard, Calendar, UserCheck, UserPlus, Settings, AlertTriangle, Shield,
  Sun, Moon
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { notificationsAPI } from "@/lib/api";
import { useTheme } from "@/lib/theme";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/members": "Members",
  "/trainers": "Trainers",
  "/attendance": "Attendance",
  "/payments": "Payments",
  "/memberships": "Memberships",
  "/plans": "Membership Plans",
  "/workouts": "Workouts",
  "/diets": "Diet Plans",
  "/reports": "Reports & Analytics",
  "/leads": "Marketing & Ads Leads",
};

// ─── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ isOpen, onClose, admin, refreshMe }: any) {
  const [fullName, setFullName] = useState(admin?.fullName || "");
  const [email, setEmail] = useState(admin?.email || "");
  const [username, setUsername] = useState(admin?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen && admin) {
      setFullName(admin.fullName || "");
      setEmail(admin.email || "");
      setUsername(admin.username || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
      setError("");
      setSuccess("");
    }
  }, [isOpen, admin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const api = (await import("@/lib/api")).authAPI;
      await api.updateMe({ fullName, email, username });

      if (newPassword) {
        if (!currentPassword) {
          setError("Current password is required to change password.");
          setLoading(false);
          return;
        }
        await api.updatePassword({ currentPassword, newPassword });
      }

      setSuccess("Profile updated successfully!");
      await refreshMe();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", zIndex: 9999, padding: "40px 20px" }}>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "24px", width: "100%", maxWidth: "460px", margin: "auto 0", overflow: "hidden", boxShadow: "var(--dropdown-shadow)" }}>
        
        {/* Header */}
        <div style={{ padding: "24px 28px 0", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(232,25,44,0.12)", border: "1px solid rgba(232,25,44,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-400)" }}>
              <Settings size={20} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 800, color: "var(--silver-100)" }}>Edit Profile Details</div>
              <div style={{ fontSize: "12px", color: "var(--silver-600)" }}>Update your personal and login settings</div>
            </div>
            <button type="button" onClick={onClose} style={{ marginLeft: "auto", background: "var(--logo-bg)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--silver-500)", padding: "6px 10px", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && <div style={{ background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.25)", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#ff6b79" }}>{error}</div>}
          {success && <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#22c55e" }}>{success}</div>}

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Full Name</label>
            <input type="text" className="input-field" style={{ width: "100%", padding: "10px 12px" }} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Email Address</label>
            <input type="email" className="input-field" style={{ width: "100%", padding: "10px 12px" }} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Username</label>
            <input type="text" className="input-field" style={{ width: "100%", padding: "10px 12px" }} value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div style={{ height: "1px", background: "var(--border)", margin: "8px 0" }} />
          
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Change Password (Optional)</div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Current Password</label>
            <div style={{ position: "relative" }}>
              <input type={showCurrentPass ? "text" : "password"} className="input-field" style={{ width: "100%", padding: "10px 40px 10px 12px" }} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              <button
                type="button"
                onClick={() => setShowCurrentPass((p) => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--silver-500)", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input type={showNewPass ? "text" : "password"} className="input-field" style={{ width: "100%", padding: "10px 40px 10px 12px" }} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowNewPass((p) => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--silver-500)", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Confirm New</label>
              <div style={{ position: "relative" }}>
                <input type={showConfirmPass ? "text" : "password"} className="input-field" style={{ width: "100%", padding: "10px 40px 10px 12px" }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((p) => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--silver-500)", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button type="button" className="btn-secondary" style={{ flex: 1, padding: "12px", justifyContent: "center" }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 2, padding: "12px", justifyContent: "center" }} disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, refreshMe } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Search states
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const title =
    Object.entries(pageTitles).find(([key]) =>
      key === "/" ? pathname === "/" : pathname.startsWith(key)
    )?.[1] || "AlphaLift";

  // Load notifications from backend
  const loadNotifications = useCallback(async () => {
    if (!admin) return;
    try {
      const res = await notificationsAPI.getAll();
      if (res.data.success) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, [admin]);

  // Initial fetch and polling every 15s to keep notifications alive
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global search effect
  useEffect(() => {
    if (!searchVal.trim()) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const { dashboardAPI } = await import("@/lib/api");
        const res = await dashboardAPI.globalSearch(searchVal);
        if (res.data.success) {
          setSearchResults(res.data.data);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error("Global search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

  const handleResultClick = (url: string) => {
    setSearchVal("");
    setShowSearchResults(false);
    router.push(url);
  };

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markRead(id);
      loadNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      loadNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_received":
      case "payment_due":
        return <CreditCard size={15} style={{ color: "#22c55e" }} />;
      case "membership_expiry":
        return <AlertTriangle size={15} style={{ color: "#fbbf24" }} />;
      case "workout_assigned":
      case "diet_assigned":
        return <Calendar size={15} style={{ color: "#3b82f6" }} />;
      case "system":
        return <Settings size={15} style={{ color: "#a855f7" }} />;
      case "general":
        return <UserPlus size={15} style={{ color: "#fb923c" }} />;
      default:
        return <Bell size={15} style={{ color: "var(--silver-400)" }} />;
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      // Use the notifications API delete endpoint
      const api = (await import("@/lib/api")).default;
      await api.delete(`/notifications/${id}`);
      loadNotifications();
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          left: "var(--sidebar-width)",
          height: "var(--header-height)",
          background: "var(--header-bg)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 100,
          transition: "left 0.3s ease",
        }}
      >
      {/* Left: menu + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          className="btn-ghost"
          onClick={onMenuToggle}
          style={{ padding: "8px" }}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--silver-100)",
            }}
          >
            {title}
          </h2>
        </div>
      </div>

      {/* Right: search + notif + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Search */}
        <div 
          ref={searchContainerRef}
          className="search-input-wrapper" 
          style={{ display: "flex", alignItems: "center", position: "relative" }}
        >
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search anything..."
            className="search-input"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => { if (searchVal.trim()) setShowSearchResults(true); }}
          />
          {searchVal && (
            <button
              onClick={() => setSearchVal("")}
              style={{
                position: "absolute",
                right: "10px",
                background: "none",
                border: "none",
                color: "var(--silver-500)",
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          )}

          {/* Search Results Dropdown Overlay */}
          {showSearchResults && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                width: "360px",
                marginTop: "8px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "var(--dropdown-shadow)",
                maxHeight: "350px",
                overflowY: "auto",
                zIndex: 100,
                padding: "12px",
              }}
            >
              {searching ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--silver-500)", fontSize: "12px" }}>
                  Searching...
                </div>
              ) : (!searchResults || (
                (searchResults.members || []).length === 0 &&
                (searchResults.trainers || []).length === 0 &&
                (searchResults.plans || []).length === 0 &&
                (searchResults.workouts || []).length === 0 &&
                (searchResults.diets || []).length === 0
              )) ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--silver-500)", fontSize: "12px" }}>
                  No results found for "{searchVal}"
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Members */}
                  {searchResults.members && searchResults.members.length > 0 && (
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--silver-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px", borderBottom: "1px solid var(--border)", marginBottom: "6px" }}>
                        Members
                      </div>
                      {searchResults.members.map((m: any) => (
                        <div
                          key={m._id}
                          onClick={() => handleResultClick(`/members/${m._id}`)}
                          style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", flexDirection: "column", transition: "background 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)" }}>{m.firstName} {m.lastName}</span>
                          <span style={{ fontSize: "11px", color: "var(--silver-500)", marginTop: "2px" }}>{m.contact?.phone || m.contact?.email}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trainers */}
                  {searchResults.trainers && searchResults.trainers.length > 0 && (
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--silver-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px", borderBottom: "1px solid var(--border)", marginBottom: "6px" }}>
                        Trainers
                      </div>
                      {searchResults.trainers.map((t: any) => (
                        <div
                          key={t._id}
                          onClick={() => handleResultClick(`/trainers`)}
                          style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", flexDirection: "column", transition: "background 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)" }}>{t.fullName}</span>
                          <span style={{ fontSize: "11px", color: "var(--silver-500)", marginTop: "2px" }}>{t.specialization?.join(", ") || "Trainer"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Plans */}
                  {searchResults.plans && searchResults.plans.length > 0 && (
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--silver-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px", borderBottom: "1px solid var(--border)", marginBottom: "6px" }}>
                        Membership Plans
                      </div>
                      {searchResults.plans.map((p: any) => (
                        <div
                          key={p._id}
                          onClick={() => handleResultClick(`/plans`)}
                          style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", flexDirection: "column", transition: "background 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)" }}>{p.name}</span>
                          <span style={{ fontSize: "11px", color: "var(--silver-500)", marginTop: "2px" }}>₹{p.price?.toLocaleString()} · {p.duration} months</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Workouts */}
                  {searchResults.workouts && searchResults.workouts.length > 0 && (
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--silver-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px", borderBottom: "1px solid var(--border)", marginBottom: "6px" }}>
                        Workout Templates
                      </div>
                      {searchResults.workouts.map((w: any) => (
                        <div
                          key={w._id}
                          onClick={() => handleResultClick(`/workouts`)}
                          style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", flexDirection: "column", transition: "background 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)" }}>{w.planName}</span>
                          <span style={{ fontSize: "11px", color: "var(--silver-500)", marginTop: "2px" }}>{w.planType} · {w.difficultyLevel}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Diets */}
                  {searchResults.diets && searchResults.diets.length > 0 && (
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--silver-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px", borderBottom: "1px solid var(--border)", marginBottom: "6px" }}>
                        Diet Templates
                      </div>
                      {searchResults.diets.map((d: any) => (
                        <div
                          key={d._id}
                          onClick={() => handleResultClick(`/diets`)}
                          style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", display: "flex", flexDirection: "column", transition: "background 0.2s" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-elevated)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)" }}>{d.planName}</span>
                          <span style={{ fontSize: "11px", color: "var(--silver-500)", marginTop: "2px" }}>{d.planType} · {d.dailyCalories} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          className="btn-ghost"
          style={{ padding: "8px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Edit Profile Button */}
        <button
          className="btn-ghost"
          style={{ padding: "8px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowEditProfileModal(true)}
          title="Edit Profile Details"
          aria-label="Edit Profile Details"
        >
          <Settings size={18} />
        </button>

        {/* Notifications Bell with Dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            className={`btn-ghost ${showNotifications ? "active" : ""}`}
            style={{ position: "relative", padding: "8px" }}
            onClick={() => {
              setShowNotifications(!showNotifications);
              loadNotifications();
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="notification-dot"
                style={{ 
                  position: "absolute", 
                  top: "6px", 
                  right: "6px",
                  background: "#e8192c",
                  color: "white",
                  fontSize: "9px",
                  fontWeight: 950,
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 8px rgba(232,25,44,0.6)"
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Premium Dropdown Panel */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 10px)",
                width: "360px",
                background: "var(--dropdown-bg)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                boxShadow: "var(--dropdown-shadow)",
                backdropFilter: "blur(20px)",
                overflow: "hidden",
                zIndex: 100,
                animation: "slideDown 0.2s ease"
              }}
            >
              {/* Dropdown Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--silver-100)" }}>Alert Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ background: "rgba(232,25,44,0.15)", color: "#ff4d5a", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px" }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--red-400)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Check size={13} /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      style={{
                        padding: "14px 20px",
                        borderBottom: "1px solid var(--border)",
                        background: n.isRead ? "transparent" : "rgba(232,25,44,0.02)",
                        transition: "background 0.2s ease",
                        display: "flex",
                        gap: "12px",
                        position: "relative"
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          background: n.isRead ? "rgba(255,255,255,0.03)" : "rgba(232,25,44,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: n.isRead ? 500 : 700,
                            color: n.isRead ? "var(--silver-300)" : "var(--silver-100)",
                            marginBottom: "2px"
                          }}
                        >
                          {n.title}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--silver-500)",
                            lineHeight: "1.4",
                            marginBottom: "6px"
                          }}
                        >
                          {n.message}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--silver-600)" }}>
                          {new Date(n.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      </div>

                       {/* Actions: Mark read + Delete */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                        {!n.isRead && (
                          <button
                            onClick={(e) => handleMarkRead(e, n._id)}
                            title="Mark as read"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "none",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--silver-400)",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(34,197,94,0.15)";
                              e.currentTarget.style.color = "#22c55e";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                              e.currentTarget.style.color = "var(--silver-400)";
                            }}
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, n._id)}
                          title="Dismiss"
                          style={{
                            background: "transparent",
                            border: "none",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--silver-600)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#ff4d5a";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--silver-600)";
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--silver-500)" }}>
                    <Bell size={24} style={{ opacity: 0.3, marginBottom: "8px" }} />
                    <p style={{ fontSize: "13px" }}>No notifications found</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            className="avatar"
            style={{ width: 34, height: 34, fontSize: 13, cursor: "pointer" }}
          >
            {(admin?.fullName || admin?.username || "A").charAt(0)}
          </div>
          <div className="user-name-wrapper" style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)" }}>
              {admin?.fullName || admin?.username || "Admin"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--silver-500)", textTransform: "capitalize" }}>
              {admin?.role}
            </span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          header {
            left: 0 !important;
            padding: 0 16px !important;
          }
          .search-input-wrapper {
            display: none !important;
          }
          .user-name-wrapper {
            display: none !important;
          }
        }
      `}</style>
    </header>

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        admin={admin}
        refreshMe={refreshMe}
      />
    </>
  );
}
