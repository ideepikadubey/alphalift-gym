"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Badge, { getBadgeVariant } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { membersAPI } from "@/lib/api";
import {
  UserPlus, Search, Eye, Pencil, Trash2,
  Phone, Users, Check, X, AlertTriangle
} from "lucide-react";
import Link from "next/link";

const GOALS_LABELS: Record<string, string> = {
  weight_loss: "Weight Loss", muscle_gain: "Muscle Gain",
  flexibility: "Flexibility", endurance: "Endurance",
  strength: "Strength", general_fitness: "General Fitness"
};

type FilterTab = "all" | "active" | "inactive" | "pending";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All Members" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "pending", label: "Pending Approval" },
];

function MemberFormModal({ isOpen, onClose, member, onSuccess }: any) {
  const emptyForm = {
    firstName: "",
    lastName: "",
    gender: "male",
    dateOfBirth: "",
    occupation: "",
    "contact.phone": "",
    "contact.email": "",
    "contact.emergencyContact.name": "",
    "contact.emergencyContact.phone": "",
    "address.street": "",
    "address.city": "Jaipur",
    "address.state": "Rajasthan",
    "address.pincode": "",
    "address.fullAddress": "",
    "physicalStats.heightCm": "",
    "physicalStats.weightKg": "",
    "physicalStats.bodyFatPercentage": "",
    "physicalStats.muscleMassKg": "",
    medicalConditions: "",
    fitnessGoals: [] as string[],
    emergencyConsent: false,
    termsAccepted: true,
    isActive: true,
  };

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (member) {
      setForm({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        gender: member.gender || "male",
        dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth).toISOString().split("T")[0] : "",
        occupation: member.occupation || "",
        "contact.phone": member.contact?.phone || "",
        "contact.email": member.contact?.email || "",
        "contact.emergencyContact.name": member.contact?.emergencyContact?.name || "",
        "contact.emergencyContact.phone": member.contact?.emergencyContact?.phone || "",
        "address.street": member.address?.street || "",
        "address.city": member.address?.city || "Jaipur",
        "address.state": member.address?.state || "Rajasthan",
        "address.pincode": member.address?.pincode || "",
        "address.fullAddress": member.address?.fullAddress || "",
        "physicalStats.heightCm": member.physicalStats?.heightCm || "",
        "physicalStats.weightKg": member.physicalStats?.weightKg || "",
        "physicalStats.bodyFatPercentage": member.physicalStats?.bodyFatPercentage || "",
        "physicalStats.muscleMassKg": member.physicalStats?.muscleMassKg || "",
        medicalConditions: (member.medicalConditions || []).join(", "),
        fitnessGoals: member.fitnessGoals || [],
        emergencyConsent: !!member.emergencyConsent,
        termsAccepted: member.termsAccepted !== false,
        isActive: member.isActive !== false,
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }, [member, isOpen]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || undefined,
        occupation: form.occupation || undefined,
        contact: {
          phone: form["contact.phone"],
          email: form["contact.email"] || undefined,
          emergencyContact: {
            name: form["contact.emergencyContact.name"] || undefined,
            phone: form["contact.emergencyContact.phone"] || undefined,
          }
        },
        address: {
          street: form["address.street"],
          city: form["address.city"],
          state: form["address.state"],
          pincode: form["address.pincode"],
          fullAddress: form["address.fullAddress"],
        },
        physicalStats: {
          heightCm: form["physicalStats.heightCm"] ? Number(form["physicalStats.heightCm"]) : undefined,
          weightKg: form["physicalStats.weightKg"] ? Number(form["physicalStats.weightKg"]) : undefined,
          bodyFatPercentage: form["physicalStats.bodyFatPercentage"] ? Number(form["physicalStats.bodyFatPercentage"]) : undefined,
          muscleMassKg: form["physicalStats.muscleMassKg"] ? Number(form["physicalStats.muscleMassKg"]) : undefined,
        },
        medicalConditions: form.medicalConditions.split(",").map((s) => s.trim()).filter(Boolean),
        fitnessGoals: form.fitnessGoals,
        emergencyConsent: form.emergencyConsent,
        termsAccepted: form.termsAccepted,
        isActive: form.isActive,
      };
      if (member) await membersAPI.update(member._id, body);
      else await membersAPI.create(body);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save member");
    } finally { setSaving(false); }
  };

  const Section = ({ title }: { title: string }) => (
    <div style={{ gridColumn: "1 / -1", borderBottom: "1px solid var(--border)", paddingBottom: "6px", marginTop: "12px" }}>
      <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--red-400)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{title}</h4>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={member ? "Edit Member Details" : "Register Gym Member"}>
      <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", padding: "8px" }}>
        {error && (
          <div style={{ gridColumn: "1 / -1", background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b79", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center" }}>
            <AlertTriangle size={14} /> {error}
          </div>
        )}

        {/* ── Identity ── */}
        <Section title="Identity Details" />
        <div>
          <label className="input-label">First Name *</label>
          <input className="input-field" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="First name" required />
        </div>
        <div>
          <label className="input-label">Last Name</label>
          <input className="input-field" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Last name" />
        </div>
        <div>
          <label className="input-label">Gender *</label>
          <select className="input-field" value={form.gender} onChange={(e) => set("gender", e.target.value)} style={{ background: "var(--bg-input)", color: "var(--silver-100)", paddingRight: "32px" }}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="input-label">Date of Birth</label>
          <input className="input-field" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} style={{ background: "var(--bg-input)", color: "var(--silver-100)" }} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="input-label">Occupation</label>
          <input className="input-field" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="e.g. Software Engineer, Student…" />
        </div>

        {/* ── Contact ── */}
        <Section title="Contact Details" />
        <div>
          <label className="input-label">Phone Number * (Login ID)</label>
          <input className="input-field" value={form["contact.phone"]} onChange={(e) => set("contact.phone", e.target.value)} placeholder="10-digit mobile" required />
        </div>
        <div>
          <label className="input-label">Email Address</label>
          <input className="input-field" type="email" value={form["contact.email"]} onChange={(e) => set("contact.email", e.target.value)} placeholder="email@example.com" />
        </div>
        <div>
          <label className="input-label">Emergency Contact Name</label>
          <input className="input-field" value={form["contact.emergencyContact.name"]} onChange={(e) => set("contact.emergencyContact.name", e.target.value)} placeholder="Parent / Spouse name" />
        </div>
        <div>
          <label className="input-label">Emergency Contact Phone</label>
          <input className="input-field" value={form["contact.emergencyContact.phone"]} onChange={(e) => set("contact.emergencyContact.phone", e.target.value)} placeholder="Emergency phone number" />
        </div>

        {/* ── Address ── */}
        <Section title="Address" />
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="input-label">Street Address</label>
          <input className="input-field" value={form["address.street"]} onChange={(e) => set("address.street", e.target.value)} placeholder="House No., Street, Area" />
        </div>
        <div>
          <label className="input-label">City</label>
          <input className="input-field" value={form["address.city"]} onChange={(e) => set("address.city", e.target.value)} placeholder="Jaipur" />
        </div>
        <div>
          <label className="input-label">State</label>
          <input className="input-field" value={form["address.state"]} onChange={(e) => set("address.state", e.target.value)} placeholder="Rajasthan" />
        </div>
        <div>
          <label className="input-label">Pincode</label>
          <input className="input-field" value={form["address.pincode"]} onChange={(e) => set("address.pincode", e.target.value)} placeholder="302001" />
        </div>
        <div>
          <label className="input-label">Landmark / Full Address</label>
          <input className="input-field" value={form["address.fullAddress"]} onChange={(e) => set("address.fullAddress", e.target.value)} placeholder="Near X, Behind Y" />
        </div>

        {/* ── Physical Stats ── */}
        <Section title="Physical Stats" />
        <div>
          <label className="input-label">Height (cm)</label>
          <input className="input-field" type="number" value={form["physicalStats.heightCm"]} onChange={(e) => set("physicalStats.heightCm", e.target.value)} placeholder="e.g. 170" />
        </div>
        <div>
          <label className="input-label">Weight (kg)</label>
          <input className="input-field" type="number" value={form["physicalStats.weightKg"]} onChange={(e) => set("physicalStats.weightKg", e.target.value)} placeholder="e.g. 70" />
        </div>
        <div>
          <label className="input-label">Body Fat (%)</label>
          <input className="input-field" type="number" value={form["physicalStats.bodyFatPercentage"]} onChange={(e) => set("physicalStats.bodyFatPercentage", e.target.value)} placeholder="e.g. 18" />
        </div>
        <div>
          <label className="input-label">Muscle Mass (kg)</label>
          <input className="input-field" type="number" value={form["physicalStats.muscleMassKg"]} onChange={(e) => set("physicalStats.muscleMassKg", e.target.value)} placeholder="e.g. 35" />
        </div>

        {/* ── Medical & Goals ── */}
        <Section title="Medical & Fitness Goals" />
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="input-label">Medical Conditions (comma-separated)</label>
          <input className="input-field" value={form.medicalConditions} onChange={(e) => set("medicalConditions", e.target.value)} placeholder="Asthma, Hypertension, Diabetes…" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="input-label" style={{ marginBottom: "8px" }}>Fitness Goals</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            {Object.entries(GOALS_LABELS).map(([key, label]) => {
              const isChecked = (form.fitnessGoals || []).includes(key);
              return (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", color: "var(--silver-200)" }}>
                  <input type="checkbox" checked={isChecked}
                    onChange={() => {
                      const next = isChecked
                        ? (form.fitnessGoals || []).filter((g: string) => g !== key)
                        : [...(form.fitnessGoals || []), key];
                      set("fitnessGoals", next);
                    }}
                    style={{ cursor: "pointer", width: "14px", height: "14px", accentColor: "#e8192c" }}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Consents ── */}
        <Section title="Consents & Status" />
        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer", color: "var(--silver-200)" }}>
            <input type="checkbox" checked={form.emergencyConsent} onChange={(e) => set("emergencyConsent", e.target.checked)} style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "#e8192c" }} />
            Emergency Medical Consent Granted
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer", color: "var(--silver-200)" }}>
            <input type="checkbox" checked={form.termsAccepted} onChange={(e) => set("termsAccepted", e.target.checked)} style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "#e8192c" }} />
            Terms and Conditions Accepted *
          </label>
          {member && (
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer", color: "var(--silver-200)" }}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} style={{ cursor: "pointer", width: "15px", height: "15px", accentColor: "#e8192c" }} />
              Account Active
            </label>
          )}
        </div>

        <div style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
          <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={saving}>
            {saving ? "Saving…" : member ? "Update Member" : "Register Member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [limit, setLimit] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Build filter params
      const params: Record<string, any> = { page, limit };
      if (search) params.search = search;

      if (activeTab === "active") {
        params.isActive = true;
        params.approvalStatus = "approved";
      } else if (activeTab === "inactive") {
        params.isActive = false;
        params.approvalStatus = "approved";
      } else if (activeTab === "pending") {
        params.approvalStatus = "pending";
      }
      // "all" → no status filter

      const res = await membersAPI.getAll(params);
      setMembers(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { setMembers([]); setTotal(0); }
    finally { setLoading(false); }
  }, [page, search, activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleApprove = (id: string) => {
    setApproveId(id);
  };

  const handleReject = (id: string) => {
    setRejectId(id);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const getStatusBadge = (m: any) => {
    if (m.approvalStatus === "pending") return <Badge variant="pending" dot>Pending</Badge>;
    if (m.approvalStatus === "rejected") return <Badge variant="cancelled" dot>Rejected</Badge>;
    return m.isActive
      ? <Badge variant="active" dot>Active</Badge>
      : <Badge variant="cancelled" dot>Inactive</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Members</h1>
            <p className="page-subtitle">{total} member{total !== 1 ? "s" : ""} {activeTab === "all" ? "total" : `(${activeTab})`}</p>
          </div>
          <button className="btn-primary" onClick={() => { setEditMember(null); setShowModal(true); }}>
            <UserPlus size={16} /> Add Member
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              style={{
                padding: "7px 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--border)",
                background: activeTab === tab.key ? "var(--red-500)" : "rgba(255,255,255,0.03)",
                color: activeTab === tab.key ? "white" : "var(--silver-400)",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="chart-container" style={{ marginBottom: "20px", padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: "200px" }}>
              <Search className="search-icon" />
              <input
                className="search-input"
                placeholder="Search by name or phone…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--silver-500)", fontSize: "13px" }}>
              <Users size={14} />
              Showing {members.length} of {total}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="chart-container" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <LoadingSpinner fullPage size={32} text="Loading members…" />
          ) : members.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--silver-500)" }}>
              <Users size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>No members found{search ? ` matching "${search}"` : ""}</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>Goals</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any) => (
                    <tr key={m._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                            {m.firstName?.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--silver-100)" }}>
                              {m.firstName} {m.lastName}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--silver-500)" }}>{m.contact?.email || m.contact?.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--silver-400)", fontSize: "13px" }}>
                          <Phone size={12} /> {m.contact?.phone}
                        </div>
                      </td>
                      <td><Badge variant={getBadgeVariant(m.gender)}>{m.gender}</Badge></td>
                      <td>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {(m.fitnessGoals || []).slice(0, 2).map((g: string) => (
                            <span key={g} style={{ fontSize: "10px", padding: "2px 7px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "50px", color: "var(--silver-500)" }}>
                              {GOALS_LABELS[g] || g}
                            </span>
                          ))}
                          {(m.fitnessGoals || []).length > 2 && (
                            <span style={{ fontSize: "10px", color: "var(--silver-600)" }}>+{m.fitnessGoals.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: "var(--silver-500)", fontSize: "12px" }}>
                        {new Date(m.joinedDate || m.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td>{getStatusBadge(m)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "2px" }}>
                          {m.approvalStatus === "pending" ? (
                            <>
                              <button className="btn-ghost" style={{ padding: "6px", color: "var(--green-400)" }} title="Approve"
                                onClick={() => handleApprove(m._id)}>
                                <Check size={15} />
                              </button>
                              <button className="btn-ghost" style={{ padding: "6px", color: "#ff4d5a" }} title="Reject"
                                onClick={() => handleReject(m._id)}>
                                <X size={15} />
                              </button>
                            </>
                          ) : (
                            <>
                              <Link href={`/members/${m._id}`} className="btn-ghost" style={{ padding: "6px" }} title="View Profile">
                                <Eye size={15} />
                              </Link>
                              <button className="btn-ghost" style={{ padding: "6px" }} title="Edit"
                                onClick={() => { setEditMember(m); setShowModal(true); }}>
                                <Pencil size={15} />
                              </button>
                              <button className="btn-ghost" style={{ padding: "6px", color: deleting === m._id ? "var(--silver-700)" : "#ff4d5a" }}
                                title="Delete" onClick={() => handleDelete(m._id)} disabled={deleting === m._id}>
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
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
                onLimitChange={handleLimitChange}
                showing={members.length}
              />
            </>
          )}
        </div>
      </div>

      <MemberFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        member={editMember}
        onSuccess={() => { setShowModal(false); load(); }}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          setDeleting(deleteId);
          try {
            await membersAPI.delete(deleteId);
            load();
          } catch {
            alert("Failed to delete member");
          } finally {
            setDeleting(null);
          }
        }}
        title="Delete Member permanently"
        message="Are you sure you want to delete this member permanently? This action cannot be undone."
      />

      <DeleteConfirmModal
        isOpen={!!approveId}
        onClose={() => setApproveId(null)}
        onConfirm={async () => {
          if (!approveId) return;
          try {
            await membersAPI.approve(approveId);
            load();
          } catch {
            alert("Failed to approve member");
          }
        }}
        title="Approve Registration Request"
        message="Are you sure you want to approve this member registration request?"
        confirmText="Approve"
      />

      <DeleteConfirmModal
        isOpen={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={async () => {
          if (!rejectId) return;
          try {
            await membersAPI.reject(rejectId);
            load();
          } catch {
            alert("Failed to reject member");
          }
        }}
        title="Reject Registration Request"
        message="Are you sure you want to reject and remove this registration request?"
        confirmText="Reject"
      />
    </DashboardLayout>
  );
}
