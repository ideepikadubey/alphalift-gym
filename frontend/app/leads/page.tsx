"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { leadsAPI } from "@/lib/api";
import { 
  Users, UserPlus, Phone, Mail, Award, CheckCircle2, 
  HelpCircle, Clock, Trash2, Pencil, Search, RefreshCw,
  TrendingUp, Globe, Sparkles, AlertCircle
} from "lucide-react";

type LeadStatus = "all" | "new" | "contacted" | "in_progress" | "converted" | "lost";
type LeadSource = "all" | "google_my_business" | "meta_ads" | "instagram_ads" | "referral" | "walk_in" | "other";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  all: { label: "All Leads", color: "var(--silver-300)" },
  new: { label: "New", color: "var(--blue-400)" },
  contacted: { label: "Contacted", color: "var(--yellow-400)" },
  in_progress: { label: "In Progress", color: "#a855f7" },
  converted: { label: "Converted", color: "var(--green-400)" },
  lost: { label: "Lost", color: "var(--silver-500)" },
};

const SOURCE_LABELS: Record<string, string> = {
  google_my_business: "Google My Business",
  meta_ads: "Meta Ads",
  instagram_ads: "Instagram Ads",
  referral: "Referral",
  walk_in: "Walk-in",
  other: "Other"
};

const SOURCE_COLORS: Record<string, string> = {
  google_my_business: "#ea4335", // Google red/orange
  meta_ads: "#1877f2",           // Facebook blue
  instagram_ads: "#e1306c",      // Instagram pink
  referral: "#10b981",          // Green
  walk_in: "#fbbf24",           // Amber
  other: "var(--silver-500)"    // Gray
};

