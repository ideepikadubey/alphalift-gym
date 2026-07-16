"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Badge, { getBadgeVariant } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { paymentsAPI } from "@/lib/api";
import { CreditCard, TrendingUp, IndianRupee, Clock, RefreshCw } from "lucide-react";

const METHOD_ICONS: Record<string, string> = { cash: "💵", card: "💳", upi: "📱", netbanking: "🏦", emi: "📆" };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        paymentsAPI.getAll({ page, limit }),
        paymentsAPI.getRevenueStats(),
      ]);
      setPayments(paymentsRes.data.data || []);
      setTotal(paymentsRes.data.total || 0);
      setRevenueStats(statsRes.data.data);
    } catch { setPayments([]); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleDownloadInvoice = (payment: any) => {
    const invoiceHtml = `
  <html>
  <head>
    <title>Invoice - AlphaLift Fitness</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; background: #fff; }
      .invoice-card { max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e8192c; padding-bottom: 20px; margin-bottom: 20px; }
      .logo { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
      .logo span { color: #e8192c; }
      .title { font-size: 13px; color: #666; text-align: right; line-height: 1.5; }
      .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; line-height: 1.5; }
      .details-col { width: 48%; }
      .details-title { font-weight: 700; color: #999; margin-bottom: 6px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
      .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      .table th { background: #f9f9f9; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #eaeaea; color: #666; }
      .table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #eaeaea; color: #444; }
      .total-row td { font-weight: 800; font-size: 15px; border-top: 2px solid #eaeaea; border-bottom: none; color: #111; }
      .footer { text-align: center; color: #999; font-size: 11px; margin-top: 40px; border-top: 1px dashed #eaeaea; padding-top: 20px; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="invoice-card">
      <div class="header">
        <div class="logo">ALPHALIFT<span>FITNESS</span></div>
        <div class="title">
          <strong>RECEIPT / INVOICE</strong><br>
          Date: ${new Date(payment.paymentDate || payment.createdAt).toLocaleDateString("en-IN")}<br>
          Ref: ${payment.transactionId ? payment.transactionId.slice(-8).toUpperCase() : "N/A"}
        </div>
      </div>
      <div class="details">
        <div class="details-col">
          <div class="details-title">Billed To</div>
          <strong>${payment.member?.firstName || "Member"} ${payment.member?.lastName || ""}</strong><br>
          Phone: ${payment.member?.contact?.phone || "N/A"}<br>
          Email: ${payment.member?.contact?.email || "N/A"}
        </div>
        <div class="details-col" style="text-align: right;">
          <div class="details-title">Merchant</div>
          <strong>AlphaLift Fitness Ltd.</strong><br>
          HQ Sector-5, Gurugram<br>
          Haryana, India
        </div>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${payment.purpose || payment.paymentType || "Membership Subscription"} Plan Enrollment</td>
            <td style="text-align: right;">₹${(payment.amount || 0).toLocaleString()}</td>
          </tr>
          <tr class="total-row">
            <td>Total Paid</td>
            <td style="text-align: right; color: #22c55e;">₹${(payment.amount || 0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
      <div style="font-size: 11px; color: #666; background: #fcfcfc; padding: 12px; border-radius: 8px; border: 1px solid #f0f0f0; line-height: 1.5;">
        <strong>Payment Status:</strong> ${payment.status?.toUpperCase() || "SUCCESS"}<br>
        <strong>Payment Method:</strong> ${payment.paymentMethod || payment.method || "Cash"}<br>
        <strong>Transaction ID:</strong> ${payment.transactionId || "N/A"}
      </div>
      <div class="footer">
        Thank you for being part of the AlphaLift Family!<br>
        For billing queries, reach out to billing@alphalift.com
      </div>
    </div>
    <script>
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 300);
      }
    </script>
  </body>
  </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
    } else {
      alert("Popup blocker enabled. Please allow popups to download invoices.");
    }
  };

  const totalRev = revenueStats?.total?.total || 0;
  const thisMonthRev = revenueStats?.currentMonth?.revenue || 0;
  const pendingRev = revenueStats?.pending || 0;
  const avgTx = revenueStats?.total?.count ? (revenueStats.total.total / revenueStats.total.count) : 0;

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Payments</h1>
            <p className="page-subtitle">{total} total transactions</p>
          </div>
          <button className="btn-secondary" onClick={load}><RefreshCw size={15} /> Refresh</button>
        </div>

        {/* Revenue stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "16px", marginBottom: "28px" }}>
          {[
            { label: "Total Revenue", value: fmt(totalRev), icon: <TrendingUp size={20} />, color: "var(--green-400)", bg: "rgba(34,197,94,0.1)" },
            { label: "This Month", value: fmt(thisMonthRev), icon: <CreditCard size={20} />, color: "var(--red-500)", bg: "rgba(232,25,44,0.1)" },
            { label: "Pending", value: fmt(pendingRev), icon: <Clock size={20} />, color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
            { label: "Avg Transaction", value: avgTx > 0 ? fmt(avgTx) : "—", icon: <IndianRupee size={20} />, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ width: 40, height: 40, background: s.bg, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 800, color: s.color, marginBottom: "4px" }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Payments table */}
        <div className="chart-container" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="chart-title">Transaction History</div>
          </div>

          {loading ? (
            <LoadingSpinner fullPage size={28} text="Loading payments…" />
          ) : payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--silver-500)" }}>
              <CreditCard size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>No payments found</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Purpose</th>
                    <th>Transaction ID</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                            {p.member?.firstName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "13px" }}>{p.member?.firstName} {p.member?.lastName}</div>
                            <div style={{ fontSize: "11px", color: "var(--silver-500)" }}>{p.member?.contact?.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--silver-400)", fontSize: "12px" }}>
                        {new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: p.status === "refunded" ? "#ff4d5a" : "var(--green-400)" }}>
                          {p.status === "refunded" ? "-" : ""}₹{(p.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px", textTransform: "capitalize", fontSize: "13px" }}>
                          <span>{METHOD_ICONS[p.paymentMethod || p.method] || "💰"}</span>
                          {p.paymentMethod || p.method || "—"}
                        </span>
                      </td>
                      <td style={{ color: "var(--silver-400)", fontSize: "12px", textTransform: "capitalize" }}>
                        {p.purpose || p.paymentType || "membership"}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--silver-600)" }}>
                        {p.transactionId ? p.transactionId.slice(-8) : "—"}
                      </td>
                      <td><Badge variant={getBadgeVariant(p.status)}>{p.status}</Badge></td>
                      <td>
                        <button
                          onClick={() => handleDownloadInvoice(p)}
                          className="btn-ghost"
                          style={{ padding: "4px 8px", fontSize: "11px", color: "var(--green-400)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "6px", cursor: "pointer" }}
                        >
                          Receipt
                        </button>
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
                showing={payments.length}
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
