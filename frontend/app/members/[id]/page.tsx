"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { getBadgeVariant } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { membersAPI, attendanceAPI, paymentsAPI, membershipsAPI, workoutsAPI } from "@/lib/api";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Activity, CreditCard, Dumbbell, Scale, Ruler } from "lucide-react";
import Link from "next/link";
import { use } from "react";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Weight Loss", muscle_gain: "Muscle Gain",
  flexibility: "Flexibility", endurance: "Endurance",
  strength: "Strength", general_fitness: "General Fitness"
};

type Tab = "overview" | "attendance" | "payments" | "memberships" | "workouts";

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [tabData, setTabData] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    membersAPI.getOne(id).then((r) => { setMember(r.data.data?.member || r.data.data); }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const loaders: Record<Tab, () => Promise<any>> = {
      overview: async () => [],
      attendance: () => attendanceAPI.getMemberAttendance(id).then((r) => r.data.data?.attendance || []),
      payments: () => paymentsAPI.getMemberPayments(id).then((r) => r.data.data?.payments || []),
      memberships: () => membershipsAPI.getMemberMemberships(id).then((r) => r.data.data || []),
      workouts: () => workoutsAPI.getMemberWorkouts(id).then((r) => r.data.data || []),
    };
    setTabLoading(true);
    loaders[tab]().then(setTabData).catch(() => setTabData([])).finally(() => setTabLoading(false));
  }, [tab, id]);

  if (loading) return <DashboardLayout><LoadingSpinner fullPage text="Loading member…" /></DashboardLayout>;
  if (!member) return <DashboardLayout><div style={{ padding: "40px", color: "var(--silver-500)", textAlign: "center" }}>Member not found.</div></DashboardLayout>;

  const bmi = member.physicalStats?.bmi;
  const bmiLabel = !bmi ? "—" : bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const bmiColor = !bmi ? "var(--silver-500)" : bmi < 18.5 ? "#60a5fa" : bmi < 25 ? "#22c55e" : bmi < 30 ? "#fbbf24" : "#ff4d5a";

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Back */}
        <Link href="/members" className="btn-ghost" style={{ marginBottom: "20px", display: "inline-flex" }}>
          <ArrowLeft size={15} /> Back to Members
        </Link>

        {/* Profile header */}
        <div className="chart-container" style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
          <div className="avatar" style={{ width: 80, height: 80, fontSize: 28, flexShrink: 0 }}>
            {member.firstName?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800 }}>
                {member.firstName} {member.lastName}
              </h1>
              <Badge variant={member.isActive ? "active" : "cancelled"} dot>
                {member.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant={getBadgeVariant(member.gender)}>{member.gender}</Badge>
            </div>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {member.contact?.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--silver-400)", fontSize: "13px" }}>
                  <Phone size={13} /> {member.contact.phone}
                </div>
              )}
              {member.contact?.email && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--silver-400)", fontSize: "13px" }}>
                  <Mail size={13} /> {member.contact.email}
                </div>
              )}
              {member.address?.city && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--silver-400)", fontSize: "13px" }}>
                  <MapPin size={13} /> {member.address.city}, {member.address.state}
                </div>
              )}
              {member.joinedDate && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--silver-400)", fontSize: "13px" }}>
                  <Calendar size={13} /> Joined {new Date(member.joinedDate).toLocaleDateString("en-IN")}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {member.fitnessGoals?.map((g: string) => (
              <span key={g} style={{ fontSize: "11px", padding: "4px 12px", background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.2)", borderRadius: "50px", color: "var(--red-400)" }}>
                {GOAL_LABELS[g] || g}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-list" style={{ marginBottom: "20px", overflowX: "auto" }}>
          {(["overview","attendance","payments","memberships","workouts"] as Tab[]).map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {/* Physical stats */}
            <div className="chart-container">
              <div className="chart-title" style={{ marginBottom: "16px" }}>Physical Stats</div>
              {[
                { label: "Height", value: member.physicalStats?.heightCm ? `${member.physicalStats.heightCm} cm` : "—", icon: <Ruler size={14} /> },
                { label: "Weight", value: member.physicalStats?.weightKg ? `${member.physicalStats.weightKg} kg` : "—", icon: <Scale size={14} /> },
                { label: "BMI", value: bmi ? `${bmi} (${bmiLabel})` : "—", icon: <Activity size={14} />, color: bmiColor },
                { label: "Body Fat", value: member.physicalStats?.bodyFatPercentage ? `${member.physicalStats.bodyFatPercentage}%` : "—", icon: <Activity size={14} /> },
                { label: "Muscle Mass", value: member.physicalStats?.muscleMassKg ? `${member.physicalStats.muscleMassKg} kg` : "—", icon: <Activity size={14} /> },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--silver-500)", fontSize: "13px" }}>
                    {row.icon} {row.label}
                  </div>
                  <div style={{ fontWeight: 600, color: row.color || "var(--silver-100)", fontSize: "13px" }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* Address Details */}
            <div className="chart-container">
              <div className="chart-title" style={{ marginBottom: "16px" }}>Address Details</div>
              {[
                { label: "Street Address", value: member.address?.street || "—" },
                { label: "City", value: member.address?.city || "—" },
                { label: "State", value: member.address?.state || "—" },
                { label: "Pincode", value: member.address?.pincode || "—" },
                { label: "Full Address", value: member.address?.fullAddress || "—" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid var(--border)", gap: "10px" }}>
                  <div style={{ color: "var(--silver-500)", fontSize: "13px", flexShrink: 0 }}>{row.label}</div>
                  <div style={{ fontWeight: 600, color: "var(--silver-100)", fontSize: "13px", textAlign: "right" }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* System & Consent */}
            <div className="chart-container">
              <div className="chart-title" style={{ marginBottom: "16px" }}>System & Consent</div>
              {[
                { label: "Member ID", value: member._id || "—" },
                { label: "Joined Date", value: member.joinedDate ? new Date(member.joinedDate).toLocaleDateString("en-IN") : "—" },
                { label: "Created At", value: member.createdAt ? new Date(member.createdAt).toLocaleString("en-IN") : "—" },
                { label: "Updated At", value: member.updatedAt ? new Date(member.updatedAt).toLocaleString("en-IN") : "—" },
                { label: "Emergency Consent", value: member.emergencyConsent ? "Granted" : "Declined", color: member.emergencyConsent ? "#22c55e" : "#ff4d5a" },
                { label: "Terms Accepted", value: member.termsAccepted ? "Yes" : "No", color: member.termsAccepted ? "#22c55e" : "#ff4d5a" },
                { label: "Referred By", value: member.referredBy ? (member.referredBy.fullName || member.referredBy._id || member.referredBy) : "None" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ color: "var(--silver-500)", fontSize: "13px" }}>{row.label}</div>
                  <div style={{ fontWeight: 600, color: row.color || "var(--silver-100)", fontSize: "13px", wordBreak: "break-all" }}>{row.value}</div>
                </div>
              ))}
            </div>

            {/* Medical info */}
            <div className="chart-container">
              <div className="chart-title" style={{ marginBottom: "16px" }}>Medical Info</div>
              {(member.medicalConditions || []).length === 0 ? (
                <p style={{ color: "var(--silver-600)", fontSize: "13px" }}>No medical conditions recorded</p>
              ) : (
                (member.medicalConditions || []).map((c: string) => (
                  <span key={c} style={{ display: "inline-block", margin: "3px", padding: "4px 10px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "50px", fontSize: "12px", color: "#fbbf24" }}>{c}</span>
                ))
              )}
            </div>
          </div>
        )}

        {tab !== "overview" && (
          <div className="chart-container" style={{ padding: 0, overflow: "hidden" }}>
            {tabLoading ? (
              <LoadingSpinner fullPage size={28} text={`Loading ${tab}…`} />
            ) : tabData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--silver-600)", fontSize: "13px" }}>
                No {tab} data found
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    {tab === "attendance" && <><th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th></>}
                    {tab === "payments" && <><th>Date</th><th>Amount</th><th>Method</th><th>Status</th></>}
                    {tab === "memberships" && <><th>Plan</th><th>Start</th><th>End</th><th>Status</th></>}
                    {tab === "workouts" && <><th>Workout</th><th>Type</th><th>Status</th></>}
                  </tr>
                </thead>
                <tbody>
                  {tabData.map((row: any) => (
                    <tr key={row._id}>
                      {tab === "attendance" && (
                        <>
                          <td>{new Date(row.checkIn?.time || row.date).toLocaleDateString("en-IN")}</td>
                          <td>{row.checkIn?.time ? new Date(row.checkIn.time).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                          <td>{row.checkOut?.time ? new Date(row.checkOut.time).toLocaleTimeString("en-IN", {hour:"2-digit",minute:"2-digit"}) : "—"}</td>
                          <td style={{ color: "var(--silver-400)" }}>{row.duration ? `${row.duration} min` : "—"}</td>
                        </>
                      )}
                      {tab === "payments" && (
                        <>
                          <td>{new Date(row.paymentDate || row.createdAt).toLocaleDateString("en-IN")}</td>
                          <td style={{ color: "var(--green-400)", fontWeight: 700 }}>₹{row.amount?.toLocaleString()}</td>
                          <td style={{ textTransform: "capitalize" }}>{row.paymentMethod || row.method}</td>
                          <td><Badge variant={getBadgeVariant(row.status)}>{row.status}</Badge></td>
                        </>
                      )}
                      {tab === "memberships" && (
                        <>
                          <td style={{ fontWeight: 600 }}>{row.plan?.name || "—"}</td>
                          <td>{row.startDate ? new Date(row.startDate).toLocaleDateString("en-IN") : "—"}</td>
                          <td>{row.endDate ? new Date(row.endDate).toLocaleDateString("en-IN") : "—"}</td>
                          <td><Badge variant={getBadgeVariant(row.status)}>{row.status}</Badge></td>
                        </>
                      )}
                      {tab === "workouts" && (
                        <>
                          <td style={{ fontWeight: 600 }}>{row.planName || "—"}</td>
                          <td style={{ color: "var(--silver-400)", textTransform: "capitalize" }}>{row.planType || "—"}</td>
                          <td><Badge variant={getBadgeVariant(row.memberAssignment?.status || "assigned")}>{row.memberAssignment?.status || "assigned"}</Badge></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
