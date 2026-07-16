"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { announcementsAPI } from "@/lib/api";
import {
  Megaphone,
  Send,
  Smartphone,
  Layout,
  Calendar,
  User,
  AlertCircle,
  Trash2,
  Users,
  UserCheck,
  Clock,
  Dumbbell,
} from "lucide-react";

// Official WhatsApp Brand Icon SVG
const WhatsAppIcon = ({ size = 14, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    style={{ display: "inline-block", verticalAlign: "middle", ...style }}
    fill="currentColor"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.528 2.01 14.069.99 11.5.99c-5.45 0-9.88 4.39-9.884 9.802-.001 1.778.475 3.51 1.378 5.024L2.003 21.5l5.83-1.513c-1.393-.761-2.316-2.182-2.316-3.81 0-.306.03-.605.088-.895l.024-.121zm11.758-5.321c-.28-.14-1.656-.818-1.913-.911-.257-.093-.444-.14-.63.14-.187.28-.724.911-.887 1.097-.163.186-.327.21-.607.07-.28-.14-1.183-.436-2.254-1.393-.833-.743-1.395-1.66-1.558-1.94-.163-.28-.017-.43.123-.57.125-.125.28-.327.42-.49.14-.163.187-.28.28-.467.094-.187.047-.35-.023-.49-.07-.14-.63-1.517-.863-2.078-.227-.547-.46-.473-.63-.482-.163-.008-.35-.01-.537-.01-.187 0-.49.07-.747.35-.257.28-.98 1.097-.98 2.67 0 1.573 1.144 3.094 1.303 3.305.159.21 2.25 3.437 5.45 4.823.76.329 1.353.525 1.815.672.764.243 1.46.21 2.01.127.613-.09 1.656-.677 1.89-1.332.233-.655.233-1.218.163-1.332-.07-.115-.257-.186-.537-.326z"/>
  </svg>
);

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Everyone (Members + Trainers)", icon: <Users size={14} /> },
  { value: "members", label: "Active Members Only", icon: <Users size={14} /> },
  { value: "trainers", label: "Trainers Only", icon: <UserCheck size={14} /> },
  { value: "expiring", label: "Members with Expiring Membership (≤7 days)", icon: <Clock size={14} /> },
];

