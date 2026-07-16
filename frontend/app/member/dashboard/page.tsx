"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import {
  membershipsAPI, workoutsAPI, dietsAPI,
  attendanceAPI, announcementsAPI, plansAPI, paymentGatewayAPI, paymentsAPI,
  trainersAPI
} from "@/lib/api";
import {
  Award, QrCode, Activity, LogOut, Utensils, Dumbbell,
  Maximize2, Smartphone, Megaphone, Flame, Beef, Droplets,
  ChevronDown, ChevronUp, Zap, CreditCard, CheckCircle,
  Calendar, Clock, Shield, Star, AlertCircle, RefreshCw,
  Sun, Moon, Settings, Users, Eye, EyeOff
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useTheme } from "@/lib/theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysLeft(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function MacroPill({ label, value, unit, color, icon }: any) {
  return (
    <div style={{ background: "var(--icon-bg)", border: `1px solid ${color}22`, borderRadius: "12px", padding: "14px 10px", textAlign: "center", flex: 1 }}>
      <div style={{ color, marginBottom: "6px", display: "flex", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color }}>{value ?? "—"}</div>
      <div style={{ fontSize: "10px", color: "var(--silver-600)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>{label}</div>
      {unit && value != null && <div style={{ fontSize: "9px", color: "var(--silver-700)" }}>{unit}</div>}
    </div>
  );
}

function SectionCard({ icon, title, accent = "var(--red-500)", children, action }: any) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "18px", padding: "24px", backdropFilter: "blur(10px)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div style={{ width: 36, height: 36, borderRadius: "10px", background: `${accent}18`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
          {icon}
        </div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "var(--silver-100)", margin: 0, flex: 1 }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ isOpen, onClose, membership, plans, onSuccess }: any) {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [step, setStep] = useState<"select" | "checkout" | "success">("select");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const rzpScriptLoaded = useRef(false);

  useEffect(() => {
    if (!isOpen) { setStep("select"); setSelectedPlan(null); setError(""); return; }
    // Load Razorpay script
    if (!rzpScriptLoaded.current && !document.getElementById("rzp-script")) {
      const script = document.createElement("script");
      script.id = "rzp-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
      rzpScriptLoaded.current = true;
    }
    // Auto-select current plan if exists
    if (membership?.plan && plans.length > 0) {
      const current = plans.find((p: any) => p._id === membership.plan._id || p._id === membership.plan);
      if (current) setSelectedPlan(current);
    }
  }, [isOpen, membership, plans]);

  const handlePay = async () => {
    if (!selectedPlan || !membership) return;
    setPaying(true); setError("");
    try {
      // Create Razorpay order
      const orderRes = await paymentGatewayAPI.createOrder({
        amount: selectedPlan.price,
        membershipId: membership._id,
      });
      const { orderId, amount, currency, memberName, memberPhone, memberEmail } = orderRes.data.data;

      // Open Razorpay checkout
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const options: any = {
        key: rzpKey,
        amount: amount * 100,
        currency,
        name: "AlphaLift Fitness",
        description: `${selectedPlan.planName} Membership`,
        order_id: orderId,
        prefill: { name: memberName, contact: memberPhone, email: memberEmail },
        theme: { color: "#e8192c" },
        handler: async (response: any) => {
          try {
            await paymentGatewayAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              membershipId: membership._id,
            });
            setStep("success");
            setTimeout(() => { onSuccess(); onClose(); }, 2500);
          } catch (err: any) {
            setError("Payment captured but verification failed. Contact support.");
          }
        },
        modal: { ondismiss: () => setPaying(false) }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (res: any) => {
        setError(`Payment failed: ${res.error?.description || "Unknown error"}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to initiate payment. Please try again.");
      setPaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "24px", width: "100%", maxWidth: "520px", overflow: "hidden", boxShadow: "var(--dropdown-shadow)" }}>

        {/* Header */}
        <div style={{ padding: "24px 28px 0", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(232,25,44,0.12)", border: "1px solid rgba(232,25,44,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-400)" }}>
              <CreditCard size={20} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 800, color: "var(--silver-100)" }}>
                {step === "success" ? "Payment Successful!" : "Pay for Membership"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--silver-600)" }}>
                {step === "success" ? "Your membership is now active" : "Secure payment via Razorpay"}
              </div>
            </div>
            <button onClick={onClose} style={{ marginLeft: "auto", background: "var(--logo-bg)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--silver-500)", padding: "6px 10px", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>

          {/* Success state */}
          {step === "success" && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", color: "var(--green-400)" }}>
                <CheckCircle size={40} />
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: "var(--silver-50)", marginBottom: "8px" }}>Payment Verified!</div>
              <div style={{ fontSize: "14px", color: "var(--silver-500)" }}>Your membership is now active. Redirecting…</div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.25)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <AlertCircle size={15} style={{ color: "var(--red-400)", flexShrink: 0, marginTop: "1px" }} />
              <span style={{ fontSize: "13px", color: "#ff6b79" }}>{error}</span>
            </div>
          )}

          {/* Plan Selection */}
          {step === "select" && (
            <>
              {/* Current membership info */}
              {membership && (
                <div style={{ background: "rgba(232,25,44,0.05)", border: "1px solid rgba(232,25,44,0.12)", borderRadius: "12px", padding: "14px 16px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "11px", color: "var(--silver-600)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Current Membership</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--silver-100)" }}>{membership.plan?.planName || "Active Plan"}</div>
                      <div style={{ fontSize: "12px", color: "var(--silver-500)", marginTop: "2px" }}>
                        Status: <span style={{ color: membership.payment?.status === "paid" ? "var(--green-400)" : "#fbbf24", fontWeight: 600 }}>
                          {membership.payment?.status === "paid" ? "Paid ✓" : membership.payment?.status || "Pending"}
                        </span>
                      </div>
                    </div>
                    {membership.endDate && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "11px", color: "var(--silver-600)" }}>Expires</div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: daysLeft(membership.endDate) < 7 ? "#fbbf24" : "var(--silver-300)" }}>
                          {new Date(membership.endDate).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plan cards */}
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
                Select a Plan to Pay For
              </div>

              {plans.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--silver-600)", fontSize: "13px" }}>No membership plans available.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
                  {plans.map((plan: any) => {
                    const isSelected = selectedPlan?._id === plan._id;
                    const isCurrentPlan = membership?.plan?._id === plan._id || membership?.plan === plan._id;
                    return (
                      <div
                        key={plan._id}
                        onClick={() => setSelectedPlan(plan)}
                        style={{
                          padding: "14px 16px", borderRadius: "12px", cursor: "pointer",
                          border: isSelected ? "1px solid rgba(232,25,44,0.5)" : "1px solid var(--border)",
                          background: isSelected ? "rgba(232,25,44,0.06)" : "var(--icon-bg)",
                          transition: "all 0.2s",
                          position: "relative"
                        }}
                      >
                        {isCurrentPlan && (
                          <div style={{ position: "absolute", top: "10px", right: "10px", fontSize: "9px", fontWeight: 700, color: "var(--green-400)", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 6px", borderRadius: "50px" }}>CURRENT</div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--silver-100)", marginBottom: "4px" }}>{plan.planName}</div>
                            <div style={{ fontSize: "12px", color: "var(--silver-500)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                              <span><Clock size={10} style={{ display: "inline" }} /> {plan.duration} {plan.durationUnit || "months"}</span>
                              {plan.planType && <span style={{ textTransform: "capitalize" }}>{plan.planType}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, color: isSelected ? "var(--red-400)" : "var(--silver-100)" }}>
                              ₹{plan.price?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        {plan.description && (
                          <div style={{ fontSize: "11px", color: "var(--silver-600)", marginTop: "8px", lineHeight: 1.4 }}>{plan.description}</div>
                        )}
                        {(plan.features || []).length > 0 && (
                          <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {plan.features.slice(0, 4).map((f: string, i: number) => (
                              <span key={i} style={{ fontSize: "10px", color: "var(--silver-500)", background: "var(--icon-bg)", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: "50px" }}>
                                ✓ {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
 
              {/* Security badge */}
              <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "var(--icon-bg)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                <Shield size={14} style={{ color: "var(--green-400)", flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: "var(--silver-600)" }}>
                  Payments are 100% secure, processed by <strong style={{ color: "var(--silver-400)" }}>Razorpay</strong>. UPI, cards, net banking accepted.
                </span>
              </div>

              {/* Summary + Pay button */}
              {selectedPlan && (
                <div style={{ marginTop: "20px", padding: "16px", background: "rgba(232,25,44,0.06)", border: "1px solid rgba(232,25,44,0.2)", borderRadius: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", color: "var(--silver-300)" }}>{selectedPlan.planName}</span>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 800, color: "var(--red-400)" }}>₹{selectedPlan.price?.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={handlePay}
                    disabled={paying || !membership}
                    style={{
                      width: "100%", padding: "14px", borderRadius: "12px",
                      background: "linear-gradient(135deg, #e8192c, #ff4d5a)",
                      border: "none", color: "white", fontFamily: "var(--font-display)",
                      fontSize: "15px", fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      opacity: paying || !membership ? 0.7 : 1,
                      boxShadow: "0 4px 20px rgba(232,25,44,0.35)",
                      transition: "all 0.2s"
                    }}
                  >
                    {paying ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Processing…</> : <><CreditCard size={16} /> Pay ₹{selectedPlan.price?.toLocaleString()} Now</>}
                  </button>
                  {!membership && <p style={{ fontSize: "11px", color: "#fbbf24", textAlign: "center", marginTop: "8px" }}>You need an active membership record to pay. Contact the gym.</p>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Profile Modal for Member ─────────────────────────────────────────────
function EditProfileModal({ isOpen, onClose, user, refreshMe }: any) {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
      setError("");
      setSuccess("");
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const api = (await import("@/lib/api")).authAPI;
      await api.updateMe({ firstName, lastName, phone, email });

      if (newPassword) {
        if (!currentPassword) {
          setError("Current password is required to change password.");
          setLoading(false);
          return;
        }
        await api.updatePassword({ currentPassword, newPassword });
      }

      setSuccess("Profile updated successfully!");
      await refreshMe();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "flex-start", overflowY: "auto", zIndex: 9999, padding: "40px 20px" }}>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "24px", width: "100%", maxWidth: "460px", margin: "auto 0", overflow: "hidden", boxShadow: "var(--dropdown-shadow)" }}>
        
        {/* Header */}
        <div style={{ padding: "24px 28px 0", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 42, height: 42, borderRadius: "12px", background: "rgba(232,25,44,0.12)", border: "1px solid rgba(232,25,44,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-400)" }}>
              <Settings size={20} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 800, color: "var(--silver-100)" }}>Edit Profile Details</div>
              <div style={{ fontSize: "12px", color: "var(--silver-600)" }}>Update your personal and login settings</div>
            </div>
            <button type="button" onClick={onClose} style={{ marginLeft: "auto", background: "var(--logo-bg)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--silver-500)", padding: "6px 10px", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && <div style={{ background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.25)", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#ff6b79" }}>{error}</div>}
          {success && <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#22c55e" }}>{success}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>First Name</label>
              <input type="text" className="input-field" style={{ width: "100%", padding: "10px 12px" }} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Last Name</label>
              <input type="text" className="input-field" style={{ width: "100%", padding: "10px 12px" }} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Phone Number</label>
            <input type="tel" className="input-field" style={{ width: "100%", padding: "10px 12px" }} value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Email Address</label>
            <input type="email" className="input-field" style={{ width: "100%", padding: "10px 12px" }} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div style={{ height: "1px", background: "var(--border)", margin: "8px 0" }} />
          
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Change Password (Optional)</div>

          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Current Password</label>
            <div style={{ position: "relative" }}>
              <input type={showCurrentPass ? "text" : "password"} className="input-field" style={{ width: "100%", padding: "10px 40px 10px 12px" }} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              <button
                type="button"
                onClick={() => setShowCurrentPass((p) => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--silver-500)", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input type={showNewPass ? "text" : "password"} className="input-field" style={{ width: "100%", padding: "10px 40px 10px 12px" }} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowNewPass((p) => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--silver-500)", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--silver-400)", marginBottom: "6px" }}>Confirm New</label>
              <div style={{ position: "relative" }}>
                <input type={showConfirmPass ? "text" : "password"} className="input-field" style={{ width: "100%", padding: "10px 40px 10px 12px" }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((p) => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--silver-500)", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button type="button" className="btn-secondary" style={{ flex: 1, padding: "12px", justifyContent: "center" }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 2, padding: "12px", justifyContent: "center" }} disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────
function ExerciseRow({ ex, index }: any) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "rgba(232,25,44,0.04)", border: "1px solid rgba(232,25,44,0.1)", borderRadius: "10px" }}>
      <div style={{ width: 26, height: 26, borderRadius: "8px", background: "rgba(232,25,44,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "var(--red-400)", flexShrink: 0 }}>{index + 1}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-100)", marginBottom: "2px" }}>{ex.name}</div>
        <div style={{ fontSize: "11px", color: "var(--silver-500)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {ex.sets && <span>{ex.sets} sets</span>}
          {ex.reps && <span>× {ex.reps} reps</span>}
          {ex.weight && <span style={{ color: "var(--red-400)" }}>· {ex.weight}</span>}
          {ex.restTime && <span style={{ color: "var(--silver-600)" }}>Rest: {ex.restTime}</span>}
        </div>
      </div>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--red-400)", background: "rgba(232,25,44,0.08)", padding: "3px 8px", borderRadius: "50px", whiteSpace: "nowrap" }}>
        {ex.sets}×{ex.reps}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MemberDashboard() {
  const { user, logout, refreshMe } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [membership, setMembership] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [occupancy, setOccupancy] = useState<number>(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRFullscreen, setShowQRFullscreen] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [memberPayments, setMemberPayments] = useState<any[]>([]);

  // Trainer state
  const [assignedTrainer, setAssignedTrainer] = useState<any>(null);
  const [trainerRating, setTrainerRating] = useState<number>(0);
  const [ratingHover, setRatingHover] = useState<number>(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const loadData = async () => {
    if (!user) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("alphalift_token") : null;
    console.log("loadData started. User:", user, "Token:", token ? token.substring(0, 15) + "..." : "missing");
    
    try {
      const [memRes, workRes, dietRes] = await Promise.allSettled([
        membershipsAPI.getMyMembership(),
        workoutsAPI.getMyWorkout(),
        dietsAPI.getMyDiet(),
      ]);

      if (memRes.status === "fulfilled") {
        console.log("Fetched membership:", memRes.value.data);
        setMembership(memRes.value.data.data);
      } else {
        console.error("Failed to fetch membership:", memRes.reason);
      }

      if (workRes.status === "fulfilled") {
        console.log("Fetched workouts:", workRes.value.data);
        setWorkouts(workRes.value.data.data || []);
      } else {
        console.error("Failed to fetch workouts:", workRes.reason);
      }

      if (dietRes.status === "fulfilled") {
        console.log("Fetched diets:", dietRes.value.data);
        setDiets(dietRes.value.data.data || []);
      } else {
        console.error("Failed to fetch diets:", dietRes.reason);
      }

      if (user.assignedTrainer) {
        try {
          const trainerRes = await trainersAPI.getOne(user.assignedTrainer);
          if (trainerRes.data.success) {
            setAssignedTrainer(trainerRes.data.data.trainer);
            setTrainerRating(trainerRes.data.data.memberRating || 0);
          }
        } catch (err) {
          console.error("Failed to load trainer details:", err);
        }
      }

      try {
        const r = await attendanceAPI.getLiveOccupancy();
        setOccupancy(r.data.occupancy || 0);
      } catch (err) {
        console.error("Failed to fetch occupancy:", err);
      }
      
      try {
        const r = await announcementsAPI.getAll();
        setAnnouncements((r.data.data || []).filter((a: any) => a.channels?.includes("portal")));
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
      
      try {
        const r = await plansAPI.getAll();
        console.log("Fetched membership plans successfully:", r.data);
        setPlans(r.data.data || []);
      } catch (err) {
        console.error("Failed to fetch membership plans:", err);
      }

      try {
        const r = await paymentsAPI.getMemberPayments(user._id);
        setMemberPayments(r.data.data.payments || []);
      } catch (err) {
        console.error("Failed to fetch member payments:", err);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try { const r = await attendanceAPI.getLiveOccupancy(); setOccupancy(r.data.occupancy || 0); } catch { }
    }, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
          <strong>${user?.firstName || "Member"} ${user?.lastName || ""}</strong><br>
          Phone: ${user?.phone || "N/A"}<br>
          Email: ${user?.email || "N/A"}
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <LoadingSpinner size="large" />
          <p style={{ color: "var(--silver-500)", marginTop: "16px", fontSize: "14px" }}>Loading your portal…</p>
        </div>
      </div>
    );
  }

  const activeWorkout = workouts[0];
  const activeDiet = diets[0];
  const nt = activeDiet?.nutritionTargets || activeDiet?.macros || {};
  const calories = nt.dailyCalories ?? nt.calories;
  const protein = nt.protein?.grams ?? nt.protein;
  const carbs = nt.carbs?.grams ?? nt.carbs;
  const fat = nt.fat?.grams ?? nt.fat;
  const membershipDays = membership?.endDate ? daysLeft(membership.endDate) : null;
  const isPaid = membership?.payment?.status === "paid";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&bgcolor=ffffff&color=000000&margin=12&data=${encodeURIComponent(user?.phone || "")}`;
  const visibleExercises = showAllExercises ? (activeWorkout?.exercises || []) : (activeWorkout?.exercises || []).slice(0, 4);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--silver-100)" }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--header-bg)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="header-container" style={{ maxWidth: "1280px", margin: "0 auto", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 36, height: 36, overflow: "hidden", background: "var(--logo-bg)", borderRadius: "10px", border: "1px solid var(--border)" }}>
              <img src="/GymLogo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px" }}>
              <span style={{ color: "var(--silver-200)" }}>ALPHA</span><span style={{ color: "var(--red-500)" }}>LIFT</span>
            </div>
            <div className="header-divider" style={{ height: "16px", width: "1px", background: "var(--border)", margin: "0 4px" }} />
            <span className="header-badge" style={{ fontSize: "11px", color: "var(--silver-600)", background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.15)", padding: "2px 8px", borderRadius: "50px" }}>Member Portal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, var(--red-500), #ff6b79)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "white" }}>
                {user?.firstName?.charAt(0) || "M"}
              </div>
              <div className="user-name-wrapper">
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)" }}>{user?.firstName} {user?.lastName}</div>
                <div style={{ fontSize: "10px", color: "var(--silver-600)" }}>Active Member</div>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="header-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                color: "var(--silver-500)",
                background: "var(--logo-bg)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "7px 12px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                transition: "all 0.2s"
              }}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            <button onClick={() => setShowProfileModal(true)} className="header-btn" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--silver-500)", background: "var(--logo-bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>
              <Settings size={13} /> <span className="header-btn-text">Edit Profile</span>
            </button>

            <button onClick={logout} className="header-btn" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--silver-500)", background: "var(--logo-bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "7px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>
              <LogOut size={13} /> <span className="header-btn-text">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 28px" }}>

        {/* ── Announcements ── */}
        {announcements.length > 0 && (
          <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {announcements.slice(0, 2).map((a: any) => (
              <div key={a._id} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 18px", background: "linear-gradient(90deg, rgba(232,25,44,0.06) 0%, transparent 100%)", border: "1px solid rgba(232,25,44,0.18)", borderRadius: "12px" }}>
                <div style={{ padding: "7px", background: "rgba(232,25,44,0.12)", borderRadius: "9px", color: "var(--red-400)", flexShrink: 0 }}><Megaphone size={14} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--silver-100)" }}>{a.title}</span>
                    <span style={{ fontSize: "10px", color: "var(--silver-600)" }}>{new Date(a.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--silver-400)", marginTop: "4px", lineHeight: 1.5 }}>{a.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Welcome ── */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>
            Welcome back, <span style={{ color: "var(--red-400)" }}>{user?.firstName}</span>! 💪
          </h1>
          <p style={{ color: "var(--silver-500)", fontSize: "14px" }}>Here's your complete fitness overview for today.</p>
        </div>

        {/* ── Payment Alert Banner ── */}
        {membership && !isPaid && (
          <div style={{
            marginBottom: "24px", padding: "16px 20px",
            background: "linear-gradient(90deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.03) 100%)",
            border: "1px solid rgba(251,191,36,0.3)", borderRadius: "14px",
            display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap"
          }}>
            <AlertCircle size={22} style={{ color: "#fbbf24", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#fbbf24", marginBottom: "2px" }}>Payment Pending</div>
              <div style={{ fontSize: "12px", color: "var(--silver-500)" }}>Your membership payment is due. Complete payment to activate all benefits.</div>
            </div>
            <button
              onClick={() => setShowPayModal(true)}
              style={{ padding: "10px 20px", background: "#fbbf24", border: "none", borderRadius: "10px", color: "#000", fontWeight: 800, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Pay Now →
            </button>
          </div>
        )}

        {/* ── Stats Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>

          <div style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "16px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green-400)" }}>
              <Activity size={20} className="pulse-icon" />
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--silver-600)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Live Occupancy</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, color: "var(--green-400)" }}>{occupancy}</span>
                <span style={{ fontSize: "11px", color: "var(--silver-500)" }}>in gym</span>
              </div>
            </div>
          </div>

          {/* Membership + Pay button */}
          <div style={{ background: membership ? "linear-gradient(135deg, rgba(232,25,44,0.08), rgba(232,25,44,0.02))" : "rgba(255,255,255,0.02)", border: membership ? "1px solid rgba(232,25,44,0.2)" : "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(232,25,44,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-500)" }}>
              <Award size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: "var(--silver-600)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Membership</div>
              {membership ? (
                <>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--silver-100)" }}>{membership.plan?.planName || "Active"}</div>
                  {membershipDays !== null && <div style={{ fontSize: "11px", color: membershipDays < 7 ? "#fbbf24" : "var(--silver-500)" }}>{membershipDays > 0 ? `${membershipDays} days left` : "Expired"}</div>}
                </>
              ) : (
                <div style={{ fontSize: "13px", color: "var(--silver-500)", fontStyle: "italic" }}>No active plan</div>
              )}
            </div>
          </div>

          {/* Kiosk ID */}
          <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "16px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
              <Smartphone size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--silver-600)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Kiosk Check-in ID</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 800, color: "var(--silver-100)" }}>{user?.phone}</div>
              <div style={{ fontSize: "11px", color: "var(--silver-500)" }}>Scan QR at terminal</div>
            </div>
          </div>

          {/* Pay / Renew button card */}
          <div
            onClick={() => setShowPayModal(true)}
            style={{
              background: "linear-gradient(135deg, rgba(232,25,44,0.12), rgba(232,25,44,0.04))",
              border: "1px solid rgba(232,25,44,0.3)", borderRadius: "16px", padding: "18px 20px",
              display: "flex", alignItems: "center", gap: "14px", cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(232,25,44,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-400)" }}>
              <CreditCard size={20} />
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--silver-600)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>
                {isPaid ? "Renew / Upgrade" : "Pay Now"}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--red-400)" }}>
                {isPaid ? "Extend Membership" : "Complete Payment"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--silver-600)" }}>Via UPI · Cards · Net Banking</div>
            </div>
          </div>

        </div>

        {/* ── Main Grid ── */}
        <div className="portal-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "22px" }}>

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* QR Card */}
            <SectionCard icon={<QrCode size={17} />} title="Check-in QR Code">
              <p style={{ fontSize: "12px", color: "var(--silver-500)", marginBottom: "18px", lineHeight: 1.5 }}>Scan at the kiosk scanner to check in or out.</p>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
                <div style={{ padding: "14px", background: "white", borderRadius: "16px", boxShadow: "0 0 40px rgba(232,25,44,0.15)", width: "180px", height: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src={qrCodeUrl} alt="QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: "13px", fontWeight: 700, color: "var(--silver-300)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "14px" }}>
                <Smartphone size={12} style={{ color: "var(--silver-600)" }} /> {user?.phone}
              </div>
              <button className="btn-secondary" style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }} onClick={() => setShowQRFullscreen(true)}>
                <Maximize2 size={13} /> Fullscreen QR
              </button>
            </SectionCard>

            {/* Trainer Rating Card */}
            <SectionCard
              icon={<Star size={17} />}
              title="Your Personal Trainer"
              accent="var(--red-500)"
            >
              {assignedTrainer ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--red-500), #ff6b79)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "white",
                        boxShadow: "0 4px 12px rgba(232,25,44,0.2)"
                      }}
                    >
                      {assignedTrainer.firstName?.charAt(0) || "T"}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--silver-100)" }}>
                        {assignedTrainer.firstName} {assignedTrainer.lastName}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--silver-500)", marginTop: "2px" }}>
                        {assignedTrainer.specialization?.slice(0, 2).join(", ") || "Fitness Expert"}
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars Section */}
                  <div style={{ background: "var(--icon-bg)", border: "1px solid var(--border)", borderRadius: "12px", padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--silver-400)", fontWeight: 600 }}>
                      Rate your trainer
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const filled = ratingHover ? star <= ratingHover : star <= trainerRating;
                        return (
                          <button
                            key={star}
                            onClick={async () => {
                              if (ratingSubmitting) return;
                              setRatingSubmitting(true);
                              setRatingSuccess(false);
                              try {
                                const res = await trainersAPI.rate(assignedTrainer._id, star);
                                if (res.data.success) {
                                  setTrainerRating(star);
                                  setRatingSuccess(true);
                                  // Refresh trainer rating average dynamically
                                  const updateRes = await trainersAPI.getOne(assignedTrainer._id);
                                  if (updateRes.data.success) {
                                    setAssignedTrainer(updateRes.data.data.trainer);
                                  }
                                }
                              } catch (err) {
                                console.error("Rating submission failed:", err);
                              } finally {
                                setRatingSubmitting(false);
                              }
                            }}
                            onMouseEnter={() => setRatingHover(star)}
                            onMouseLeave={() => setRatingHover(0)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "2px",
                              transition: "transform 0.1s ease",
                              transform: (ratingHover === star) ? "scale(1.2)" : "scale(1)"
                            }}
                          >
                            <Star
                              size={20}
                              fill={filled ? "#fbbf24" : "transparent"}
                              stroke={filled ? "#fbbf24" : "var(--silver-500)"}
                              style={{ transition: "color 0.2s" }}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {ratingSuccess && (
                      <span style={{ fontSize: "10px", color: "var(--green-400)", fontWeight: 700, marginTop: "2px" }}>
                        Thank you for rating! ✓
                      </span>
                    )}

                    {/* Overall Score */}
                    <div style={{ fontSize: "11px", color: "var(--silver-500)", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>Average:</span>
                      <span style={{ fontWeight: 700, color: "var(--silver-200)" }}>{assignedTrainer.rating?.average || 0}</span>
                      <Star size={10} fill="#fbbf24" stroke="#fbbf24" style={{ display: "inline" }} />
                      <span style={{ color: "var(--silver-600)" }}>({assignedTrainer.rating?.count || 0} reviews)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0", color: "var(--silver-500)" }}>
                  <div style={{ fontSize: "12px", lineHeight: 1.5, marginBottom: "8px" }}>
                    No personal trainer has been assigned to your profile yet.
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--silver-600)" }}>
                    Contact gym desk to request an expert trainer.
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Plan Details */}
            {membership && (
              <SectionCard
                icon={<Calendar size={17} />}
                title="Plan Details"
                accent="#3b82f6"
                action={
                  <button
                    onClick={() => setShowPayModal(true)}
                    style={{ fontSize: "11px", color: "var(--red-400)", background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.2)", padding: "4px 10px", borderRadius: "50px", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <CreditCard size={10} /> {isPaid ? "Renew" : "Pay Now"}
                  </button>
                }
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {[
                    { label: "Plan", value: membership.plan?.planName, color: "var(--red-400)" },
                    { label: "Start", value: membership.startDate ? new Date(membership.startDate).toLocaleDateString("en-IN") : "—" },
                    { label: "Expires", value: membership.endDate ? new Date(membership.endDate).toLocaleDateString("en-IN") : "—" },
                    { label: "Amount", value: membership.payment?.finalAmount ? `₹${membership.payment.finalAmount.toLocaleString()}` : "—" },
                    {
                      label: "Payment",
                      value: isPaid ? "Paid ✓" : "Pending",
                      color: isPaid ? "var(--green-400)" : "#fbbf24"
                    },
                  ].map((item, i, arr) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ fontSize: "12px", color: "var(--silver-500)" }}>{item.label}</span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: item.color || "var(--silver-200)" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Transaction History & Billing */}
            <SectionCard
              icon={<CreditCard size={17} />}
              title="Transaction History"
              accent="#22c55e"
            >
              {memberPayments.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--silver-600)", fontSize: "12px" }}>
                  No payment transactions found.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {memberPayments.map((p: any) => (
                    <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--icon-bg)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--silver-200)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          ₹{p.amount?.toLocaleString()} · <span style={{ color: p.status === "success" || p.status === "paid" ? "var(--green-400)" : "#fbbf24", textTransform: "capitalize" }}>{p.status}</span>
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--silver-600)", marginTop: "2px" }}>
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString("en-IN")} · {p.paymentMethod || p.method}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadInvoice(p)}
                        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "6px", color: "var(--green-400)", padding: "4px 8px", fontSize: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
                      >
                        Receipt
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* Workout */}
            <SectionCard icon={<Dumbbell size={17} />} title="Assigned Workout Program">
              {activeWorkout ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px", background: "rgba(232,25,44,0.05)", border: "1px solid rgba(232,25,44,0.12)", borderRadius: "12px", marginBottom: "14px" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 800, color: "var(--silver-50)" }}>{activeWorkout.planName}</div>
                      <div style={{ fontSize: "12px", color: "var(--silver-500)", marginTop: "4px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {activeWorkout.trainer && <span>👤 {activeWorkout.trainer.firstName} {activeWorkout.trainer.lastName}</span>}
                        {activeWorkout.durationWeeks && <span>📅 {activeWorkout.durationWeeks} weeks</span>}
                        {activeWorkout.planType && <span style={{ textTransform: "capitalize" }}>🏋️ {activeWorkout.planType.replace("_", " ")}</span>}
                      </div>
                    </div>
                    {activeWorkout.difficultyLevel && (
                      <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", padding: "4px 10px", borderRadius: "50px", background: activeWorkout.difficultyLevel === "advanced" ? "rgba(232,25,44,0.15)" : activeWorkout.difficultyLevel === "intermediate" ? "rgba(251,191,36,0.12)" : "rgba(34,197,94,0.12)", color: activeWorkout.difficultyLevel === "advanced" ? "var(--red-400)" : activeWorkout.difficultyLevel === "intermediate" ? "#fbbf24" : "var(--green-400)", border: `1px solid ${activeWorkout.difficultyLevel === "advanced" ? "rgba(232,25,44,0.2)" : activeWorkout.difficultyLevel === "intermediate" ? "rgba(251,191,36,0.2)" : "rgba(34,197,94,0.2)"}`, whiteSpace: "nowrap" }}>
                        {activeWorkout.difficultyLevel}
                      </span>
                    )}
                  </div>
                  {(activeWorkout.exercises || []).length > 0 && (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Exercises ({activeWorkout.exercises.length})</span>
                        <span style={{ fontSize: "11px", color: "var(--red-400)", display: "flex", alignItems: "center", gap: "4px" }}><Zap size={10} /> Ready to train</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                        {visibleExercises.map((ex: any, idx: number) => <ExerciseRow key={idx} ex={ex} index={idx} />)}
                      </div>
                      {activeWorkout.exercises.length > 4 && (
                        <button onClick={() => setShowAllExercises(p => !p)} style={{ marginTop: "10px", width: "100%", padding: "9px", background: "rgba(232,25,44,0.05)", border: "1px solid rgba(232,25,44,0.12)", borderRadius: "10px", color: "var(--red-400)", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          {showAllExercises ? <><ChevronUp size={13} /> Show Less</> : <><ChevronDown size={13} /> Show All {activeWorkout.exercises.length} Exercises</>}
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 0", color: "var(--silver-600)" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}><Dumbbell size={26} style={{ opacity: 0.3 }} /></div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--silver-500)", marginBottom: "4px" }}>No workout plan assigned yet</p>
                  <p style={{ fontSize: "12px", color: "var(--silver-700)" }}>Ask your trainer to assign a program.</p>
                </div>
              )}
            </SectionCard>

            {/* Diet */}
            <SectionCard icon={<Utensils size={17} />} title="Assigned Nutrition & Diet Plan" accent="#fbbf24">
              {activeDiet ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)", borderRadius: "12px", marginBottom: "14px" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 800, color: "var(--silver-50)" }}>{activeDiet.planName || activeDiet.name}</div>
                      <div style={{ fontSize: "12px", color: "var(--silver-500)", marginTop: "4px" }}>
                        {activeDiet.trainer && <span>👤 {activeDiet.trainer.firstName} {activeDiet.trainer.lastName}</span>}
                      </div>
                    </div>
                    {activeDiet.planType && (
                      <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "capitalize", padding: "4px 10px", borderRadius: "50px", background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)", whiteSpace: "nowrap" }}>
                        {activeDiet.planType.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  {(calories != null || protein != null || carbs != null || fat != null) && (
                    <>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Daily Nutrition Targets</div>
                      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                        {calories != null && <MacroPill label="Calories" value={calories} unit="kcal" color="#fbbf24" icon={<Flame size={13} />} />}
                        {protein != null && <MacroPill label="Protein" value={protein} unit="g" color="var(--red-400)" icon={<Beef size={13} />} />}
                        {carbs != null && <MacroPill label="Carbs" value={carbs} unit="g" color="#60a5fa" icon={<Droplets size={13} />} />}
                        {fat != null && <MacroPill label="Fat" value={fat} unit="g" color="#c084fc" icon={<Droplets size={13} />} />}
                      </div>
                    </>
                  )}

                  {(activeDiet.meals || []).length > 0 && (
                    <>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Meal Schedule</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                        {activeDiet.meals.map((meal: any, idx: number) => (
                          <div key={idx} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px 14px", background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.1)", borderRadius: "10px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "70px", paddingTop: "1px" }}>{meal.mealType || `Meal ${idx + 1}`}</span>
                            <span style={{ fontSize: "13px", color: "var(--silver-300)", lineHeight: 1.4 }}>{meal.description || meal.name || meal.foods?.join(", ") || "—"}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 0", color: "var(--silver-600)" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "18px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}><Utensils size={26} style={{ opacity: 0.3 }} /></div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--silver-500)", marginBottom: "4px" }}>No diet plan assigned yet</p>
                  <p style={{ fontSize: "12px", color: "var(--silver-700)" }}>Ask your trainer to assign a nutrition plan.</p>
                </div>
              )}
            </SectionCard>

          </div>
        </div>
      </main>

      {/* ── QR Fullscreen ── */}
      {showQRFullscreen && (
        <div onClick={() => setShowQRFullscreen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.08)", padding: "44px", borderRadius: "28px", maxWidth: "420px", width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, marginBottom: "6px", color: "var(--silver-100)" }}>Kiosk Check-in Scanner</div>
            <p style={{ fontSize: "13px", color: "var(--silver-500)", marginBottom: "32px" }}>Hold this QR code up to the terminal webcam.</p>
            <div style={{ padding: "20px", background: "white", borderRadius: "24px", boxShadow: "0 0 60px rgba(232,25,44,0.2)", width: "260px", height: "260px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
              <img src={qrCodeUrl} alt="QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--silver-200)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
              <Smartphone size={16} style={{ color: "var(--silver-600)" }} /> {user?.phone}
            </div>
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", height: "46px" }} onClick={() => setShowQRFullscreen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
      <PaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        membership={membership}
        plans={plans}
        onSuccess={() => { setShowPayModal(false); loadData(); }}
      />

      <EditProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        refreshMe={refreshMe}
      />

      <style>{`
        .pulse-icon { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.12);opacity:0.7;} }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        @media (max-width: 960px) { .portal-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) {
          .header-badge { display: none !important; }
          .header-divider { display: none !important; }
          .user-name-wrapper { display: none !important; }
          .header-btn-text { display: none !important; }
          .header-btn {
            padding: 8px !important;
            min-width: 32px !important;
            justify-content: center !important;
            gap: 0 !important;
          }
          .header-container {
            padding: 10px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
