import React, { useState } from "react";
import { Settings, Shield, Bell, Lock, Globe, HardDrive, Database, Key, HelpCircle, Save, Smartphone, Bot, Zap, Clock } from "lucide-react";

export default function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState("General Settings");

  const sections = [
    { title: "General Settings", icon: <Globe size={18} />, desc: "Company profile and localization" },
    { title: "AI Assistant", icon: <Bot size={18} />, desc: "Tune AI behavior and confidence" },
    { title: "Security & API", icon: <Shield size={18} />, desc: "Master tokens and access rules" },
    { title: "Notifications", icon: <Bell size={18} />, desc: "Bot alerting and frequency" },
    { title: "Storage", icon: <HardDrive size={18} />, desc: "S3 connection and indexing" }
  ];

  const renderSectionContent = () => {
    switch (activeTab) {
      case "General Settings":
        return (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>General Configurations</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Organization Name</label>
                <input type="text" defaultValue="Damshique Intelligence" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Primary Currency</label>
                  <select style={inputStyle}>
                    <option>AED (Dirham)</option>
                    <option>USD (Dollar)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Timezone</label>
                  <select style={inputStyle}>
                    <option>(GMT+04:00) Dubai</option>
                    <option>(GMT+00:00) London</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        );
      case "AI Assistant":
        return (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>AI Logic Tuning</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 12 }}>
                  <span>Extraction Confidence Threshold</span>
                  <span style={{ color: "#3b82f6" }}>85%</span>
                </label>
                <input type="range" style={{ width: "100%", height: 6, borderRadius: 3, background: "#e2e8f0", cursor: "pointer" }} />
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Invoices below this score will trigger manual review (Ai Queue).</p>
              </div>
              <div style={{ padding: 20, background: "#f0f9ff", borderRadius: 16, border: "1px solid #e0f2fe" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#0369a1", marginBottom: 8 }}>
                  <Zap size={18} />
                  <span style={{ fontWeight: 800 }}>Premium Mode Enabled</span>
                </div>
                <p style={{ fontSize: 13, color: "#0c4a6e", fontWeight: 500 }}>Currently using Gemini 1.5 Flash for high-speed extraction and Document AI for structured OCR.</p>
              </div>
            </div>
          </>
        );
      case "Security & API":
        return (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>API Keys & Master Access</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Admin Master Token</label>
                <div style={{ position: "relative" }}>
                  <input type="password" value="00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7" readOnly style={{ ...inputStyle, paddingRight: 100 }} />
                  <button style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", padding: "6px 12px", borderRadius: 8, background: "#f1f5f9", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Copy</button>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8 }}>WhatsApp Webhook URL</label>
                <input type="text" value="https://api.damshique.ai/webhook" readOnly style={inputStyle} />
              </div>
            </div>
          </>
        );
      default:
        return <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Section coming soon...</div>;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 32px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Control Center</h1>
          <p style={{ fontSize: 16, color: "#64748b", fontWeight: 500 }}>System-wide configurations for AI extraction and user permissions.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 32 }}>
          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sections.map(s => (
              <button
                key={s.title}
                onClick={() => setActiveTab(s.title)}
                style={{
                  textAlign: "left",
                  padding: "20px 24px",
                  borderRadius: 20,
                  background: activeTab === s.title ? "white" : "transparent",
                  border: `2px solid ${activeTab === s.title ? "#3b82f6" : "transparent"}`,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: activeTab === s.title ? "0 10px 30px rgba(59,130,246,0.1)" : "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
                  <div style={{ color: activeTab === s.title ? "#3b82f6" : "#94a3b8" }}>{s.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: activeTab === s.title ? "#0f172a" : "#64748b" }}>{s.title}</div>
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, marginLeft: 32 }}>{s.desc}</div>
              </button>
            ))}
          </div>

          {/* Right Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "white", borderRadius: 32, border: "1px solid #e2e8f0", padding: 40, boxShadow: "0 4px 12px rgba(15,23,42,0.02)" }}>
              {renderSectionContent()}

              <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 16 }}>
                <button style={{ padding: "14px 28px", borderRadius: 12, background: "transparent", border: "1px solid #e2e8f0", color: "#64748b", fontWeight: 700, cursor: "pointer" }}>Discard</button>
                <button style={{ padding: "14px 28px", borderRadius: 12, background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 10px 25px rgba(59,130,246,0.2)" }}>
                  <Save size={18} /> Save Settings
                </button>
              </div>
            </div>

            <div style={{ background: "#fef2f2", padding: 24, borderRadius: 24, border: "1px solid #fee2e2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#991b1b" }}>Danger Zone</div>
                <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 500, marginTop: 2 }}>Permanent system reset or database purge.</div>
              </div>
              <button style={{ padding: "10px 20px", borderRadius: 12, background: "white", border: "1.5px solid #fecaca", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reset System</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: 14,
  border: "1.5px solid #f1f5f9",
  background: "#f8fafc",
  fontSize: 15,
  fontWeight: 500,
  color: "#0f172a",
  outline: "none",
  transition: "all 0.2s",
  ":focus": { borderColor: "#3b82f6" }
} as any;