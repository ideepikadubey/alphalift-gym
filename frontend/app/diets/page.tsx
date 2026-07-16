"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { dietsAPI, membersAPI } from "@/lib/api";
import { Salad, Plus, Pencil, Trash2, Flame, Beef, Droplets, UserPlus, Check, Users } from "lucide-react";

const PLAN_TYPES = [
  { value: "weight_loss", label: "Weight Loss" },
  { value: "muscle_gain", label: "Muscle Gain" },
  { value: "maintenance", label: "Maintenance" },
  { value: "keto", label: "Keto" },
  { value: "vegan", label: "Vegan" },
  { value: "custom", label: "Custom" },
];

// ─── Assign Modal ────────────────────────────────────────────────────────────
function AssignDietModal({ isOpen, onClose, diet, onSuccess }: any) {
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedId(""); setSearch(""); setStartDate(""); setEndDate("");
      setError(""); setSuccess("");
      return;
    }
    setLoading(true);
    membersAPI.getAll({ limit: 200 })
      .then((r) => setMembers(r.data.data || []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.firstName?.toLowerCase().includes(q) ||
      m.lastName?.toLowerCase().includes(q) ||
      m.contact?.phone?.includes(q)
    );
  });

  // Already-assigned member IDs for this diet
  const assignedIds = new Set((diet?.assignedTo || []).map((a: any) =>
    typeof a.member === "object" ? a.member._id : a.member
  ));

  const handleAssign = async () => {
    if (!selectedId) { setError("Please select a member."); return; }
    setError(""); setSaving(true);
    try {
      await dietsAPI.assign(diet._id, {
        memberId: selectedId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setSuccess("Diet plan assigned successfully!");
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to assign diet plan.");
    } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign "${diet?.planName || diet?.name}" to Member`}
      maxWidth={520}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleAssign} disabled={saving || !selectedId}>
            {saving ? "Assigning…" : "Assign Plan"}
          </button>
        </>
      }
    >
      {error && (
        <div style={{ background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: "#ff6b79" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: "var(--green-400)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Check size={14} /> {success}
        </div>
      )}

      {/* Member search */}
      <div style={{ marginBottom: "12px" }}>
        <label className="input-label">Search Member</label>
        <input
          className="input-field"
          placeholder="Name or phone number…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedId(""); }}
        />
      </div>

      {/* Member list */}
      <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "16px" }}>
        {loading ? (
          <div style={{ padding: "30px", textAlign: "center" }}><LoadingSpinner size={24} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--silver-600)", fontSize: "13px" }}>
            {search ? "No members match your search." : "No members found."}
          </div>
        ) : (
          filtered.map((m) => {
            const isAssigned = assignedIds.has(m._id);
            const isSelected = selectedId === m._id;
            return (
              <div
                key={m._id}
                onClick={() => !isAssigned && setSelectedId(m._id)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "11px 14px", cursor: isAssigned ? "not-allowed" : "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: isSelected ? "rgba(34,197,94,0.08)" : isAssigned ? "rgba(255,255,255,0.01)" : "transparent",
                  opacity: isAssigned ? 0.45 : 1,
                  transition: "background 0.15s",
                }}
              >
                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
                  {m.firstName?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-100)" }}>
                    {m.firstName} {m.lastName}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--silver-600)" }}>{m.contact?.phone}</div>
                </div>
                {isAssigned && (
                  <span style={{ fontSize: "10px", color: "var(--green-400)", background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: "50px", border: "1px solid rgba(34,197,94,0.2)" }}>
                    Assigned
                  </span>
                )}
                {isSelected && !isAssigned && (
                  <Check size={14} style={{ color: "var(--green-400)", flexShrink: 0 }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Date range */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label className="input-label">Start Date (optional)</label>
          <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ background: "var(--bg-input)", color: "var(--silver-100)" }} />
        </div>
        <div>
          <label className="input-label">End Date (optional)</label>
          <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ background: "var(--bg-input)", color: "var(--silver-100)" }} />
        </div>
      </div>
    </Modal>
  );
}

// ─── Diet Card ────────────────────────────────────────────────────────────────
function DietCard({ diet, onEdit, onDelete, onAssign }: any) {
  const nt = diet.nutritionTargets || diet.macros || diet.dailyNutrition || {};
  const calories = nt.dailyCalories ?? nt.calories;
  const protein = nt.protein?.grams ?? nt.protein;
  const carbs = nt.carbs?.grams ?? nt.carbs;
  const fat = nt.fat?.grams ?? nt.fat;
  const assignedCount = (diet.assignedTo || []).length;

  return (
    <div className="glass-card" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ width: 44, height: 44, background: "rgba(34,197,94,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green-400)", flexShrink: 0 }}>
          <Salad size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "var(--silver-100)", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {diet.planName || diet.name}
          </div>
          {diet.planType && (
            <span style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "50px", color: "var(--green-400)", textTransform: "capitalize" }}>
              {diet.planType.replace("_", " ")}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
          <button className="btn-ghost" style={{ padding: "5px" }} onClick={() => onEdit(diet)}><Pencil size={13} /></button>
          <button className="btn-ghost" style={{ padding: "5px", color: "#ff4d5a" }} onClick={() => onDelete(diet._id)}><Trash2 size={13} /></button>
        </div>
      </div>

      {diet.description && (
        <p style={{ fontSize: "12px", color: "var(--silver-500)", lineHeight: 1.5, margin: 0 }}>{diet.description}</p>
      )}

      {/* Macro grid in 2x2 layout */}
      {(calories || protein || carbs || fat) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { label: "Calories", value: calories, unit: "kcal", icon: <Flame size={13} />, color: "#fbbf24", rgb: "251,191,36" },
            { label: "Protein", value: protein, unit: "g", icon: <Beef size={13} />, color: "var(--red-400)", rgb: "239,68,68" },
            { label: "Carbs", value: carbs, unit: "g", icon: <Droplets size={13} />, color: "#60a5fa", rgb: "59,130,246" },
            { label: "Fat", value: fat, unit: "g", icon: <Droplets size={13} />, color: "#c084fc", rgb: "168,85,247" },
          ].map((m) => m.value !== undefined && m.value !== null && (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 12px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `rgba(${m.rgb}, 0.1)`, display: "flex", alignItems: "center", justifyContent: "center", color: m.color, flexShrink: 0 }}>
                {m.icon}
              </div>
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: "9px", color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 800, color: "var(--silver-100)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.value} <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--silver-500)", textTransform: "lowercase" }}>{m.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign button + count */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
        <button
          className="btn-ghost"
          style={{ width: "100%", fontSize: "12px", color: "var(--green-400)", padding: "8px", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          onClick={() => onAssign(diet)}
        >
          <UserPlus size={13} /> Assign to Member
        </button>
        {assignedCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--silver-500)", justifyContent: "center" }}>
            <Users size={12} style={{ color: "var(--silver-500)" }} />
            <span>{assignedCount} member{assignedCount !== 1 ? "s" : ""} assigned</span>
          </div>
        )}
      </div>

      {(diet.meals || []).length > 0 && (
        <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--silver-500)", display: "flex", alignItems: "center", gap: "4px" }}>
          🍽 {diet.meals.length} meals per day
        </div>
      )}
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function DietFormModal({ isOpen, onClose, diet, onSuccess }: any) {
  const [form, setForm] = useState({
    planName: "", planType: "weight_loss", description: "",
    dailyCalories: "", proteinGrams: "", carbsGrams: "", fatGrams: "",
    fiberGrams: "", waterLiters: "", isTemplate: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (diet) {
      const nt = diet.nutritionTargets || diet.macros || diet.dailyNutrition || {};
      setForm({
        planName: diet.planName || diet.name || "",
        planType: diet.planType || "weight_loss",
        description: diet.description || "",
        dailyCalories: nt.dailyCalories ?? nt.calories ?? "",
        proteinGrams: nt.protein?.grams ?? nt.protein ?? "",
        carbsGrams: nt.carbs?.grams ?? nt.carbs ?? "",
        fatGrams: nt.fat?.grams ?? nt.fat ?? "",
        fiberGrams: nt.fiber?.grams ?? "",
        waterLiters: nt.water?.liters ?? "",
        isTemplate: diet.isTemplate !== false,
      });
    } else {
      setForm({ planName: "", planType: "weight_loss", description: "", dailyCalories: "", proteinGrams: "", carbsGrams: "", fatGrams: "", fiberGrams: "", waterLiters: "", isTemplate: true });
    }
  }, [diet, isOpen]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const body = {
        planName: form.planName,
        planType: form.planType,
        description: form.description || undefined,
        isTemplate: form.isTemplate,
        nutritionTargets: {
          dailyCalories: form.dailyCalories ? Number(form.dailyCalories) : undefined,
          protein: form.proteinGrams ? { grams: Number(form.proteinGrams) } : undefined,
          carbs: form.carbsGrams ? { grams: Number(form.carbsGrams) } : undefined,
          fat: form.fatGrams ? { grams: Number(form.fatGrams) } : undefined,
          fiber: form.fiberGrams ? { grams: Number(form.fiberGrams) } : undefined,
          water: form.waterLiters ? { liters: Number(form.waterLiters) } : undefined,
        },
      };
      if (diet) await dietsAPI.update(diet._id, body);
      else await dietsAPI.create(body);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save diet plan");
    } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={diet ? "Edit Diet Plan" : "Create Diet Plan"}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit as any} disabled={saving}>
            {saving ? "Saving…" : diet ? "Save Changes" : "Create Plan"}
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
          <label className="input-label">Plan Name *</label>
          <input className="input-field" value={form.planName} onChange={(e) => set("planName", e.target.value)} placeholder="e.g. Summer Cut Plan" required />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label className="input-label">Plan Type *</label>
          <select className="input-field" value={form.planType} onChange={(e) => set("planType", e.target.value)} style={{ background: "var(--bg-input)", color: "var(--silver-100)", paddingRight: "32px" }}>
            {PLAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div style={{ gridColumn: "1/-1", borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--red-400)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Daily Nutrition Targets</span>
        </div>

        <div>
          <label className="input-label">Daily Calories (kcal)</label>
          <input className="input-field" type="number" value={form.dailyCalories} onChange={(e) => set("dailyCalories", e.target.value)} placeholder="e.g. 2000" />
        </div>
        <div>
          <label className="input-label">Protein (g)</label>
          <input className="input-field" type="number" value={form.proteinGrams} onChange={(e) => set("proteinGrams", e.target.value)} placeholder="e.g. 150" />
        </div>
        <div>
          <label className="input-label">Carbohydrates (g)</label>
          <input className="input-field" type="number" value={form.carbsGrams} onChange={(e) => set("carbsGrams", e.target.value)} placeholder="e.g. 200" />
        </div>
        <div>
          <label className="input-label">Fat (g)</label>
          <input className="input-field" type="number" value={form.fatGrams} onChange={(e) => set("fatGrams", e.target.value)} placeholder="e.g. 70" />
        </div>
        <div>
          <label className="input-label">Fiber (g)</label>
          <input className="input-field" type="number" value={form.fiberGrams} onChange={(e) => set("fiberGrams", e.target.value)} placeholder="e.g. 30" />
        </div>
        <div>
          <label className="input-label">Water (liters)</label>
          <input className="input-field" type="number" step="0.1" value={form.waterLiters} onChange={(e) => set("waterLiters", e.target.value)} placeholder="e.g. 3.5" />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label className="input-label">Description / Notes</label>
          <textarea className="input-field" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional meal plan notes or instructions…" style={{ resize: "vertical" }} />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer", color: "var(--silver-200)" }}>
            <input type="checkbox" checked={form.isTemplate} onChange={(e) => set("isTemplate", e.target.checked)} style={{ width: "15px", height: "15px", accentColor: "#e8192c", cursor: "pointer" }} />
            Mark as reusable template (can be assigned to multiple members)
          </label>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DietsPage() {
  const [diets, setDiets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDiet, setEditDiet] = useState<any>(null);
  const [assignDiet, setAssignDiet] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await dietsAPI.getAll(); setDiets(r.data.data || []); }
    catch { setDiets([]); } finally { setLoading(false); }
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
            <h1 className="page-title">Diet Plans</h1>
            <p className="page-subtitle">{diets.length} plan{diets.length !== 1 ? "s" : ""} created</p>
          </div>
          <button className="btn-primary" onClick={() => { setEditDiet(null); setShowModal(true); }}>
            <Plus size={16} /> New Plan
          </button>
        </div>

        {loading ? <LoadingSpinner fullPage size={32} text="Loading diet plans…" /> :
          diets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px", color: "var(--silver-500)" }}>
              <Salad size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>No diet plans yet. Create one to get started.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px,1fr))", gap: "18px" }}>
              {diets.map((d) => (
                <DietCard key={d._id} diet={d}
                  onEdit={(diet: any) => { setEditDiet(diet); setShowModal(true); }}
                  onDelete={handleDelete}
                  onAssign={(diet: any) => setAssignDiet(diet)} />
              ))}
            </div>
          )
        }
      </div>

      <DietFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        diet={editDiet}
        onSuccess={() => { setShowModal(false); load(); }}
      />

      <AssignDietModal
        isOpen={!!assignDiet}
        onClose={() => setAssignDiet(null)}
        diet={assignDiet}
        onSuccess={() => { setAssignDiet(null); load(); }}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await dietsAPI.delete(deleteId);
            load();
          } catch {
            alert("Failed to delete diet plan.");
          }
        }}
        title="Delete Diet Plan"
        message="Are you sure you want to delete this diet plan? This action cannot be undone."
      />
    </DashboardLayout>
  );
}