const AUDIENCE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  all: { label: "Everyone", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  members: { label: "Members", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  trainers: { label: "Trainers", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  expiring: { label: "Expiring Soon", color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sendToPortal, setSendToPortal] = useState(true);
  const [sendToWhatsapp, setSendToWhatsapp] = useState(false);
  const [targetAudience, setTargetAudience] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementsAPI.getAll();
      setAnnouncements(res.data.data || []);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !content.trim()) {
      setError("Please fill in both title and message content.");
      return;
    }

    const channels: string[] = [];
    if (sendToPortal) channels.push("portal");
    if (sendToWhatsapp) channels.push("whatsapp");

    if (channels.length === 0) {
      setError("Please select at least one delivery channel (Portal or WhatsApp).");
      return;
    }

    setSaving(true);
    try {
      await announcementsAPI.create({ title, content, channels, targetAudience });
      setTitle("");
      setContent("");
      setSendToPortal(true);
      setSendToWhatsapp(false);
      setTargetAudience("all");
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to broadcast announcement.");
    } finally {
      setSaving(false);
    }
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  return (
    <DashboardLayout>
      <div className="page-container">

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Gym Announcements</h1>
            <p className="page-subtitle">Broadcast updates, promotions, or alerts to your members and staff</p>
          </div>
          <button className="btn-primary" onClick={() => { setError(""); setShowModal(true); }}>
            <Megaphone size={16} /> New Broadcast
          </button>
        </div>

        {/* List of past broadcasts */}
        <div className="chart-container" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--silver-200)", marginBottom: "20px" }}>
            Broadcast History ({announcements.length})
          </h2>

          {loading ? (
            <LoadingSpinner size="large" text="Retrieving history…" />
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--silver-500)" }}>
              <Megaphone size={40} style={{ opacity: 0.2, marginBottom: "12px" }} />
              <p>No announcements broadcasted yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {announcements.map((a: any) => {
                const audience = AUDIENCE_BADGE[a.targetAudience || "all"] || AUDIENCE_BADGE.all;
                return (
                  <div key={a._id} style={{
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid var(--border)",
                    borderRadius: "14px",
                    padding: "18px 20px",
                  }}>
                    {/* Header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontWeight: 700, fontSize: "15px", color: "var(--silver-100)", marginBottom: "5px" }}>
                          {a.title}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "14px", fontSize: "12px", color: "var(--silver-500)" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <User size={12} /> {a.sentBy?.fullName || a.sentBy?.username || "Admin"}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Calendar size={12} /> {new Date(a.createdAt).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Tags + Delete */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        {/* Audience badge */}
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "11px", padding: "3px 10px",
                          background: audience.bg,
                          border: `1px solid ${audience.color}30`,
                          borderRadius: "50px", color: audience.color, fontWeight: 700
                        }}>
                          🎯 {audience.label}
                        </span>
                        {/* Channel badges */}
                        {a.channels?.includes("portal") && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "3px 10px", background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.15)", borderRadius: "50px", color: "var(--red-400)", fontWeight: 700 }}>
                            <Dumbbell size={11} /> Portal
                          </span>
                        )}
                        {a.channels?.includes("whatsapp") && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "3px 10px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "50px", color: "var(--green-400)", fontWeight: 700 }}>
                            <WhatsAppIcon size={11} /> WhatsApp
                          </span>
                        )}
                        {/* Delete button */}
                        <button
                          className="btn-ghost"
                          style={{ padding: "6px", color: deleting === a._id ? "var(--silver-700)" : "#ff4d5a", borderRadius: "8px" }}
                          onClick={() => handleDelete(a._id)}
                          disabled={deleting === a._id}
                          title="Delete announcement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Message body */}
                    <p style={{ fontSize: "13px", color: "var(--silver-300)", lineHeight: "1.6", whiteSpace: "pre-line", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
                      {a.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Broadcast Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Compose Broadcast">
        <form onSubmit={handleSubmit} style={{ padding: "4px 8px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b79", fontSize: "13px" }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div>
            <label className="input-label">Broadcast Title *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Gym Holiday Closure / New CrossFit Batch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Message Content *</label>
            <textarea
              className="input-field"
              placeholder="Type your message here..."
              style={{ minHeight: "110px", resize: "vertical" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          {/* Audience Dropdown */}
          <div>
            <label className="input-label">Target Audience</label>
            <select
              className="input-field"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              style={{ background: "var(--bg-input)" }}
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Channels Selection */}
          <div>
            <label className="input-label" style={{ marginBottom: "8px" }}>Delivery Channels</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer", color: "var(--silver-200)" }}>
                <input
                  type="checkbox"
                  checked={sendToPortal}
                  onChange={(e) => setSendToPortal(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#e8192c" }}
                />
                <Dumbbell size={14} style={{ color: "var(--red-400)" }} />
                Publish to Member Portal Dashboard
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer", color: "var(--silver-200)" }}>
                <input
                  type="checkbox"
                  checked={sendToWhatsapp}
                  onChange={(e) => setSendToWhatsapp(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#e8192c" }}
                />
                <WhatsAppIcon size={14} style={{ color: "var(--green-400)" }} />
                Send via WhatsApp Broadcast (Simulated)
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ justifyContent: "center", padding: "13px" }}
            disabled={saving}
          >
            <Send size={15} /> {saving ? "Broadcasting…" : "Send Broadcast"}
          </button>
        </form>
      </Modal>

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          setDeleting(deleteId);
          try {
            await announcementsAPI.delete(deleteId);
            load();
          } catch {
            alert("Failed to delete announcement.");
          } finally {
            setDeleting(null);
          }
        }}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement? This action cannot be undone."
      />
    </DashboardLayout>
  );
}
