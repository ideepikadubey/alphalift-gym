"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Badge, { getBadgeVariant } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { useAuth } from "@/lib/auth";
import { workoutsAPI, membersAPI } from "@/lib/api";
import { Dumbbell, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Flame, UserPlus, Check } from "lucide-react";

// ─── Assign Modal ────────────────────────────────────────────────────────────
function AssignWorkoutModal({ isOpen, onClose, workout, onSuccess }: any) {
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

  // Already-assigned member IDs for this workout
  const assignedIds = new Set((workout?.assignedTo || []).map((a: any) =>
    typeof a.member === "object" ? a.member._id : a.member
  ));

  const handleAssign = async () => {
    if (!selectedId) { setError("Please select a member."); return; }
    setError(""); setSaving(true);
    try {
      await workoutsAPI.assign(workout._id, {
        memberId: selectedId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setSuccess("Workout plan assigned successfully!");
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to assign workout.");
    } finally { setSaving(false); }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign "${workout?.planName}" to Member`}
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
                  background: isSelected ? "rgba(232,25,44,0.08)" : isAssigned ? "rgba(255,255,255,0.01)" : "transparent",
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
                  <Check size={14} style={{ color: "var(--red-400)", flexShrink: 0 }} />
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

// ─── Workout Card ─────────────────────────────────────────────────────────────
function WorkoutCard({ workout, onEdit, onDelete, onAssign }: any) {
  const [expanded, setExpanded] = useState(false);
  const exercises = workout.exercises || [];
  const assignedCount = (workout.assignedTo || []).length;

  return (
    <div className="glass-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
        <div style={{ width: 44, height: 44, background: "rgba(232,25,44,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-500)", flexShrink: 0 }}>
          <Dumbbell size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--silver-100)", marginBottom: "4px" }}>
            {workout.planName}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {workout.planType && <Badge variant="default" style={{ fontSize: "10px", textTransform: "capitalize" }}>{workout.planType.replace("_", " ")}</Badge>}
            {workout.difficultyLevel && (
              <span style={{ fontSize: "10px", padding: "2px 8px", background: workout.difficultyLevel === "advanced" ? "rgba(232,25,44,0.1)" : workout.difficultyLevel === "intermediate" ? "rgba(251,191,36,0.1)" : "rgba(34,197,94,0.1)", color: workout.difficultyLevel === "advanced" ? "var(--red-400)" : workout.difficultyLevel === "intermediate" ? "#fbbf24" : "var(--green-400)", border: `1px solid ${workout.difficultyLevel === "advanced" ? "rgba(232,25,44,0.2)" : workout.difficultyLevel === "intermediate" ? "rgba(251,191,36,0.2)" : "rgba(34,197,94,0.2)"}`, borderRadius: "50px", fontWeight: 700, textTransform: "capitalize" }}>
                {workout.difficultyLevel}
              </span>
            )}
            {workout.durationWeeks && (
              <span style={{ fontSize: "10px", color: "var(--silver-600)" }}>
                <Flame size={10} style={{ display: "inline" }} /> {workout.durationWeeks} weeks
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          <button className="btn-ghost" style={{ padding: "5px" }} onClick={() => onEdit(workout)}><Pencil size={13} /></button>
          <button className="btn-ghost" style={{ padding: "5px", color: "#ff4d5a" }} onClick={() => onDelete(workout._id)}><Trash2 size={13} /></button>
        </div>
      </div>

      {workout.trainer && (
        <p style={{ fontSize: "11px", color: "var(--silver-500)", marginBottom: "10px" }}>
          Trainer: <strong style={{ color: "var(--silver-300)" }}>{workout.trainer.firstName} {workout.trainer.lastName}</strong>
        </p>
      )}

      {/* Assign button + assigned count */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: exercises.length > 0 ? "10px" : "0" }}>
        <button
          className="btn-ghost"
          style={{ fontSize: "12px", color: "var(--red-400)", padding: "5px 10px", border: "1px solid rgba(232,25,44,0.25)", borderRadius: "6px", display: "flex", alignItems: "center", gap: "5px" }}
          onClick={() => onAssign(workout)}
        >
          <UserPlus size={12} /> Assign to Member
        </button>
        {assignedCount > 0 && (
          <span style={{ fontSize: "11px", color: "var(--silver-500)" }}>
            {assignedCount} member{assignedCount !== 1 ? "s" : ""} assigned
          </span>
        )}
      </div>

      {/* Exercises accordion */}
      {exercises.length > 0 && (
        <>
          <button
            className="btn-ghost"
            style={{ width: "100%", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-elevated)", borderRadius: "8px", fontSize: "12px" }}
            onClick={() => setExpanded((p) => !p)}
          >
            <span>{exercises.length} exercises</span>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {expanded && (
            <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {exercises.map((ex: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "var(--bg-input)", borderRadius: "6px" }}>
                  <div style={{ width: 20, height: 20, background: "rgba(232,25,44,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "var(--red-500)", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--silver-200)" }}>{ex.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--silver-600)" }}>
                      {ex.sets && `${ex.sets} sets`}{ex.reps && ` × ${ex.reps} reps`}{ex.weight && ` · ${ex.weight}`}{ex.restTime && ` (Rest: ${ex.restTime})`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────
function WorkoutFormModal({ isOpen, onClose, workout, onSuccess }: any) {
  const [form, setForm] = useState({ planName: "", planType: "strength", difficultyLevel: "beginner", durationWeeks: "" });
  const [exercises, setExercises] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (workout) {
      setForm({
        planName: workout.planName || "",
        planType: workout.planType || "strength",
        difficultyLevel: workout.difficultyLevel || "beginner",
        durationWeeks: workout.durationWeeks ? String(workout.durationWeeks) : "",
      });
      setExercises(workout.exercises || []);
    } else {
      setForm({ planName: "", planType: "strength", difficultyLevel: "beginner", durationWeeks: "" });
      setExercises([]);
    }
  }, [workout, isOpen]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const formattedExercises = exercises
        .filter(ex => ex.name && ex.name.trim() !== "")
        .map((ex, idx) => ({
          name: ex.name,
          sets: ex.sets ? Number(ex.sets) : undefined,
          reps: ex.reps ? Number(ex.reps) : undefined,
          weight: ex.weight || undefined,
          restTime: ex.restTime || undefined,
          order: idx + 1
        }));

      const body = {
        planName: form.planName,
        planType: form.planType,
        difficultyLevel: form.difficultyLevel,
        durationWeeks: form.durationWeeks ? Number(form.durationWeeks) : undefined,
        exercises: formattedExercises
      };

      if (workout) await workoutsAPI.update(workout._id, body);
      else await workoutsAPI.create(body);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={workout ? "Edit Workout" : "Create Workout Plan"} maxWidth={600}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSubmit as any} disabled={saving}>{saving ? "Saving…" : workout ? "Save" : "Create"}</button></>}
    >
      {error && <div style={{ background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#ff6b79" }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label className="input-label">Workout Plan Name *</label>
          <input className="input-field" value={form.planName} onChange={(e) => set("planName", e.target.value)} required placeholder="e.g. Beginner Strength Plan" />
        </div>
        <div>
          <label className="input-label">Plan Type</label>
          <select className="input-field" value={form.planType} onChange={(e) => set("planType", e.target.value)}>
            {["weight_loss", "muscle_gain", "endurance", "flexibility", "strength", "custom"].map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="input-label">Difficulty Level</label>
          <select className="input-field" value={form.difficultyLevel} onChange={(e) => set("difficultyLevel", e.target.value)}>
            {["beginner","intermediate","advanced"].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label className="input-label">Duration (Weeks)</label>
          <input className="input-field" type="number" value={form.durationWeeks} onChange={(e) => set("durationWeeks", e.target.value)} placeholder="e.g. 4" />
        </div>

        {/* SECTION: Exercises Editor */}
        <div style={{ gridColumn: "1/-1", marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--red-400)" }}>Exercises</h4>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: "12px", color: "var(--red-400)", padding: "2px 8px" }}
              onClick={() => setExercises(p => [...p, { name: "", sets: "", reps: "", weight: "", restTime: "" }])}
            >
              + Add Exercise
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "220px", overflowY: "auto", paddingRight: "4px" }}>
            {exercises.map((ex, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1.5fr 1.5fr auto", gap: "8px", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <input className="input-field" style={{ padding: "6px 10px", fontSize: "12px" }} placeholder="Name" value={ex.name}
                  onChange={(e) => { const next = [...exercises]; next[idx].name = e.target.value; setExercises(next); }} required />
                <input className="input-field" style={{ padding: "6px 10px", fontSize: "12px" }} type="number" placeholder="Sets" value={ex.sets || ""}
                  onChange={(e) => { const next = [...exercises]; next[idx].sets = e.target.value; setExercises(next); }} />
                <input className="input-field" style={{ padding: "6px 10px", fontSize: "12px" }} type="number" placeholder="Reps" value={ex.reps || ""}
                  onChange={(e) => { const next = [...exercises]; next[idx].reps = e.target.value; setExercises(next); }} />
                <input className="input-field" style={{ padding: "6px 10px", fontSize: "12px" }} placeholder="Weight (10kg)" value={ex.weight || ""}
                  onChange={(e) => { const next = [...exercises]; next[idx].weight = e.target.value; setExercises(next); }} />
                <input className="input-field" style={{ padding: "6px 10px", fontSize: "12px" }} placeholder="Rest (60s)" value={ex.restTime || ""}
                  onChange={(e) => { const next = [...exercises]; next[idx].restTime = e.target.value; setExercises(next); }} />
                <button type="button" className="btn-ghost" style={{ color: "#ff4d5a", padding: "6px" }}
                  onClick={() => setExercises(p => p.filter((_, i) => i !== idx))}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {exercises.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--silver-600)", fontSize: "12px", padding: "10px" }}>No exercises added yet.</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorkoutsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editWorkout, setEditWorkout] = useState<any>(null);
  const [assignWorkout, setAssignWorkout] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await workoutsAPI.getAll(); setWorkouts(r.data.data || []); }
    catch { setWorkouts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    load();
  }, [load, authLoading, isAuthenticated]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Workout Plans</h1>
            <p className="page-subtitle">{workouts.length} plans available</p>
          </div>
          <button className="btn-primary" onClick={() => { setEditWorkout(null); setShowModal(true); }}>
            <Plus size={16} /> New Workout
          </button>
        </div>

        {loading ? <LoadingSpinner fullPage size={32} text="Loading workouts…" /> :
          workouts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px", color: "var(--silver-500)" }}>
              <Dumbbell size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>No workout plans yet</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: "18px" }}>
              {workouts.map((w) => (
                <WorkoutCard key={w._id} workout={w}
                  onEdit={(wo: any) => { setEditWorkout(wo); setShowModal(true); }}
                  onDelete={handleDelete}
                  onAssign={(wo: any) => setAssignWorkout(wo)} />
              ))}
            </div>
          )
        }
      </div>

      <WorkoutFormModal isOpen={showModal} onClose={() => setShowModal(false)} workout={editWorkout}
        onSuccess={() => { setShowModal(false); load(); }} />

      <AssignWorkoutModal
        isOpen={!!assignWorkout}
        onClose={() => setAssignWorkout(null)}
        workout={assignWorkout}
        onSuccess={() => { setAssignWorkout(null); load(); }}
      />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await workoutsAPI.delete(deleteId);
            load();
          } catch {
            alert("Failed to delete workout plan.");
          }
        }}
        title="Delete Workout Plan"
        message="Are you sure you want to delete this workout plan? This action cannot be undone."
      />
    </DashboardLayout>
  );
}
