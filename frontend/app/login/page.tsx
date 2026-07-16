"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { authAPI } from "@/lib/api";
import { Eye, EyeOff, Lock, User, AlertCircle, Phone, Sparkles, Zap, Shield } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

/* ─── Floating particle canvas ─── */
function GymParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle types: dumbbell dots + rising sparks
    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; type: "spark" | "plate";
      color: string; rotation: number; rotSpeed: number;
    }[] = [];

    const colors = ["rgba(232,25,44,", "rgba(255,80,80,", "rgba(200,10,30,", "rgba(255,120,40,"];

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.5 + 0.2),
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        type: Math.random() > 0.6 ? "plate" : "spark",
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;

        if (p.type === "plate") {
          // Mini weight plate shape
          ctx.strokeStyle = p.color + "0.8)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = p.color + "0.4)";
          ctx.fill();
        } else {
          // Glowing spark
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
          grad.addColorStop(0, p.color + "0.9)");
          grad.addColorStop(1, p.color + "0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

/* ─── Animated power bar ─── */
function PowerBar() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 6 + i * 2,
            borderRadius: 2,
            background: `rgba(232,25,44,${0.3 + i * 0.14})`,
            animation: `powerPulse ${0.8 + i * 0.15}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { login, memberLogin, isAuthenticated, isLoading, userType } = useAuth();
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<"staff" | "member">("staff");
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const [regFirst, setRegFirst] = useState("");
  const [regLast, setRegLast] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regGender, setRegGender] = useState("male");
  const [regDob, setRegDob] = useState("");
  const [regOccupation, setRegOccupation] = useState("");
  const [regEmgName, setRegEmgName] = useState("");
  const [regEmgPhone, setRegEmgPhone] = useState("");
  const [regCity, setRegCity] = useState("Jaipur");
  const [regState, setRegState] = useState("Rajasthan");
  const [regPincode, setRegPincode] = useState("");
  const [regStreet, setRegStreet] = useState("");
  const [regPass, setRegPass] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const type = userType || localStorage.getItem("alphalift_user_type");
      if (type === "member") {
        router.replace("/member/dashboard");
      } else {
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, userType, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LoadingSpinner size="large" text="Verifying session…" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRegSuccess("");
    setLoading(true);
    try {
      if (loginMode === "staff") {
        await login(username, password);
        router.replace("/");
      } else {
        await memberLogin(username, password);
        router.replace("/member/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRegSuccess("");
    setLoading(true);
    try {
      const res = await authAPI.memberRegister({
        firstName: regFirst,
        lastName: regLast,
        gender: regGender,
        dateOfBirth: regDob || undefined,
        occupation: regOccupation || undefined,
        contact: {
          phone: regPhone,
          email: regEmail || undefined,
          emergencyContact: (regEmgName || regEmgPhone) ? {
            name: regEmgName || undefined,
            phone: regEmgPhone || undefined,
          } : undefined,
        },
        address: (regStreet || regCity || regPincode) ? {
          street: regStreet || undefined,
          city: regCity || undefined,
          state: regState || undefined,
          pincode: regPincode || undefined,
        } : undefined,
        password: regPass,
      });
      setRegSuccess(res.data.message || "Registration submitted! Waiting for admin approval.");
      setIsRegisterMode(false);
      setRegFirst(""); setRegLast(""); setRegPhone(""); setRegEmail(""); setRegGender("male");
      setRegDob(""); setRegOccupation(""); setRegEmgName(""); setRegEmgPhone("");
      setRegCity("Jaipur"); setRegState("Rajasthan"); setRegPincode(""); setRegStreet("");
      setRegPass("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed. Please check inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0b 0%, #0f0d0e 40%, #110a0a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Animated particle canvas */}
      <GymParticles />

      {/* Large glowing orbs */}
      <div style={{
        position: "absolute", top: "-15%", left: "-8%",
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,25,44,0.12) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
        animation: "orbFloat1 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,10,30,0.08) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
        animation: "orbFloat2 10s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "40%", right: "15%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,60,0,0.06) 0%, transparent 65%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Diagonal power lines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 80px,
            rgba(232,25,44,0.025) 80px,
            rgba(232,25,44,0.025) 81px
          )
        `,
      }} />

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(232,25,44,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,25,44,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Brand watermark */}
      <div style={{
        position: "absolute", bottom: 28, right: 32,
        fontSize: 64, fontWeight: 900, letterSpacing: -4,
        color: "rgba(232,25,44,0.04)",
        pointerEvents: "none", zIndex: 0,
        fontFamily: "var(--font-display, 'Inter')",
        userSelect: "none",
      }}>
        ALPHALIFT
      </div>

      {/* ── MAIN CARD ── */}
      <div
        style={{
          width: "100%",
          maxWidth: isRegisterMode ? "520px" : "420px",
          background: "rgba(15,12,13,0.85)",
          border: "1px solid rgba(232,25,44,0.18)",
          borderRadius: "24px",
          padding: isRegisterMode ? "36px" : "44px",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow: `
            0 0 0 1px rgba(232,25,44,0.08),
            0 32px 80px rgba(0,0,0,0.7),
            0 0 120px rgba(232,25,44,0.06),
            inset 0 1px 0 rgba(255,255,255,0.04)
          `,
          position: "relative",
          zIndex: 10,
          animation: "cardEntrance 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          transition: "max-width 0.3s ease",
        }}
      >
        {/* Top accent bar */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%", height: 2,
          background: "linear-gradient(90deg, transparent, rgba(232,25,44,0.8), rgba(255,80,40,0.6), rgba(232,25,44,0.8), transparent)",
          borderRadius: "0 0 2px 2px",
          boxShadow: "0 0 20px rgba(232,25,44,0.5)",
        }} />

        {/* Logo area */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <div
              style={{
                width: 72, height: 72, borderRadius: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "linear-gradient(135deg, #1a0a0b, #0f0608)",
                border: "1px solid rgba(232,25,44,0.3)",
                overflow: "hidden",
                boxShadow: "0 0 40px rgba(232,25,44,0.35), 0 8px 32px rgba(0,0,0,0.5)",
                animation: "logoPulse 3s ease-in-out infinite",
              }}
            >
              <img src="/GymLogo.png" alt="AlphaLift" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
            <PowerBar />
            <div style={{
              fontFamily: "var(--font-display, 'Inter')",
              fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>
              <span style={{ color: "#e8e8e8" }}>ALPHA</span>
              <span style={{
                background: "linear-gradient(135deg, #e8192c, #ff4020)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>LIFT</span>
            </div>
            <PowerBar />
          </div>

          <div style={{
            fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)", fontWeight: 600,
          }}>
            Elite Gym Management System
          </div>
        </div>

        {/* Tab Switcher */}
        {!isRegisterMode && (
          <div style={{
            display: "flex",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, padding: 4,
            marginBottom: 28, gap: 4,
          }}>
            {(["staff", "member"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setLoginMode(mode); setError(""); setRegSuccess(""); setUsername(""); setPassword(""); }}
                style={{
                  flex: 1, padding: "9px 16px",
                  fontSize: 13, fontWeight: 600,
                  border: "none", borderRadius: 9, cursor: "pointer",
                  transition: "all 0.25s ease",
                  background: loginMode === mode
                    ? "linear-gradient(135deg, #c8101e, #e8192c)"
                    : "transparent",
                  color: loginMode === mode ? "#fff" : "rgba(255,255,255,0.35)",
                  boxShadow: loginMode === mode
                    ? "0 4px 16px rgba(232,25,44,0.35), inset 0 1px 0 rgba(255,255,255,0.1)"
                    : "none",
                  letterSpacing: "0.02em",
                }}
              >
                {mode === "staff" ? "⚡ Staff Portal" : "🏋️ Member Portal"}
              </button>
            ))}
          </div>
        )}

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{
            fontSize: 22, fontWeight: 800,
            color: "#f0f0f0",
            margin: "0 0 6px",
            letterSpacing: "-0.02em",
          }}>
            {isRegisterMode ? "Join AlphaLift" : "Welcome Back"}
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            {isRegisterMode
              ? "Submit a membership registration request"
              : `Sign in to your ${loginMode === "staff" ? "staff dashboard" : "member account"}`}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(232,25,44,0.08)",
            border: "1px solid rgba(232,25,44,0.25)",
            borderRadius: 10, padding: "12px 16px",
            marginBottom: 20, display: "flex",
            alignItems: "center", gap: 10,
            color: "#ff7080", fontSize: 13,
            animation: "errorShake 0.3s ease",
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Success */}
        {regSuccess && (
          <div style={{
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 10, padding: "12px 16px",
            marginBottom: 20, display: "flex",
            alignItems: "center", gap: 10,
            color: "#4ade80", fontSize: 13,
          }}>
            <Sparkles size={15} style={{ flexShrink: 0 }} />
            {regSuccess}
          </div>
        )}

        {isRegisterMode ? (
          /* ── REGISTRATION FORM ── */
          <form onSubmit={handleRegister} style={{ maxHeight: "58vh", overflowY: "auto", paddingRight: 4 }}>
            {[
              { label: "Identity", fields: (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>First Name *</label><input type="text" className="input-field" placeholder="e.g. Deepika" value={regFirst} onChange={(e) => setRegFirst(e.target.value)} required style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Last Name</label><input type="text" className="input-field" placeholder="e.g. Dubey" value={regLast} onChange={(e) => setRegLast(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Gender *</label><select className="input-field" value={regGender} onChange={(e) => setRegGender(e.target.value)} style={{ background: "#0f0d0e", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Date of Birth</label><input type="date" className="input-field" value={regDob} onChange={(e) => setRegDob(e.target.value)} style={{ background: "#0f0d0e", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                  <div style={{ gridColumn: "1/-1" }}><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Occupation</label><input type="text" className="input-field" placeholder="e.g. Student, Engineer" value={regOccupation} onChange={(e) => setRegOccupation(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                </div>
              )},
              { label: "Contact", fields: (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Phone * (Login ID)</label><input type="text" className="input-field" placeholder="10-digit mobile" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Email</label><input type="email" className="input-field" placeholder="name@email.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Emergency Name</label><input type="text" className="input-field" placeholder="Parent / Spouse" value={regEmgName} onChange={(e) => setRegEmgName(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Emergency Phone</label><input type="text" className="input-field" placeholder="Emergency number" value={regEmgPhone} onChange={(e) => setRegEmgPhone(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                </div>
              )},
              { label: "Address", fields: (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  <div style={{ gridColumn: "1/-1" }}><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Street / Area</label><input type="text" className="input-field" placeholder="House No., Street, Area" value={regStreet} onChange={(e) => setRegStreet(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>City</label><input type="text" className="input-field" placeholder="Jaipur" value={regCity} onChange={(e) => setRegCity(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>State</label><input type="text" className="input-field" placeholder="Rajasthan" value={regState} onChange={(e) => setRegState(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                  <div><label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Pincode</label><input type="text" className="input-field" placeholder="302001" value={regPincode} onChange={(e) => setRegPincode(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0" }} /></div>
                </div>
              )},
            ].map(({ label, fields }) => (
              <div key={label}>
                <div style={{
                  fontSize: 10, fontWeight: 700,
                  color: "#e8192c",
                  textTransform: "uppercase", letterSpacing: "0.12em",
                  marginBottom: 8, paddingBottom: 5,
                  borderBottom: "1px solid rgba(232,25,44,0.15)",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Zap size={10} />
                  {label}
                </div>
                {fields}
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#e8192c",
                textTransform: "uppercase", letterSpacing: "0.12em",
                marginBottom: 8, paddingBottom: 5,
                borderBottom: "1px solid rgba(232,25,44,0.15)",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Shield size={10} />Account Security
              </div>
              <label className="input-label" style={{ color: "rgba(255,255,255,0.5)" }}>Password *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showRegPass ? "text" : "password"}
                  className="input-field"
                  placeholder="Choose a secure password"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  required
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#f0f0f0", paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPass((p) => !p)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.3)",
                    cursor: "pointer",
                    padding: 4,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e8192c")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  {showRegPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "14px",
              background: loading ? "rgba(232,25,44,0.4)" : "linear-gradient(135deg, #c8101e, #e8192c, #ff3520)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 8px 24px rgba(232,25,44,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s ease",
              letterSpacing: "0.04em",
            }}>
              {loading ? "Submitting…" : <><Zap size={16} />Submit Registration Request</>}
            </button>
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button type="button" onClick={() => { setIsRegisterMode(false); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(255,255,255,0.35)", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e8192c")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
              >
                Already have an account? Sign In
              </button>
            </div>
          </form>
        ) : (
          /* ── LOGIN FORM ── */
          <form onSubmit={handleSubmit}>
            {/* Username / Phone */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
                {loginMode === "staff" ? <><User size={10} style={{ display: "inline", marginRight: 5 }} />Username</> : <><Phone size={10} style={{ display: "inline", marginRight: 5 }} />Phone Number</>}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="username"
                  type="text"
                  placeholder={loginMode === "staff" ? "superadmin" : "e.g. 7368736870"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: "100%", padding: "13px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 11, color: "#f0f0f0",
                    fontSize: 14, outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(232,25,44,0.5)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(232,25,44,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>
                <Lock size={10} style={{ display: "inline", marginRight: 5 }} />Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: "100%", padding: "13px 48px 13px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 11, color: "#f0f0f0",
                    fontSize: 14, outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(232,25,44,0.5)";
                    e.target.style.boxShadow = "0 0 0 3px rgba(232,25,44,0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e8192c")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "15px",
                background: loading
                  ? "rgba(232,25,44,0.35)"
                  : "linear-gradient(135deg, #b8050f 0%, #e8192c 45%, #ff4020 100%)",
                color: "#fff", border: "none", borderRadius: 13,
                fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                boxShadow: loading ? "none" : "0 8px 32px rgba(232,25,44,0.45), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
                transition: "all 0.25s ease",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(232,25,44,0.55), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(232,25,44,0.45), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)";
              }}
            >
              <Zap size={16} style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.6))" }} />
              {loading ? "Signing In…" : "Sign In"}
            </button>

            {loginMode === "member" && (
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button
                  type="button"
                  onClick={() => { setIsRegisterMode(true); setError(""); setRegSuccess(""); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 13, color: "rgba(232,25,44,0.7)", fontWeight: 600,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#e8192c")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(232,25,44,0.7)")}
                >
                  New Member? Create Registration Request →
                </button>
              </div>
            )}
          </form>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 24 }}>
          <Shield size={11} style={{ color: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>
            Protected by AlphaLift Security
          </span>
        </div>

        {/* Brand credit */}
        <div style={{
          textAlign: "center",
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", letterSpacing: "0.04em" }}>
            A product of{" "}
            <span style={{
              color: "rgba(232,25,44,0.55)",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}>
              The Dynamite Techs
            </span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cardEntrance {
          0%  { opacity: 0; transform: translateY(30px) scale(0.95); }
          60% { opacity: 1; transform: translateY(-4px) scale(1.01); }
          100%{ opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(232,25,44,0.35), 0 8px 32px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 60px rgba(232,25,44,0.55), 0 8px 32px rgba(0,0,0,0.5); }
        }
        @keyframes powerPulse {
          0%   { transform: scaleY(0.6); opacity: 0.5; }
          100% { transform: scaleY(1.1); opacity: 1; }
        }
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, 20px) scale(1.05); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-25px, -15px) scale(1.04); }
        }
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        input::placeholder { color: rgba(255,255,255,0.2) !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.4); }
      `}</style>
    </div>
  );
}
