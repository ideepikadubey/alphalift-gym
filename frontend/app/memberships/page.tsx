"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { getBadgeVariant } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import { membershipsAPI, membersAPI, plansAPI } from "@/lib/api";
import { Award, AlertTriangle, XCircle, Snowflake, RefreshCw, Plus, Clock } from "lucide-react";
import Link from "next/link";

type MTab = "active" | "expiring" | "expired" | "cancelled" | "pending" | "frozen";

const TAB_CONFIG: Record<MTab, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: "Active", icon: <Award size={14} />, color: "var(--green-400)" },
  expiring: { label: "Expiring Soon", icon: <AlertTriangle size={14} />, color: "#fbbf24" },
  expired: { label: "Expired", icon: <XCircle size={14} />, color: "#ff4d5a" },
  cancelled: { label: "Cancelled", icon: <XCircle size={14} />, color: "var(--silver-500)" },
  pending: { label: "Pending", icon: <Clock size={14} />, color: "#3b82f6" },
  frozen: { label: "Frozen", icon: <Snowflake size={14} />, color: "#a855f7" },
};

function daysLeft(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function MembershipFormModal({ isOpen, onClose, onSuccess }: any) {
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [memberId, setMemberId] = useState("");
  const [planId, setPlanId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountApplied, setDiscountApplied] = useState("0");
  const [autoRenew, setAutoRenew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      membersAPI.getAll({ limit: 1000 }).then((r) => setMembers(r.data.data || [])).catch(() => {});
      plansAPI.getAll().then((r) => setPlans(r.data.data || [])).catch(() => {});
      setMemberId("");
      setPlanId("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setPaymentStatus("paid");
      setPaymentMethod("cash");
      setDiscountApplied("0");
      setAutoRenew(false);
      setError("");
    }
  }, [isOpen]);

  const selectedPlan = plans.find((p) => p._id === planId);
  const totalAmount = selectedPlan ? selectedPlan.price : 0;
  const finalAmount = Math.max(0, totalAmount - (Number(discountApplied) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!memberId) { setError("Please select a member"); return; }
    if (!planId) { setError("Please select a membership plan"); return; }
    setSaving(true);
    try {
      await membershipsAPI.create({
        member: memberId,
        plan: planId,
        startDate: startDate || undefined,
        autoRenew,
        payment: {
          status: paymentStatus,
          method: paymentMethod,
          totalAmount,
          discountApplied: Number(discountApplied) || 0,
          finalAmount,
        },
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to assign membership");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign New Membership"
      subtitle="Enroll a member into a membership plan"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit as any} disabled={saving}>
            {saving ? "Saving…" : "Assign Plan"}
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
        <div style={{ gridColumn: "1/-1" }}>
          <label className="input-label">Select Member *</label>
          <select className="input-field" value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ background: "var(--bg-input)" }}>
            <option value="">-- Choose Member --</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.firstName} {m.lastName} ({m.contact?.phone || "No phone"})</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label className="input-label">Select Membership Plan *</label>
          <select className="input-field" value={planId} onChange={(e) => setPlanId(e.target.value)} style={{ background: "var(--bg-input)" }}>
            <option value="">-- Choose Plan --</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>{p.planName} (₹{p.price.toLocaleString()} for {p.durationDays} days)</option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Start Date *</label>
          <input className="input-field" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>

        <div>
          <label className="input-label">Payment Status</label>
          <select className="input-field" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{ background: "var(--bg-input)" }}>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label className="input-label">Payment Method</label>
          <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ background: "var(--bg-input)" }}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="netbanking">Net Banking</option>
            <option value="razorpay">Razorpay</option>
          </select>
        </div>

        <div>
          <label className="input-label">Discount Applied (₹)</label>
          <input className="input-field" type="number" min="0" value={discountApplied} onChange={(e) => setDiscountApplied(e.target.value)} placeholder="0" />
        </div>

        <div style={{ gridColumn: "1/-1", display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border)", marginTop: "8px" }}>
          <div style={{ fontSize: "13px", color: "var(--silver-400)" }}>
            Total: <span style={{ fontWeight: 700, color: "var(--silver-100)" }}>₹{totalAmount.toLocaleString()}</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--silver-400)" }}>
            Discount: <span style={{ fontWeight: 700, color: "#ff4d5a" }}>- ₹{(Number(discountApplied) || 0).toLocaleString()}</span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--silver-400)" }}>
            Final: <span style={{ fontWeight: 700, color: "var(--green-400)" }}>₹{finalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div style={{ gridColumn: "1/-1", marginTop: "8px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: "var(--silver-200)" }}>
            <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#e8192c", cursor: "pointer" }} />
            Enable Automatic Renewal
          </label>
        </div>
      </div>
    </Modal>
  );
}

export default function MembershipsPage() {
  const [tab, setTab] = useState<MTab>("active");
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<MTab, number>>({ active: 0, expiring: 0, expired: 0, cancelled: 0, pending: 0, frozen: 0 });
  const [showFormModal, setShowFormModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelName, setCancelName] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleCancelClick = (id: string, name: string) => {
    setCancelId(id);
    setCancelName(name);
    setCancelReason("Member request");
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (tab === "expiring") {
        params.status = "active";
        params.expiringSoon = "true";
      } else {
        params.status = tab;
      }
      const res = await membershipsAPI.getAll(params);
      setMemberships(res.data.data || []);
      setTotal(res.data.total || (res.data.data || []).length);
    } catch {
      setMemberships([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, page, limit]);

  const loadCounts = useCallback(() => {
    Promise.all([
      membershipsAPI.getAll({ status: "active", limit: 1000 }),
      membershipsAPI.getAll({ status: "expired", limit: 1000 }),
      membershipsAPI.getAll({ status: "cancelled", limit: 1000 }),
      membershipsAPI.getAll({ status: "pending", limit: 1000 }),
      membershipsAPI.getAll({ status: "frozen", limit: 1000 }),
    ]).then(([a, e, c, p, f]) => {
      const activeMems = a.data.data || [];
      const expiring7 = activeMems.filter((m: any) => m.endDate && daysLeft(m.endDate) <= 7).length;
      setCounts({
        active: a.data.total || activeMems.length,
        expiring: expiring7,
        expired: e.data.total || (e.data.data || []).length,
        cancelled: c.data.total || (c.data.data || []).length,
        pending: p.data.total || (p.data.data || []).length,
        frozen: f.data.total || (f.data.data || []).length,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Memberships</h1>
            <p className="page-subtitle">Manage and track all member subscriptions</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-primary" onClick={() => setShowFormModal(true)}>
              <Plus size={16} /> Assign Membership
            </button>
            <button className="btn-secondary" onClick={load}><RefreshCw size={15} /> Refresh</button>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px", marginBottom: "24px" }}>
          {(Object.entries(TAB_CONFIG) as [MTab, any][]).map(([key, cfg]) => (
            <div
              key={key}
              className="stat-card"
              style={{ cursor: "pointer", borderColor: tab === key ? cfg.color : undefined, boxShadow: tab === key ? `0 0 20px ${cfg.color}22` : undefined }}
              onClick={() => setTab(key)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ color: cfg.color }}>{cfg.icon}</div>
                <span style={{ fontSize: "11px", color: "var(--silver-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{cfg.label}</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: cfg.color }}>
                {counts[key]}
              </div>
            </div>
          ))}
        </div>

        {/* Tab selector */}
        <div className="tab-list" style={{ marginBottom: "20px" }}>
          {(Object.keys(TAB_CONFIG) as MTab[]).map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {TAB_CONFIG[t].label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="chart-container" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <LoadingSpinner fullPage size={28} text="Loading memberships…" />
          ) : memberships.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--silver-500)" }}>
              <Award size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>No {tab} memberships found</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Plan</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    {tab === "active" && <th>Days Left</th>}
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((m: any) => {
                    const days = m.endDate ? daysLeft(m.endDate) : null;
                    const isUrgent = days !== null && days <= 7 && days >= 0;
                    return (
                      <tr key={m._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                              {m.member?.firstName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <Link href={`/members/${m.member?._id}`} style={{ fontWeight: 600, fontSize: "13px", color: "var(--silver-100)", textDecoration: "none" }}>
                                {m.member?.firstName} {m.member?.lastName}
                              </Link>
                              <div style={{ fontSize: "11px", color: "var(--silver-500)" }}>{m.member?.contact?.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, color: "var(--red-400)" }}>{m.plan?.planName || m.plan?.name || "—"}</td>
                        <td style={{ color: "var(--silver-400)", fontSize: "12px" }}>{m.startDate ? new Date(m.startDate).toLocaleDateString("en-IN") : "—"}</td>
                        <td style={{ color: isUrgent ? "#fbbf24" : "var(--silver-400)", fontSize: "12px", fontWeight: isUrgent ? 700 : 400 }}>
                          {m.endDate ? new Date(m.endDate).toLocaleDateString("en-IN") : "—"}
                        </td>
                        {tab === "active" && (
                          <td>
                            {days !== null && (
                              <span style={{ fontSize: "13px", fontWeight: 700, color: days <= 3 ? "#ff4d5a" : days <= 7 ? "#fbbf24" : "var(--green-400)" }}>
                                {days} days
                              </span>
                            )}
                          </td>
                        )}
                        <td style={{ fontWeight: 700, color: "var(--silver-100)" }}>₹{(m.payment?.finalAmount || 0).toLocaleString()}</td>
                        <td><Badge variant={getBadgeVariant(m.payment?.status || "pending")}>{m.payment?.status || "pending"}</Badge></td>
                        <td><Badge variant={getBadgeVariant(m.status)}>{m.status}</Badge></td>
                        <td>
                          {m.status === "active" && (
                            <button
                              className="btn-ghost"
                              style={{ fontSize: "11px", color: "#ff4d5a", padding: "4px 8px", background: "rgba(255, 77, 90, 0.05)", border: "1px solid rgba(255, 77, 90, 0.15)", borderRadius: "6px", cursor: "pointer" }}
                              onClick={() => handleCancelClick(m._id, `${m.member?.firstName} ${m.member?.lastName}`)}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(total / limit))}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
                showing={memberships.length}
              />
            </>
          )}
        </div>
      </div>

      <MembershipFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSuccess={() => { setShowFormModal(false); load(); loadCounts(); }}
      />

      <Modal
        isOpen={!!cancelId}
        onClose={() => { setCancelId(null); setCancelReason(""); }}
        title="Cancel Membership"
        subtitle={`Are you sure you want to cancel the membership for ${cancelName}?`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="input-label">Reason for Cancellation</label>
            <input
              className="input-field"
              placeholder="e.g. Member request, relocation, health issues"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              style={{ background: "var(--bg-input)" }}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button className="btn-secondary" onClick={() => setCancelId(null)} style={{ flex: 1 }}>Close</button>
            <button
              className="btn-primary"
              style={{ background: "#ff4d5a", border: "none", flex: 2, justifyContent: "center" }}
              disabled={cancelling}
              onClick={async () => {
                if (!cancelId) return;
                setCancelling(true);
                try {
                  const api = (await import("@/lib/api")).default;
                  await api.delete(`/memberships/${cancelId}`, { data: { reason: cancelReason } });
                  setCancelId(null);
                  setCancelReason("");
                  load();
                  loadCounts();
                } catch (err) {
                  alert("Failed to cancel membership");
                } finally {
                  setCancelling(false);
                }
              }}
            >
              {cancelling ? "Cancelling…" : "Confirm Cancel"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