function LeadFormModal({ isOpen, onClose, lead, onSuccess }: any) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "other",
    status: "new",
    notes: "",
    followUpDate: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (lead) {
      setForm({
        name: lead.name || "",
        phone: lead.contact?.phone || "",
        email: lead.contact?.email || "",
        source: lead.source || "other",
        status: lead.status || "new",
        notes: lead.notes || "",
        followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split("T")[0] : ""
      });
    } else {
      setForm({
        name: "",
        phone: "",
        email: "",
        source: "other",
        status: "new",
        notes: "",
        followUpDate: ""
      });
    }
  }, [lead, isOpen]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required");
    if (!form.phone.trim()) return setError("Phone number is required");

    setSaving(true);
    try {
      const body = {
        name: form.name,
        contact: {
          phone: form.phone,
          email: form.email || undefined
        },
        source: form.source,
        status: form.status,
        notes: form.notes,
        followUpDate: form.followUpDate || undefined
      };

      if (lead) {
        await leadsAPI.update(lead._id, body);
      } else {
        await leadsAPI.create(body);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save lead details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? "Edit Lead Details" : "Add New Lead"}
      subtitle={lead ? "Update the information for this prospect" : "Manually log a lead interest source"}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit as any} disabled={saving}>
            {saving ? "Saving…" : lead ? "Save Changes" : "Create Lead"}
          </button>
        </>
      }
    >
      {error && (
        <div style={{ background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#ff6b79" }}>
          {error}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="input-label">Lead Name *</label>
          <input className="input-field" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Rahul Sharma" required />
        </div>
        <div>
          <label className="input-label">Phone Number *</label>
          <input className="input-field" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 9876543210" required />
        </div>
        <div>
          <label className="input-label">Email Address</label>
          <input className="input-field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="e.g. rahul@example.com" />
        </div>
        <div>
          <label className="input-label">Lead Source</label>
          <select className="input-field" value={form.source} onChange={(e) => set("source", e.target.value)} style={{ background: "var(--bg-input)" }}>
            {Object.entries(SOURCE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">Status</label>
          <select className="input-field" value={form.status} onChange={(e) => set("status", e.target.value)} style={{ background: "var(--bg-input)" }}>
            {Object.entries(STATUS_CONFIG).filter(([k]) => k !== "all").map(([k, cfg]) => (
              <option key={k} value={k}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="input-label">Follow-up Date</label>
          <input className="input-field" type="date" value={form.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="input-label">Interaction Notes</label>
          <textarea className="input-field" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Enquired about annual packages, will visit tomorrow." style={{ resize: "vertical" }} />
        </div>
      </div>
    </Modal>
  );
}

export default function LeadsPage() {
  const [tab, setTab] = useState<LeadStatus>("all");
  const [sourceFilter, setSourceFilter] = useState<LeadSource>("all");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, converted: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (tab !== "all") params.status = tab;
      if (sourceFilter !== "all") params.source = sourceFilter;
      if (search.trim()) params.search = search.trim();

      const [res, statsAllRes] = await Promise.all([
        leadsAPI.getAll(params),
        leadsAPI.getAll({ limit: 1000 })
      ]);

      setLeads(res.data.data || []);
      setTotal(res.data.total || 0);

      // Compute simple stats metrics from raw list
      const rawLeads = statsAllRes.data.data || [];
      setStats({
        total: rawLeads.length,
        new: rawLeads.filter((l: any) => l.status === "new").length,
        inProgress: rawLeads.filter((l: any) => l.status === "in_progress" || l.status === "contacted").length,
        converted: rawLeads.filter((l: any) => l.status === "converted").length
      });

    } catch (err) {
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, sourceFilter, search, page, limit]);

  useEffect(() => { setPage(1); }, [tab, sourceFilter]);
  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const getStatusBadgeVariant = (status: string): any => {
    if (status === "new") return "pending";
    if (status === "contacted") return "pending";
    if (status === "in_progress") return "active";
    if (status === "converted") return "active";
    return "cancelled";
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Marketing & Ads Leads</h1>
            <p className="page-subtitle">Track prospective queries from Meta, Instagram and Google Business Profiles</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-secondary" onClick={load}><RefreshCw size={15} /> Refresh</button>
            <button className="btn-primary" onClick={() => { setEditLead(null); setShowModal(true); }}>
              <UserPlus size={16} /> Add Prospect Lead
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: "Total Leads", value: stats.total, icon: <Users size={20} />, color: "var(--silver-400)", bg: "rgba(255,255,255,0.03)" },
            { label: "New / Uncontacted", value: stats.new, icon: <Clock size={20} />, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
            { label: "In Follow-up", value: stats.inProgress, icon: <TrendingUp size={20} />, color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
            { label: "Converted to Member", value: stats.converted, icon: <CheckCircle2 size={20} />, color: "var(--green-400)", bg: "rgba(34,197,94,0.1)" }
          ].map((item, idx) => (
            <div key={idx} className="stat-card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", color: "var(--silver-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</span>
                <div style={{ width: 36, height: 36, background: item.bg, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: item.color }}>
                  {item.icon}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "var(--silver-100)" }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="chart-container" style={{ marginBottom: "20px", padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            
            {/* Search */}
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: "240px" }}>
              <Search className="search-icon" />
              <input
                className="search-input"
                placeholder="Search by name or phone number…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Source select filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--silver-500)", fontWeight: 600 }}>Source:</span>
              <select 
                className="input-field" 
                value={sourceFilter} 
                onChange={(e) => setSourceFilter(e.target.value as LeadSource)}
                style={{ width: "180px", padding: "8px 12px", fontSize: "13px", background: "var(--bg-input)" }}
              >
                <option value="all">All Sources</option>
                {Object.entries(SOURCE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab status selectors */}
        <div className="tab-list" style={{ marginBottom: "20px" }}>
          {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
            <button 
              key={k} 
              className={`tab-btn ${tab === k ? "active" : ""}`} 
              onClick={() => setTab(k as LeadStatus)}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="chart-container" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <LoadingSpinner fullPage size={32} text="Loading leads..." />
          ) : leads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--silver-500)" }}>
              <Globe size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>No leads matches found</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lead Prospect</th>
                    <th>Contact</th>
                    <th>Marketing Source</th>
                    <th>Status</th>
                    <th>Follow-up Date</th>
                    <th>Interaction Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l: any) => (
                    <tr key={l._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                            {l.name?.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--silver-100)" }}>{l.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--silver-500)" }}>Joined: {new Date(l.createdAt).toLocaleDateString("en-IN")}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <div style={{ fontSize: "12px", color: "var(--silver-300)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Phone size={11} style={{ opacity: 0.5 }} /> {l.contact?.phone}
                          </div>
                          {l.contact?.email && (
                            <div style={{ fontSize: "11px", color: "var(--silver-500)", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Mail size={11} style={{ opacity: 0.5 }} /> {l.contact.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span 
                          style={{ 
                            fontSize: "11px", 
                            fontWeight: 700, 
                            padding: "3px 8px", 
                            borderRadius: "50px", 
                            color: "white", 
                            background: SOURCE_COLORS[l.source] || "var(--silver-600)"
                          }}
                        >
                          {SOURCE_LABELS[l.source] || l.source}
                        </span>
                      </td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(l.status)} dot>
                          {l.status?.replace("_", " ")}
                        </Badge>
                      </td>
                      <td style={{ fontSize: "12px", color: l.followUpDate && new Date(l.followUpDate) < new Date() ? "#ff4d5a" : "var(--silver-400)" }}>
                        {l.followUpDate ? new Date(l.followUpDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td>
                        <p style={{ fontSize: "12px", color: "var(--silver-400)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={l.notes}>
                          {l.notes || "—"}
                        </p>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button className="btn-ghost" style={{ padding: "6px" }} onClick={() => { setEditLead(l); setShowModal(true); }}>
                            <Pencil size={14} />
                          </button>
                          <button className="btn-ghost" style={{ padding: "6px", color: "#ff4d5a" }} onClick={() => handleDelete(l._id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
                showing={leads.length}
              />
            </>
          )}
        </div>
      </div>

      <LeadFormModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        lead={editLead} 
        onSuccess={() => { setShowModal(false); load(); }} 
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await leadsAPI.delete(deleteId);
            load();
          } catch {
            alert("Failed to delete lead record.");
          }
        }}
        title="Delete Lead Prospect"
        message="Are you sure you want to permanently delete this lead? All interaction history will be deleted."
      />
    </DashboardLayout>
  );
}
