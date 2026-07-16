"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { trainersAPI, membersAPI } from "@/lib/api";
import { UserPlus, Star, Phone, Mail, Clock, Pencil, Trash2, Users } from "lucide-react";

function TrainerCard({ trainer, onEdit, onDelete, onManageMembers }: any) {
  const initials = `${trainer.firstName?.charAt(0) || ""}${trainer.lastName?.charAt(0) || ""}`;
  return (
    <div
      className="glass-card"
      style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div
          className="avatar"
          style={{
            width: 52, height: 52, fontSize: 18, flexShrink: 0,
            background: "linear-gradient(135deg, #333, #555)",
            border: "2px solid var(--border)"
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--silver-100)", marginBottom: "2px" }}>
            {trainer.firstName} {trainer.lastName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={11} fill={s <= Math.round(trainer.rating?.average || 0) ? "#fbbf24" : "transparent"} stroke="#fbbf24" />
            ))}
            <span style={{ fontSize: "11px", color: "var(--silver-600)", marginLeft: "4px" }}>
              ({trainer.rating?.count || 0})
            </span>
          </div>
        </div>
        <Badge variant={trainer.availability?.isAvailable ? "active" : "cancelled"} dot>
          {trainer.availability?.isAvailable ? "Available" : "Unavailable"}
        </Badge>
      </div>

      {/* Contact */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {trainer.contact?.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--silver-400)", fontSize: "12px" }}>
            <Phone size={12} /> {trainer.contact.phone}
          </div>
        )}
        {trainer.contact?.email && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--silver-400)", fontSize: "12px" }}>
            <Mail size={12} /> {trainer.contact.email}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--silver-400)", fontSize: "12px" }}>
          <Clock size={12} /> {trainer.experienceYears || 0} years experience
        </div>
      </div>

      {/* Specializations */}
      {(trainer.specialization || []).length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {trainer.specialization.map((s: string) => (
            <span key={s} style={{ fontSize: "10px", padding: "3px 10px", background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.15)", borderRadius: "50px", color: "var(--red-400)" }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Rate + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--silver-600)" }}>Hourly Rate</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--green-400)" }}>
            ₹{(trainer.hourlyRate || 0).toLocaleString()}<span style={{ fontSize: "11px", color: "var(--silver-600)", fontWeight: 400 }}>/hr</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", padding: "6px 10px", height: "30px" }} onClick={() => onManageMembers(trainer)} title="Manage Members">
            <Users size={12} />
            <span>{trainer.assignedMembersCount || 0}</span>
          </button>
          <button className="btn-ghost" style={{ padding: "6px" }} onClick={() => onEdit(trainer)} title="Edit">
            <Pencil size={14} />
          </button>
          <button className="btn-ghost" style={{ padding: "6px", color: "#ff4d5a" }} onClick={() => onDelete(trainer._id)} title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function TrainerFormModal({ isOpen, onClose, trainer, onSuccess }: any) {
  const [form, setForm] = useState({ firstName: "", lastName: "", "contact.phone": "", "contact.email": "", specialization: "", experienceYears: "", hourlyRate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (trainer) {
      setForm({ firstName: trainer.firstName || "", lastName: trainer.lastName || "", "contact.phone": trainer.contact?.phone || "", "contact.email": trainer.contact?.email || "", specialization: (trainer.specialization || []).join(", "), experienceYears: trainer.experienceYears || "", hourlyRate: trainer.hourlyRate || "" });
    } else {
      setForm({ firstName: "", lastName: "", "contact.phone": "", "contact.email": "", specialization: "", experienceYears: "", hourlyRate: "" });
    }
    setError("");
  }, [trainer, isOpen]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const body = {
        firstName: form.firstName, lastName: form.lastName,
        contact: { phone: form["contact.phone"], email: form["contact.email"] || undefined },
        specialization: form.specialization.split(",").map((s) => s.trim()).filter(Boolean),
        experienceYears: Number(form.experienceYears) || 0,
        hourlyRate: Number(form.hourlyRate) || 0,
      };
      if (trainer) await trainersAPI.update(trainer._id, body);
      else await trainersAPI.create(body);
      onSuccess();
    } catch (err: any) { setError(err?.response?.data?.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={trainer ? "Edit Trainer" : "Add Trainer"}
      footer={<><button className="btn-secondary" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={handleSubmit as any} disabled={saving}>{saving ? "Saving…" : trainer ? "Save" : "Add Trainer"}</button></>}
    >
      {error && <div style={{ background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#ff6b79" }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div><label className="input-label">First Name *</label><input className="input-field" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required /></div>
        <div><label className="input-label">Last Name</label><input className="input-field" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
        <div><label className="input-label">Phone *</label><input className="input-field" value={form["contact.phone"]} onChange={(e) => set("contact.phone", e.target.value)} required /></div>
        <div><label className="input-label">Email</label><input className="input-field" type="email" value={form["contact.email"]} onChange={(e) => set("contact.email", e.target.value)} /></div>
        <div style={{ gridColumn: "1/-1" }}><label className="input-label">Specializations (comma separated)</label><input className="input-field" value={form.specialization} onChange={(e) => set("specialization", e.target.value)} placeholder="Weight Training, Yoga, Cardio" /></div>
        <div><label className="input-label">Experience (years)</label><input className="input-field" type="number" value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} /></div>
        <div><label className="input-label">Hourly Rate (₹)</label><input className="input-field" type="number" value={form.hourlyRate} onChange={(e) => set("hourlyRate", e.target.value)} /></div>
      </div>
    </Modal>
  );
}

function AssignedMembersModal({ isOpen, onClose, trainer, onRefresh }: any) {
  const [assigned, setAssigned] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [error, setError] = useState("");
  const [unassignId, setUnassignId] = useState<string | null>(null);

  const loadAssigned = useCallback(async () => {
    if (!trainer) return;
    setLoading(true);
    try {
      const res = await trainersAPI.getAssignedMembers(trainer._id);
      setAssigned(res.data.data || []);
    } catch {
      setAssigned([]);
    } finally {
      setLoading(false);
    }
  }, [trainer]);

  useEffect(() => {
    if (isOpen && trainer) {
      loadAssigned();
      membersAPI.getAll({ limit: 1000 }).then(r => setAllMembers(r.data.data || [])).catch(() => {});
      setSelectedMemberId("");
      setError("");
    }
  }, [isOpen, trainer, loadAssigned]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    setError("");
    setAssigning(true);
    try {
      await trainersAPI.assignMember(trainer._id, { memberId: selectedMemberId });
      setSelectedMemberId("");
      loadAssigned();
      onRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to assign member");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = (memberId: string) => {
    setUnassignId(memberId);
  };

  const assignableMembers = allMembers.filter(m => m.assignedTrainer !== trainer?._id && m.isActive);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Members - ${trainer?.firstName} ${trainer?.lastName}`} subtitle="Assign or remove gym members assigned to this trainer">
      {error && <div style={{ background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#ff6b79" }}>{error}</div>}
      
      <form onSubmit={handleAssign} style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label className="input-label">Assign New Member</label>
          <select className="input-field" value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} required style={{ background: "var(--bg-input)" }}>
            <option value="">-- Choose Member --</option>
            {assignableMembers.map(m => (
              <option key={m._id} value={m._id}>
                {m.firstName} {m.lastName} ({m.contact?.phone})
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary" disabled={assigning || !selectedMemberId} style={{ height: "42px" }}>
          {assigning ? "Assigning…" : "Assign"}
        </button>
      </form>

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
        <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--silver-300)", marginBottom: "12px" }}>Assigned Members ({assigned.length})</h4>
        {loading ? (
          <LoadingSpinner size={20} text="Loading assigned members…" />
        ) : assigned.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--silver-500)", fontStyle: "italic", textAlign: "center", padding: "20px 0" }}>No members assigned to this trainer yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {assigned.map((m: any) => (
              <div key={m._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", padding: "10px 14px", borderRadius: "8px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--silver-100)" }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize: "11px", color: "var(--silver-500)" }}>{m.contact?.phone || "No phone"}</div>
                </div>
                <button className="btn-ghost" style={{ color: "#ff4d5a", fontSize: "12px", padding: "4px 8px" }} onClick={() => handleUnassign(m._id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={!!unassignId}
        onClose={() => setUnassignId(null)}
        onConfirm={async () => {
          if (!unassignId) return;
          try {
            await membersAPI.update(unassignId, { assignedTrainer: null });
            loadAssigned();
            onRefresh();
          } catch {
            alert("Failed to unassign member");
          }
        }}
        title="Unassign Member"
        message="Are you sure you want to remove this member from the trainer?"
        confirmText="Remove"
      />
    </Modal>
  );
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTrainer, setEditTrainer] = useState<any>(null);
  
  const [manageTrainer, setManageTrainer] = useState<any>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await trainersAPI.getAll(); setTrainers(r.data.data || []); }
    catch { setTrainers([]); } finally { setLoading(false); }
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
            <h1 className="page-title">Trainers</h1>
            <p className="page-subtitle">{trainers.length} trainers on staff</p>
          </div>
          <button className="btn-primary" onClick={() => { setEditTrainer(null); setShowModal(true); }}>
            <UserPlus size={16} /> Add Trainer
          </button>
        </div>

        {loading ? (
          <LoadingSpinner fullPage size={32} text="Loading trainers…" />
        ) : trainers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "var(--silver-500)" }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
            <p>No trainers found</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px,1fr))", gap: "20px" }}>
            {trainers.map((t) => (
              <TrainerCard key={t._id} trainer={t}
                onEdit={(tr: any) => { setEditTrainer(tr); setShowModal(true); }}
                onDelete={handleDelete}
                onManageMembers={(tr: any) => { setManageTrainer(tr); setShowManageModal(true); }}
              />
            ))}
          </div>
        )}
      </div>

      <TrainerFormModal isOpen={showModal} onClose={() => setShowModal(false)} trainer={editTrainer}
        onSuccess={() => { setShowModal(false); load(); }} />

      <AssignedMembersModal isOpen={showManageModal} onClose={() => { setShowManageModal(false); setManageTrainer(null); }} trainer={manageTrainer} onRefresh={load} />

      <DeleteConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await trainersAPI.delete(deleteId);
            load();
          } catch {
            alert("Failed to delete trainer.");
          }
        }}
        title="Delete Trainer Profile"
        message="Are you sure you want to delete this trainer profile? This action cannot be undone."
      />
    </DashboardLayout>
  );
}
