"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/ui/StatsCard";
import {
  TrendingUp, Users, Award, CreditCard, UserCheck, AlertTriangle,
  Calendar, Landmark, Sparkles, UserPlus, IndianRupee
} from "lucide-react";
import { paymentsAPI, membersAPI, membershipsAPI, trainersAPI } from "@/lib/api";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Badge, { getBadgeVariant } from "@/components/ui/Badge";
import Link from "next/link";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#e8192c", "#22c55e", "#3b82f6", "#fbbf24", "#a855f7", "#ec4899"];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [membershipStats, setMembershipStats] = useState<any>(null);
  const [memberStats, setMemberStats] = useState<any>(null);
  const [trainerStats, setTrainerStats] = useState<any>(null);
  const [expiring, setExpiring] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [revenueRes, membershipRes, memberRes, trainerRes, expiringRes] = await Promise.all([
          paymentsAPI.getRevenueStats(),
          membershipsAPI.getStats(),
          membersAPI.getStats(),
          trainersAPI.getStats(),
          membershipsAPI.getExpiring()
        ]);

        setRevenueStats(revenueRes.data.data);
        setMembershipStats(membershipRes.data.data);
        setMemberStats(memberRes.data.data);
        setTrainerStats(trainerRes.data.data);
        setExpiring(expiringRes.data.data || []);
      } catch (err) {
        console.error("Error loading reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <LoadingSpinner size="large" />
        </div>
      </DashboardLayout>
    );
  }

  // Format revenue trend data for chart
  const trendData = (revenueStats?.monthlyTrend || []).map((t: any) => {
    const monthIndex = t._id?.month - 1;
    const monthLabel = monthIndex >= 0 && monthIndex < 12 ? MONTH_NAMES[monthIndex] : `${t._id?.month}`;
    return {
      name: `${monthLabel} ${t._id?.year}`,
      revenue: t.revenue,
      count: t.count
    };
  });

  // Fallback mock data if trendData is empty
  const finalTrendData = trendData.length > 0 ? trendData : [
    { name: "Jan", revenue: 45000 },
    { name: "Feb", revenue: 58000 },
    { name: "Mar", revenue: 62000 },
    { name: "Apr", revenue: 78000 },
    { name: "May", revenue: 85000 },
    { name: "Jun", revenue: 95000 }
  ];

  // Format membership status data
  const membershipStatusData = (membershipStats?.byStatus || []).map((s: any) => ({
    name: s._id.toUpperCase(),
    value: s.count
  }));

  const finalMembershipData = membershipStatusData.length > 0 ? membershipStatusData : [
    { name: "ACTIVE", value: 32 },
    { name: "PENDING", value: 5 },
    { name: "EXPIRED", value: 8 }
  ];

  // Format gender distribution
  const genderData = (memberStats?.genderDistribution || []).map((g: any) => ({
    name: g._id ? g._id.charAt(0).toUpperCase() + g._id.slice(1) : "Other",
    value: g.count
  }));

  const finalGenderData = genderData.length > 0 ? genderData : [
    { name: "Male", value: 65 },
    { name: "Female", value: 35 }
  ];

  // Format payment method splits
  const paymentMethodData = (revenueStats?.revenueByMethod || []).map((m: any) => ({
    name: m._id ? m._id.toUpperCase() : "UNKNOWN",
    value: m.total
  }));

  const finalPaymentMethodData = paymentMethodData.length > 0 ? paymentMethodData : [
    { name: "CASH", value: 25000 },
    { name: "UPI", value: 85000 },
    { name: "CARD", value: 40000 }
  ];

  return (
    <DashboardLayout>
      <div className="page-container" style={{ paddingBottom: "40px" }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: "28px" }}>
          <div>
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="page-subtitle">Deep dive overview of your gym revenue, memberships, and user metrics.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          <StatsCard
            title="Total Revenue Generated"
            value={formatCurrency(revenueStats?.total?.total || 0)}
            icon={<IndianRupee size={22} />}
            iconColor="var(--red-500)"
            iconBg="rgba(232,25,44,0.1)"
            subtitle={`${revenueStats?.total?.count || 0} Successful Transactions`}
          />
          <StatsCard
            title="Revenue This Month"
            value={formatCurrency(revenueStats?.currentMonth?.revenue || 0)}
            icon={<CreditCard size={22} />}
            iconColor="#22c55e"
            iconBg="rgba(34,197,94,0.1)"
            subtitle={`${revenueStats?.currentMonth?.transactions || 0} Current Month Payments`}
          />
          <StatsCard
            title="Active Members"
            value={memberStats?.totalMembers || 0}
            icon={<Users size={22} />}
            iconColor="#60a5fa"
            iconBg="rgba(96,165,250,0.1)"
            subtitle={`${memberStats?.activeMemberships || 0} Active Memberships`}
          />
          <StatsCard
            title="Total Staff Trainers"
            value={trainerStats?.totalTrainers || 0}
            icon={<UserCheck size={22} />}
            iconColor="#c084fc"
            iconBg="rgba(168,85,247,0.1)"
            subtitle="Active Staff Members"
          />
        </div>

        {/* First Row Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "20px", marginBottom: "28px" }}>
          {/* Revenue Trend Area Chart */}
          <div className="chart-container" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--silver-100)", marginBottom: "4px" }}>Revenue Growth Trend</h3>
            <p style={{ fontSize: "12px", color: "var(--silver-500)", marginBottom: "16px" }}>Monthly billing collections trend over last 6 months</p>
            <div style={{ height: "280px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={finalTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8192c" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#e8192c" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="name" stroke="var(--silver-500)" fontSize={11} axisLine={false} tickLine={false} dy={8} />
                  <YAxis stroke="var(--silver-500)" fontSize={11} axisLine={false} tickLine={false} dx={-6} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", borderRadius: "12px", boxShadow: "var(--dropdown-shadow)", padding: "10px 14px" }}
                    itemStyle={{ color: "var(--silver-100)" }}
                    labelStyle={{ color: "var(--silver-400)", fontWeight: "bold", marginBottom: "4px" }}
                    formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#e8192c" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" dot={{ fill: "#e8192c", r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Membership Breakdown Bar Chart */}
          <div className="chart-container" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--silver-100)", marginBottom: "4px" }}>Membership Status Distributions</h3>
            <p style={{ fontSize: "12px", color: "var(--silver-500)", marginBottom: "16px" }}>Count of memberships divided by active states</p>
            <div style={{ height: "280px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={finalMembershipData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="expiredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="defaultGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
                  <XAxis dataKey="name" stroke="var(--silver-500)" fontSize={11} axisLine={false} tickLine={false} dy={8} />
                  <YAxis stroke="var(--silver-500)" fontSize={11} axisLine={false} tickLine={false} dx={-6} />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", borderRadius: "12px", boxShadow: "var(--dropdown-shadow)", padding: "10px 14px" }}
                    itemStyle={{ color: "var(--silver-100)" }}
                    labelStyle={{ color: "var(--silver-400)", fontWeight: "bold", marginBottom: "4px" }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {finalMembershipData.map((entry: any, index: number) => {
                      const status = entry.name.toUpperCase();
                      let fill = "url(#defaultGrad)";
                      if (status.includes("ACTIVE")) fill = "url(#activeGrad)";
                      else if (status.includes("PENDING")) fill = "url(#pendingGrad)";
                      else if (status.includes("EXPIRED")) fill = "url(#expiredGrad)";
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Second Row Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "28px" }}>
          {/* Gender Split Pie Chart */}
          <div className="chart-container" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--silver-100)", marginBottom: "4px" }}>Gender Representation</h3>
            <p style={{ fontSize: "12px", color: "var(--silver-500)", marginBottom: "16px" }}>Gender demographic split of active gym members</p>
            <div style={{ height: "220px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="maleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="femaleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                      <stop offset="100%" stopColor="#be185d" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="otherGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                      <stop offset="100%" stopColor="#7e22ce" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={finalGenderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {finalGenderData.map((entry: any, index: number) => {
                      const g = entry.name.toLowerCase();
                      let fill = "url(#otherGrad)";
                      if (g.includes("male") && !g.includes("female")) fill = "url(#maleGrad)";
                      else if (g.includes("female")) fill = "url(#femaleGrad)";
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", borderRadius: "12px", boxShadow: "var(--dropdown-shadow)", padding: "8px 12px" }}
                    itemStyle={{ color: "var(--silver-100)" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "var(--silver-400)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Share */}
          <div className="chart-container" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--silver-100)", marginBottom: "4px" }}>Revenue by Payment Channel</h3>
            <p style={{ fontSize: "12px", color: "var(--silver-500)", marginBottom: "16px" }}>Share of collection amounts by payment type</p>
            <div style={{ height: "220px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0f766e" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="upiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="netbankingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ea580c" stopOpacity={1} />
                      <stop offset="100%" stopColor="#c2410c" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="emiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#be123c" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="defaultPaymentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
                      <stop offset="100%" stopColor="#475569" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={finalPaymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {finalPaymentMethodData.map((entry: any, index: number) => {
                      const method = entry.name.toLowerCase();
                      let fill = "url(#defaultPaymentGrad)";
                      if (method.includes("cash")) fill = "url(#cashGrad)";
                      else if (method.includes("card")) fill = "url(#cardGrad)";
                      else if (method.includes("upi")) fill = "url(#upiGrad)";
                      else if (method.includes("netbanking") || method.includes("bank")) fill = "url(#netbankingGrad)";
                      else if (method.includes("emi")) fill = "url(#emiGrad)";
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", borderColor: "var(--border)", borderRadius: "12px", boxShadow: "var(--dropdown-shadow)", padding: "8px 12px" }}
                    itemStyle={{ color: "var(--silver-100)" }}
                    formatter={(value: any) => [formatCurrency(value), "Collected"]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "var(--silver-400)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trainer Capacity workload */}
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--silver-100)", marginBottom: "4px" }}>Trainer Client Workload</h3>
            <p style={{ fontSize: "12px", color: "var(--silver-500)", marginBottom: "16px" }}>Number of members assigned per active trainer</p>
            <div style={{ overflowY: "auto", maxHeight: "200px" }}>
              {(trainerStats?.trainersWithMembers || []).length > 0 ? (
                (trainerStats?.trainersWithMembers || []).map((t: any, idx: number) => (
                  <div key={t._id || idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="avatar" style={{ width: "28px", height: "28px", fontSize: "11px" }}>{t.fullName?.charAt(0)}</div>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--silver-200)" }}>{t.fullName}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--red-400)" }}>
                      {t.memberCount} {t.memberCount === 1 ? "Client" : "Clients"}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--silver-600)", fontSize: "13px" }}>No trainer assignments yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Expiring Memberships Section */}
        <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--silver-100)" }}>Expiring & Inactive Memberships Reports</h3>
              <p style={{ fontSize: "12px", color: "var(--silver-500)" }}>Memberships scheduled to expire within the next 7 days</p>
            </div>
            {expiring.length > 0 && <span style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600 }}>{expiring.length} Alerts</span>}
          </div>

          <div style={{ overflowX: "auto" }}>
            {expiring.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--silver-500)" }}>
                    <th style={{ padding: "12px 8px" }}>Member</th>
                    <th style={{ padding: "12px 8px" }}>Plan Name</th>
                    <th style={{ padding: "12px 8px" }}>Expiry Date</th>
                    <th style={{ padding: "12px 8px" }}>Status</th>
                    <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expiring.map((m: any) => (
                    <tr key={m._id} style={{ borderBottom: "1px solid var(--border)", color: "var(--silver-200)" }}>
                      <td style={{ padding: "12px 8px", fontWeight: 600 }}>{m.member?.fullName || "Gym Member"}</td>
                      <td style={{ padding: "12px 8px" }}>{m.plan?.name || "Membership Plan"}</td>
                      <td style={{ padding: "12px 8px" }}>{new Date(m.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <Badge variant="pending">Expiring</Badge>
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right" }}>
                        <Link href={`/members/${m.member?._id || ""}`} className="btn-ghost" style={{ fontSize: "12px", padding: "4px 8px" }}>
                          View Member
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: "center", padding: "32px", color: "var(--silver-600)" }}>
                <Sparkles size={24} style={{ marginBottom: "8px", opacity: 0.5 }} />
                <p>No memberships are expiring in the next 7 days.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
