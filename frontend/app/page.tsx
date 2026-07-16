"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatsCard from "@/components/ui/StatsCard";
import {
  Users, UserCheck, CreditCard, CalendarCheck, Award, TrendingUp,
  AlertTriangle, UserPlus, Dumbbell
} from "lucide-react";
import { dashboardAPI, membersAPI, membershipsAPI, attendanceAPI, paymentsAPI } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import Badge, { getBadgeVariant } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "12px",
        color: "var(--silver-200)",
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
        <div style={{ color: "var(--red-400)" }}>
          {typeof payload[0].value === "number" && payload[0].value > 1000
            ? `₹${payload[0].value.toLocaleString()}`
            : payload[0].value}
        </div>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading, admin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    if (admin && admin.role === 'trainer') {
      router.replace("/members");
      return;
    }

    const load = async () => {
      try {
        const [statsRes, membersRes, attendanceStatsRes, revenueStatsRes] = await Promise.all([
          dashboardAPI.getStats(),
          membersAPI.getAll({ limit: 5, sort: "-createdAt" }),
          attendanceAPI.getStats(),
          paymentsAPI.getRevenueStats(),
        ]);
        setStats(statsRes.data.data);
        setRecentMembers(membersRes.data.data || []);

        // Process Weekly Attendance (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return {
            dateStr: `${year}-${month}-${day}`,
            day: d.toLocaleDateString("en-IN", { weekday: "short" }),
            checkins: 0,
          };
        });
        const weeklyStats = attendanceStatsRes.data.data.weekly || [];
        const formattedWeekly = last7Days.map(dayObj => {
          const match = weeklyStats.find((w: any) => w.date === dayObj.dateStr);
          return {
            day: dayObj.day,
            checkins: match ? match.checkIns : 0,
          };
        });
        setWeeklyData(formattedWeekly);

        // Process Monthly Revenue Trend (last 6 months)
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          return {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            monthName: MONTHS[d.getMonth()],
            revenue: 0,
          };
        });
        const monthlyTrend = revenueStatsRes.data.data.monthlyTrend || [];
        const formattedRevenue = last6Months.map(monthObj => {
          const match = monthlyTrend.find((m: any) => m._id.year === monthObj.year && m._id.month === monthObj.month);
          return {
            month: monthObj.monthName,
            revenue: match ? match.revenue : 0,
          };
        });
        setRevenueData(formattedRevenue);

      } catch (e) {
        console.error("Failed to load dashboard statistics:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, isAuthenticated, admin]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <DashboardLayout>
      <div className="page-container">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <Link href="/members" className="btn-primary">
            <UserPlus size={16} />
            Add Member
          </Link>
        </div>

        {/* Stats grid */}
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
          <StatsCard
            title="Total Members"
            value={stats?.members?.total ?? 0}
            icon={<Users size={22} />}
            iconColor="var(--red-500)"
            iconBg="rgba(232,25,44,0.1)"
            trend={12}
            trendLabel="vs last month"
            loading={loading}
          />
          <StatsCard
            title="Active Memberships"
            value={stats?.memberships?.active ?? 0}
            icon={<Award size={22} />}
            iconColor="#22c55e"
            iconBg="rgba(34,197,94,0.1)"
            trend={5}
            trendLabel="vs last month"
            loading={loading}
          />
          <StatsCard
            title="Revenue This Month"
            value={loading ? "—" : formatCurrency(stats?.revenue?.thisMonth ?? 0)}
            icon={<CreditCard size={22} />}
            iconColor="#60a5fa"
            iconBg="rgba(96,165,250,0.1)"
            trend={8}
            trendLabel="vs last month"
            loading={loading}
          />
          <StatsCard
            title="Today's Check-ins"
            value={stats?.attendance?.today ?? 0}
            icon={<CalendarCheck size={22} />}
            iconColor="#fbbf24"
            iconBg="rgba(251,191,36,0.1)"
            loading={loading}
            subtitle="check-ins today"
          />
          <StatsCard
            title="Active Trainers"
            value={stats?.trainers?.total ?? 0}
            icon={<UserCheck size={22} />}
            iconColor="#c084fc"
            iconBg="rgba(168,85,247,0.1)"
            loading={loading}
            subtitle="on staff"
          />
          <StatsCard
            title="Expiring Soon"
            value={stats?.memberships?.expiringSoon ?? 0}
            icon={<AlertTriangle size={22} />}
            iconColor="#fbbf24"
            iconBg="rgba(251,191,36,0.1)"
            loading={loading}
            subtitle="within 7 days"
          />
        </div>

        {/* Charts row */}
        <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
          {/* Weekly attendance */}
          <div className="chart-container">
            <div className="chart-title">Weekly Attendance</div>
            <div className="chart-subtitle">Check-ins over the past 7 days</div>
            {loading ? (
              <div style={{ display: "flex", height: "200px", alignItems: "center", justifyContent: "center" }}>
                <LoadingSpinner size={24} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8192c" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#e8192c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "var(--silver-600)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--silver-600)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="checkins" stroke="#e8192c" strokeWidth={2} fill="url(#redGrad)" dot={{ fill: "#e8192c", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, fill: "#e8192c" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly revenue */}
          <div className="chart-container">
            <div className="chart-title">Revenue Trend</div>
            <div className="chart-subtitle">Monthly revenue over last 6 months</div>
            {loading ? (
              <div style={{ display: "flex", height: "200px", alignItems: "center", justifyContent: "center" }}>
                <LoadingSpinner size={24} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "var(--silver-600)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "var(--silver-600)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#e8192c" radius={[4,4,0,0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bottom row — recent members + quick actions */}
        <div className="bottom-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          {/* Recent members */}
          <div className="chart-container">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <div className="chart-title">Recent Members</div>
                <div className="chart-subtitle">Latest registrations</div>
              </div>
              <Link href="/members" className="btn-ghost" style={{ fontSize: "12px" }}>
                View all →
              </Link>
            </div>

            {loading ? (
              <LoadingSpinner fullPage size={28} />
            ) : recentMembers.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--silver-600)", padding: "40px 0", fontSize: "13px" }}>
                No members yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {recentMembers.map((m: any) => (
                  <Link key={m._id} href={`/members/${m._id}`} style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px",
                        borderRadius: "8px",
                        transition: "background 0.15s ease",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--bg-elevated)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                    >
                      <div
                        className="avatar"
                        style={{ width: 36, height: 36, fontSize: 13 }}
                      >
                        {m.firstName?.charAt(0)}
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontWeight: 600, color: "var(--silver-100)", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.firstName} {m.lastName}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--silver-600)" }}>
                          {m.contact?.phone}
                        </div>
                      </div>
                      <Badge variant={getBadgeVariant(m.gender || "other")}>
                        {m.gender}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="chart-container">
            <div className="chart-title" style={{ marginBottom: "4px" }}>Quick Actions</div>
            <div className="chart-subtitle">Common tasks</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
              {[
                { label: "Check In Member", href: "/attendance", icon: <CalendarCheck size={16} />, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
                { label: "Add New Member", href: "/members", icon: <UserPlus size={16} />, color: "var(--red-500)", bg: "rgba(232,25,44,0.1)" },
                { label: "Record Payment", href: "/payments", icon: <CreditCard size={16} />, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
                { label: "View Expiring", href: "/memberships", icon: <AlertTriangle size={16} />, color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
                { label: "Workout Plans", href: "/workouts", icon: <Dumbbell size={16} />, color: "#c084fc", bg: "rgba(168,85,247,0.1)" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    textDecoration: "none",
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = action.color;
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 0 12px ${action.bg}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
                  }}
                >
                  <div style={{ width: 32, height: 32, background: action.bg, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: action.color, flexShrink: 0 }}>
                    {action.icon}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)" }}>
                    {action.label}
                  </span>
                  <span style={{ marginLeft: "auto", color: "var(--silver-600)", fontSize: "16px" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .charts-grid {
            grid-template-columns: 1fr !important;
          }
          .bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
