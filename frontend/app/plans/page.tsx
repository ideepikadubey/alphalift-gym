"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { plansAPI } from "@/lib/api";
import { ClipboardList, Plus, Check, Pencil, Trash2, Zap } from "lucide-react";

function PlanCard({ plan, onEdit, onDelete }: any) {
  const isPopular = plan.planName?.toLowerCase().includes("gold") || plan.planName?.toLowerCase().includes("premium") || plan.planName?.toLowerCase().includes("yearly");

  const featuresList = [];
  if (plan.features?.gymAccess) featuresList.push("Gym Access");
  if (plan.features?.personalTrainer) featuresList.push("Personal Trainer");
  if (plan.features?.dietPlan) featuresList.push("Diet Plan");
  if (plan.features?.groupClasses) featuresList.push("Group Classes");
  if (plan.features?.spaAccess) featuresList.push("Spa & Sauna Access");
  if (plan.features?.lockerAccess) featuresList.push("Locker Access");

  return (
    <div
      className="glass-card"
      style={{
        padding: "28px",
        position: "relative",
        overflow: "hidden",
        border: isPopular ? "1px solid rgba(232,25,44,0.3)" : "1px solid var(--border)",
        boxShadow: isPopular ? "0 0 30px rgba(232,25,44,0.1)" : undefined,
      }}
    >
      {isPopular && (
        <div style={{ position: "absolute", top: "16px", right: "16px" }}>
          <span style={{ background: "var(--red-500)", color: "white", fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "50px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Popular
          </span>
        </div>
      )}

      {/* Plan name */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div style={{ width: 34, height: 34, background: isPopular ? "rgba(232,25,44,0.12)" : "var(--bg-elevated)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: isPopular ? "var(--red-500)" : "var(--silver-500)" }}>
            <Zap size={16} fill={isPopular ? "currentColor" : "none"} />
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, color: "var(--silver-100)" }}>
            {plan.planName}
          </h3>
        </div>
        {plan.description && (
          <p style={{ fontSize: "12px", color: "var(--silver-600)", lineHeight: 1.5 }}>{plan.description}</p>
        )}
      </div>

      {/* Price */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 900, color: isPopular ? "var(--red-400)" : "var(--silver-100)", lineHeight: 1 }}>
          ₹{(plan.price || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: "12px", color: "var(--silver-600)", marginTop: "4px" }}>
          For {plan.durationDays} days ({plan.planType})
        </div>
      </div>

      {/* Features */}
      {featuresList.length > 0 && (
        <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {featuresList.map((f: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--silver-300)" }}>
              <Check size={13} style={{ color: "var(--green-400)", flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
        <Badge variant={plan.isActive ? "active" : "cancelled"} dot>
          {plan.isActive ? "Active" : "Inactive"}
        </Badge>
        <div style={{ display: "flex", gap: "6px" }}>
          <button className="btn-ghost" style={{ padding: "6px" }} onClick={() => onEdit(plan)}><Pencil size={14} /></button>
          <button className="btn-ghost" style={{ padding: "6px", color: "#ff4d5a" }} onClick={() => onDelete(plan._id)}><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function PlanFormModal({ isOpen, onClose, plan, onSuccess }: any) {
  const [form, setForm] = useState({
    planName: "",
    price: "",
    planType: "monthly",
    durationDays: "30",
    description: "",
    gymAccess: true,
    personalTrainer: false,
    dietPlan: false,
    groupClasses: false,
    spaAccess: false,
    lockerAccess: true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (plan) {
      setForm({
        planName: plan.planName || "",
        price: plan.price || "",
        planType: plan.planType || "monthly",
        durationDays: plan.durationDays || "30",
        description: plan.description || "",
        gymAccess: plan.features?.gymAccess ?? true,
        personalTrainer: plan.features?.personalTrainer ?? false,
        dietPlan: plan.features?.dietPlan ?? false,
        groupClasses: plan.features?.groupClasses ?? false,
        spaAccess: plan.features?.spaAccess ?? false,
        lockerAccess: plan.features?.lockerAccess ?? true
      });
    } else {
      setForm({
        planName: "",
        price: "",
        planType: "monthly",
        durationDays: "30",
        description: "",
        gymAccess: true,
        personalTrainer: false,
        dietPlan: false,
        groupClasses: false,
        spaAccess: false,
        lockerAccess: true
      });
    }
  }, [plan, isOpen]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = {
        planName: form.planName,
        price: Number(form.price),
        planType: form.planType,
        durationDays: Number(form.durationDays),
        description: form.description,
        features: {
          gymAccess: form.gymAccess,
          personalTrainer: form.personalTrainer,
          dietPlan: form.dietPlan,
          groupClasses: form.groupClasses,
          spaAccess: form.spaAccess,
          lockerAccess: form.lockerAccess
        }
      };
      if (plan) await plansAPI.update(plan._id, body);
      else await plansAPI.create(body);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? "Edit Plan" : "New Membership Plan"}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit as any} disabled={saving}>
            {saving ? "Saving…" : plan ? "Save" : "Create Plan"}
          </button>
        </>
      }
    >
      {error && (
        <div style={{ background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#ff6b79" }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="input-label">Plan Name *</label>
            <input className="input-field" value={form.planName} onChange={(e) => set("planName", e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Price (₹) *</label>
            <input className="input-field" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Duration (Days) *</label>
            <input className="input-field" type="number" min="1" value={form.durationDays} onChange={(e) => set("durationDays", e.target.value)} required />
          </div>
          <div>
            <label className="input-label">Plan Type *</label>
            <select className="input-field" value={form.planType} onChange={(e) => set("planType", e.target.value)} style={{ background: "var(--bg-input)" }}>
              {["monthly", "quarterly", "yearly", "family", "corporate"].map((d) => (
                <option key={d} value={d}>{d.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Description</label>
            <input className="input-field" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short description" />
          </div>
        </div>

        {/* Features Select Toggles */}
        <div style={{ marginTop: "8px" }}>
          <label className="input-label" style={{ marginBottom: "8px", display: "block" }}>Included Features</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { key: "gymAccess", label: "Gym Access" },
              { key: "personalTrainer", label: "Personal Trainer" },
              { key: "dietPlan", label: "Diet Plan" },
              { key: "groupClasses", label: "Group Classes" },
              { key: "spaAccess", label: "Spa & Sauna" },
              { key: "lockerAccess", label: "Locker Room" }
            ].map((feat) => (
              <label
                key={feat.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: "var(--silver-200)",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "8px 12px"
                }}
              >
                <input
                  type="checkbox"
                  checked={(form as any)[feat.key]}
                  onChange={(e) => set(feat.key, e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#e8192c", cursor: "pointer" }}
                />
                {feat.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await plansAPI.getAll({ isActive: "true" });
      setPlans(r.data.data || []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Membership Plans</h1>
            <p className="page-subtitle">{plans.length} active plans available</p>
          </div>
          <button className="btn-primary" onClick={() => { setEditPlan(null); setShowModal(true); }}>
            <Plus size={16} /> New Plan
          </button>
        </div>

        {loading ? <LoadingSpinner fullPage size={32} text="Loading plans…" /> :
          plans.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px", color: "var(--silver-500)" }}>
              <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>No plans yet</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: "20px" }}>
              {plans.map((plan) => (
                <PlanCard key={plan._id} plan={plan}
                  onEdit={(p: any) => { setEditPlan(p); setShowModal(true); }}
                  onDelete={handleDelete} />
              ))}
            </div>
          )
        }
      </div>

      <PlanFormModal isOpen={showModal} onClose={() => setShowModal(false)} plan={editPlan}
        onSuccess={() => { setShowModal(false); load(); }} />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await plansAPI.delete(deleteId);
            load();
          } catch {
            alert("Failed to deactivate membership plan.");
          }
        }}
        title="Deactivate Plan"
        message="Are you sure you want to deactivate this membership plan? It will no longer be visible for new assignments."
        confirmText="Deactivate"
      />
    </DashboardLayout>
  );
}
