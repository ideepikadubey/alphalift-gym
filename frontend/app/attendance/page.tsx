"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Badge, { getBadgeVariant } from "@/components/ui/Badge";
import { attendanceAPI, membersAPI } from "@/lib/api";
import { 
  UserCheck, UserX, Calendar, Clock, Search, LogIn, LogOut, RefreshCw, 
  Scan, QrCode, CheckCircle2, ShieldAlert, Camera
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

// Helper component to render a deterministic mock QR code
const MockQRCode = ({ value }: { value: string }) => {
  const size = 14;
  const grid: boolean[][] = [];
  const hash = value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 0; i < size; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < size; j++) {
      const isCorner = 
        (i < 4 && j < 4) || 
        (i < 4 && j >= size - 4) || 
        (i >= size - 4 && j < 4);
      
      const isBorder = 
        (i === 0 || i === 3 || (i < 4 && (j === 0 || j === 3))) ||
        (i === 0 || i === 3 || (i < 4 && (j === size - 1 || j === size - 4))) ||
        (i === size - 1 || i === size - 4 || (i >= size - 4 && (j === 0 || j === 3)));

      if (isCorner) {
        row.push(isBorder);
      } else {
        row.push(((i * 7 + j * 13 + hash) % 3 === 0) || ((i * j + hash) % 4 === 1));
      }
    }
    grid.push(row);
  }

  return (
    <div style={{
      background: "white",
      padding: "16px",
      borderRadius: "12px",
      display: "inline-block",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      border: "1px solid var(--border)"
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size}, 10px)`,
        gridTemplateRows: `repeat(${size}, 10px)`,
        gap: "2px"
      }}>
        {grid.map((row, i) => 
          row.map((cell, j) => (
            <div 
              key={`${i}-${j}`} 
              style={{
                width: "10px",
                height: "10px",
                background: cell ? "#111" : "#fff",
                borderRadius: cell ? "2px" : "0"
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Camera QR Scanner Component ──────────────────────────────────────────────
interface CameraScannerProps {
  onScan: (scannedText: string) => void;
  active: boolean;
}

function CameraScanner({ onScan, active }: CameraScannerProps) {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "html5-qr-reader";

  useEffect(() => {
    if (!active) {
      stopScanner();
      return;
    }

    const startScanner = async () => {
      try {
        setErrorMsg("");
        
        // Request permissions first
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setHasCamera(false);
          setErrorMsg("No camera devices found.");
          return;
        }
        
        setHasCamera(true);
        const html5Qrcode = new Html5Qrcode(scannerId);
        scannerRef.current = html5Qrcode;

        // Use environment-facing camera on mobile by default
        const cameraConfig = { facingMode: "environment" };

        await html5Qrcode.start(
          cameraConfig,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Success callback
            onScan(decodedText);
          },
          () => {
            // Silent error callback for frame misses
          }
        );
      } catch (err: any) {
        console.warn("Camera access error:", err);
        setErrorMsg(err?.message || "Failed to access camera. Please allow permission.");
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [active, onScan]);

  const stopScanner = () => {
    const container = document.getElementById(scannerId);
    if (container) {
      container.removeChild = (child: any) => {
        return child;
      };
    }
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current = null;
      }).catch(err => {
        console.warn("Failed to stop scanner cleanly", err);
      });
    } else {
      scannerRef.current = null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", width: "100%" }}>
      {errorMsg && (
        <div style={{ background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#ff6b79", width: "100%" }}>
          {errorMsg}
        </div>
      )}
      
      <div 
        id={scannerId} 
        style={{ 
          width: "100%", 
          maxWidth: "400px", 
          borderRadius: "12px", 
          overflow: "hidden", 
          border: "1px solid var(--border)",
          background: "#000",
          aspectRatio: "4/3",
          position: "relative"
        }}
      >
        {hasCamera === null && !errorMsg && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--silver-500)" }}>
            <Camera size={24} style={{ animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: "13px" }}>Initializing camera...</span>
          </div>
        )}
      </div>
      <p style={{ fontSize: "11px", color: "var(--silver-600)", textAlign: "center" }}>
        Hold a member's check-in QR code in front of the camera to check them in/out.
      </p>
    </div>
  );
}

// ─── Attendance Page ──────────────────────────────────────────────────────────
export default function AttendancePage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [todayData, setTodayData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [phone, setPhone] = useState("");
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState("");
  const [checkInSuccess, setCheckInSuccess] = useState("");
  const [stats, setStats] = useState<any>(null);

  // QR check-in state
  const [qrTab, setQrTab] = useState<"camera" | "simulation">("camera");
  const [autoRegister, setAutoRegister] = useState(false);
  const [scanPhone, setScanPhone] = useState("");
  const [simulatedMemberId, setSimulatedMemberId] = useState("");
  const [membersList, setMembersList] = useState<any[]>([]);
  const [qrSuccess, setQrSuccess] = useState("");
  const [qrError, setQrError] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let dataRes;
      if (selectedDate === todayStr) {
        dataRes = await attendanceAPI.getToday();
      } else {
        const start = new Date(selectedDate + 'T00:00:00');
        const end = new Date(selectedDate + 'T23:59:59.999');
        dataRes = await attendanceAPI.getAll({
          startDate: start.toISOString(),
          endDate: end.toISOString()
        });
      }
      const statsRes = await attendanceAPI.getStats();
      setTodayData(dataRes.data.data || []);
      setStats(statsRes.data.data);
    } catch { setTodayData([]); }
    finally { setLoading(false); }
  }, [selectedDate, todayStr]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await membersAPI.getAll({ limit: 100 });
      const list = res.data.data || [];
      setMembersList(list);
      if (list.length > 0) {
        setSimulatedMemberId(list[0]._id);
      }
    } catch (err) {
      console.error("Failed to load members list for QR simulations", err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showQRScanner) {
      fetchMembers();
    }
  }, [showQRScanner, fetchMembers]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault(); setCheckInError(""); setCheckInSuccess(""); setCheckInLoading(true);
    try {
      const memberRes = await membersAPI.search(phone);
      const found = (memberRes.data.data || [])[0];
      if (!found) { setCheckInError("Member not found with this phone number."); return; }
      await attendanceAPI.checkIn({ memberId: found._id });
      setCheckInSuccess(`✓ ${found.firstName} ${found.lastName} checked in successfully!`);
      setPhone("");
      load();
    } catch (err: any) {
      setCheckInError(err?.response?.data?.message || "Check-in failed");
    } finally { setCheckInLoading(false); }
  };

  const handleQRScan = async (params: { memberId?: string; phone?: string }) => {
    setQrError("");
    setQrSuccess("");
    setQrLoading(true);
    try {
      const res = await attendanceAPI.qrScan({
        ...params,
        autoRegister
      });

      if (res.data.success) {
        setQrSuccess(res.data.message);
        if (params.phone) setScanPhone("");
        load();
      }
    } catch (err: any) {
      setQrError(err?.response?.data?.message || "QR Action failed");
    } finally {
      setQrLoading(false);
    }
  };

  // Callback from Live camera scanner
  const handleLiveCameraScan = (scannedText: string) => {
    if (qrLoading) return;
    
    // Check if decoded text is a phone number (10 digits) or mongoose ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(scannedText);
    const isPhone = /^[0-9]{10}$/.test(scannedText);
    
    if (isObjectId) {
      handleQRScan({ memberId: scannedText });
    } else if (isPhone) {
      handleQRScan({ phone: scannedText });
    } else {
      setQrError(`Scanned code is invalid: "${scannedText}"`);
    }
  };

  const handleCheckOut = async (attendanceId: string, memberName: string) => {
    try {
      await attendanceAPI.checkOut({ attendanceId });
      load();
    } catch { alert("Checkout failed"); }
  };

  const selectedMember = membersList.find(m => m._id === simulatedMemberId);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Attendance</h1>
            <p className="page-subtitle">
              {selectedDate === todayStr ? "Today — " : ""}{new Date(selectedDate + 'T00:00:00').toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Date Selector Option */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px 12px" }}>
              <Calendar size={14} style={{ color: "var(--silver-400)" }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--silver-100)",
                  fontSize: "12px",
                  fontWeight: 600,
                  outline: "none",
                  cursor: "pointer"
                }}
              />
            </div>

            <button className="btn-secondary" onClick={load}><RefreshCw size={15} /> Refresh</button>
            <button className="btn-primary" style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "none" }} onClick={() => setShowQRScanner(true)}>
              <Scan size={15} /> QR Code Scanner
            </button>
            <button className="btn-primary" onClick={() => setShowCheckIn(true)}>
              <LogIn size={16} /> Check In
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: "16px", marginBottom: "24px" }}>
          {[
            { label: selectedDate === todayStr ? "Today's Check-ins" : "Day's Check-ins", value: todayData.length, icon: <UserCheck size={20} />, color: "var(--green-400)", bg: "rgba(34,197,94,0.1)" },
            { label: "Still Present", value: todayData.filter((a) => !a.checkOut?.time).length, icon: <Clock size={20} />, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
            { label: "Checked Out", value: todayData.filter((a) => a.checkOut?.time).length, icon: <UserX size={20} />, color: "var(--silver-500)", bg: "var(--bg-elevated)" },
            { label: "Avg Duration", value: stats?.avgDuration ? `${stats.avgDuration} min` : "—", icon: <Calendar size={20} />, color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ width: 40, height: 40, background: s.bg, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                  {s.icon}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, color: "var(--silver-100)", marginBottom: "4px" }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Today's attendance table */}
        <div className="chart-container" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
            <div className="chart-title">{selectedDate === todayStr ? "Today's Check-ins" : `Check-ins for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}</div>
          </div>
          {loading ? (
            <LoadingSpinner fullPage size={28} text="Loading attendance…" />
          ) : todayData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--silver-500)" }}>
              <UserCheck size={40} style={{ opacity: 0.3, marginBottom: "12px" }} />
              <p>No check-ins yet today</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {todayData.map((a: any) => {
                  const checkedOut = !!a.checkOut?.time;
                  const duration = checkedOut && a.checkIn?.time
                    ? Math.round((new Date(a.checkOut.time).getTime() - new Date(a.checkIn.time).getTime()) / 60000)
                    : null;
                  return (
                    <tr key={a._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                            {a.member?.firstName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{a.member?.firstName} {a.member?.lastName}</div>
                            <div style={{ fontSize: "11px", color: "var(--silver-500)" }}>{a.member?.contact?.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--green-400)", fontWeight: 600 }}>
                        {a.checkIn?.time ? new Date(a.checkIn.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td style={{ color: checkedOut ? "var(--silver-400)" : "var(--silver-700)" }}>
                        {checkedOut ? new Date(a.checkOut.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                      <td style={{ color: "var(--silver-400)" }}>
                        {duration ? `${duration} min` : "—"}
                      </td>
                      <td>
                        <Badge variant={checkedOut ? "cancelled" : "active"} dot>
                          {checkedOut ? "Checked Out" : "Present"}
                        </Badge>
                      </td>
                      <td>
                        {!checkedOut && (
                          <button
                            className="btn-ghost"
                            style={{ fontSize: "12px", color: "#fbbf24" }}
                            onClick={() => handleCheckOut(a._id, `${a.member?.firstName} ${a.member?.lastName}`)}
                          >
                            <LogOut size={13} /> Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Check-in modal */}
      <Modal isOpen={showCheckIn} onClose={() => { setShowCheckIn(false); setPhone(""); setCheckInError(""); setCheckInSuccess(""); }} title="Member Check-In" subtitle="Enter member phone number to check in">
        <form onSubmit={handleCheckIn}>
          {checkInError && <div style={{ background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#ff6b79" }}>{checkInError}</div>}
          {checkInSuccess && <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#22c55e" }}>{checkInSuccess}</div>}
          <label className="input-label">Phone Number</label>
          <input className="input-field" type="tel" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ marginBottom: "20px" }} autoFocus />
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" className="btn-secondary" onClick={() => setShowCheckIn(false)}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: "center" }} disabled={checkInLoading}>
              {checkInLoading ? "Checking In…" : <><LogIn size={15} /> Check In</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR code scanner modal */}
      <Modal 
        isOpen={showQRScanner} 
        onClose={() => { 
          setShowQRScanner(false); 
          setQrError(""); 
          setQrSuccess(""); 
          setScanPhone(""); 
        }} 
        title="QR Attendance Terminal" 
        subtitle="Simulate or perform QR-based member checks"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Tab switcher inside scanner modal */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.02)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <button 
              type="button" 
              className={`tab-btn ${qrTab === "camera" ? "active" : ""}`} 
              style={{ flex: 1, padding: "8px", fontSize: "12px", background: qrTab === "camera" ? "var(--red-500)" : "transparent", color: qrTab === "camera" ? "white" : "var(--silver-400)", border: "none", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => { setQrTab("camera"); setQrError(""); setQrSuccess(""); }}
            >
              Live Camera Scanner
            </button>
            <button 
              type="button" 
              className={`tab-btn ${qrTab === "simulation" ? "active" : ""}`} 
              style={{ flex: 1, padding: "8px", fontSize: "12px", background: qrTab === "simulation" ? "var(--red-500)" : "transparent", color: qrTab === "simulation" ? "white" : "var(--silver-400)", border: "none", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => { setQrTab("simulation"); setQrError(""); setQrSuccess(""); }}
            >
              Simulation Console
            </button>
          </div>

          {/* Status logs */}
          {qrError && (
            <div style={{ 
              background: "rgba(232,25,44,0.1)", 
              border: "1px solid rgba(232,25,44,0.3)", 
              borderRadius: "10px", 
              padding: "12px 16px", 
              fontSize: "13px", 
              color: "#ff6b79",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              {qrError}
            </div>
          )}
          {qrSuccess && (
            <div style={{ 
              background: "rgba(34,197,94,0.1)", 
              border: "1px solid rgba(34,197,94,0.3)", 
              borderRadius: "10px", 
              padding: "12px 16px", 
              fontSize: "13px", 
              color: "#22c55e",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              {qrSuccess}
            </div>
          )}

          {/* TAB 1: Live Camera Scanner */}
          {qrTab === "camera" && (
            <CameraScanner onScan={handleLiveCameraScan} active={showQRScanner} />
          )}

          {/* TAB 2: Simulation Console */}
          {qrTab === "simulation" && (
            <>
              {/* QR Scan display and animations */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "#0e0e0e", border: "1px dashed var(--border)", borderRadius: "16px", padding: "30px", position: "relative", overflow: "hidden" }}>
                {/* Pulsing scanning red line */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "2px",
                  background: "linear-gradient(90deg, transparent, #e8192c, transparent)",
                  boxShadow: "0 0 10px #e8192c",
                  animation: "scanLine 2.5s ease-in-out infinite",
                  pointerEvents: "none"
                }} />
                
                {/* Draw QR layout */}
                {selectedMember ? (
                  <MockQRCode value={selectedMember.contact?.phone || selectedMember._id} />
                ) : (
                  <div style={{ padding: "40px 0", color: "var(--silver-600)", textAlign: "center" }}>
                    <QrCode size={48} style={{ opacity: 0.3, marginBottom: "8px" }} />
                    <p style={{ fontSize: "12px" }}>No members registered yet to display QR code.</p>
                  </div>
                )}
              </div>

              {/* Simulation console options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h4 style={{ fontSize: "12px", color: "var(--silver-500)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Scan Simulation Console</h4>
                
                <div style={{ display: "flex", gap: "8px" }}>
                  <select 
                    className="input-field" 
                    value={simulatedMemberId} 
                    onChange={(e) => setSimulatedMemberId(e.target.value)}
                    style={{ flex: 1, padding: "8px 12px" }}
                  >
                    {membersList.map((m) => (
                      <option key={m._id} value={m._id} style={{ background: "var(--bg-elevated)", color: "var(--silver-200)" }}>
                        {m.firstName} {m.lastName} ({m.contact?.phone})
                      </option>
                    ))}
                  </select>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleQRScan({ phone: selectedMember?.contact?.phone })}
                    disabled={qrLoading || !simulatedMemberId}
                    style={{ padding: "8px 16px", whiteSpace: "nowrap" }}
                  >
                    Simulate QR Scan
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "8px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ fontSize: "11px", color: "var(--silver-600)" }}>OR MANUAL ENTRY</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    className="input-field" 
                    type="tel" 
                    placeholder="Enter phone to check-in/register" 
                    value={scanPhone} 
                    onChange={(e) => setScanPhone(e.target.value)}
                    style={{ flex: 1, padding: "8px 12px" }}
                  />
                  <button 
                    className="btn-secondary" 
                    onClick={() => handleQRScan({ phone: scanPhone })}
                    disabled={qrLoading || !scanPhone}
                    style={{ padding: "8px 16px" }}
                  >
                    {autoRegister ? "Register & Scan" : "Scan Phone"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Configuration */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <input 
              id="auto-register-checkbox" 
              type="checkbox" 
              checked={autoRegister} 
              onChange={(e) => setAutoRegister(e.target.checked)} 
              style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "#e8192c" }} 
            />
            <label htmlFor="auto-register-checkbox" style={{ fontSize: "13px", fontWeight: 600, color: "var(--silver-200)", cursor: "pointer" }}>
              Enable Auto-Registration
            </label>
          </div>
          {autoRegister && (
            <p style={{ fontSize: "11px", color: "var(--silver-500)", fontStyle: "italic", marginTop: "-10px" }}>
              * Auto-registration will instantly profile new members and grant a 1-month trial plan.
            </p>
          )}
        </div>

        <style>{`
          @keyframes scanLine {
            0% { top: 0%; opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}</style>
      </Modal>
    </DashboardLayout>
  );
}
