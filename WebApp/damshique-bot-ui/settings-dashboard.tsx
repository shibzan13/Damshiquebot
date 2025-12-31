import React, { useState } from "react";
import { Settings, User, Bell, Lock, Palette, Globe, Database, Mail, Smartphone, Shield, Key, CreditCard, Save } from "lucide-react";

export default function SettingsDashboard() {
  const [selectedTab, setSelectedTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: <Settings size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "security", label: "Security", icon: <Lock size={18} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={18} /> },
    { id: "integrations", label: "Integrations", icon: <Globe size={18} /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Settings</h1>
          <p style={{ fontSize: 15, color: "#64748b" }}>Manage your account and application preferences</p>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: 24 }}>
          {/* Sidebar */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 16, height: "fit-content" }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setSelectedTab(tab.id)} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "none", background: selectedTab === tab.id ? "#eff6ff" : "transparent", color: selectedTab === tab.id ? "#3b82f6" : "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 8, transition: "all 0.2s" }}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 32 }}>
            {selectedTab === "general" && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>General Settings</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>Company Name</label>
                    <input type="text" defaultValue="Damshique Inc." style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>Company Email</label>
                    <input type="email" defaultValue="contact@damshique.com" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>Timezone</label>
                    <select style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none", cursor: "pointer" }}>
                      <option>UTC-08:00 Pacific Time</option>
                      <option>UTC-05:00 Eastern Time</option>
                      <option>UTC+00:00 GMT</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>Language</label>
                    <select style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none", cursor: "pointer" }}>
                      <option>English (US)</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <button style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </>
            )}

            {selectedTab === "profile" && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Profile Settings</h2>
                <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
                  <div style={{ width: 100, height: 100, borderRadius: 20, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700 }}>SC</div>
                  <div style={{ flex: 1 }}>
                    <button style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#3b82f6", fontSize: 14, fontWeight: 600, cursor: "pointer", marginRight: 12 }}>Upload Photo</button>
                    <button style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#ef4444", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>First Name</label>
                      <input type="text" defaultValue="Sarah" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>Last Name</label>
                      <input type="text" defaultValue="Chen" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>Email</label>
                    <input type="email" defaultValue="sarah.chen@damshique.com" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>Phone</label>
                    <input type="tel" defaultValue="+1 (555) 123-4567" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 8 }}>Bio</label>
                    <textarea rows={4} defaultValue="Senior Software Engineer with 5+ years of experience..." style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none", resize: "vertical" }} />
                  </div>
                  <button style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </>
            )}

            {selectedTab === "notifications" && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Notification Preferences</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    { title: "Email Notifications", desc: "Receive email updates about your activity" },
                    { title: "Push Notifications", desc: "Receive push notifications on your devices" },
                    { title: "Invoice Alerts", desc: "Get notified when invoices are due or overdue" },
                    { title: "Employee Updates", desc: "Notifications about employee changes" },
                    { title: "Merchant Activities", desc: "Updates about merchant actions" },
                    { title: "System Alerts", desc: "Important system and security notifications" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 20, background: "#f8fafc", borderRadius: 12 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{item.desc}</div>
                      </div>
                      <label style={{ position: "relative", display: "inline-block", width: 48, height: 24, cursor: "pointer" }}>
                        <input type="checkbox" defaultChecked={i < 4} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, background: i < 4 ? "#3b82f6" : "#cbd5e1", borderRadius: 24, transition: "0.3s" }} />
                        <span style={{ position: "absolute", height: 18, width: 18, left: i < 4 ? 26 : 3, bottom: 3, background: "#fff", borderRadius: "50%", transition: "0.3s" }} />
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedTab === "security" && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Security Settings</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <Key size={20} color="#3b82f6" />
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Change Password</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <input type="password" placeholder="Current Password" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                      <input type="password" placeholder="New Password" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                      <input type="password" placeholder="Confirm New Password" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                      <button style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#3b82f6", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>Update Password</button>
                    </div>
                  </div>

                  <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                          <Shield size={20} color="#10b981" />
                          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Two-Factor Authentication</h3>
                        </div>
                        <p style={{ fontSize: 13, color: "#64748b" }}>Add an extra layer of security to your account</p>
                      </div>
                      <button style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#10b981", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Enable</button>
                    </div>
                  </div>

                  <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Active Sessions</h3>
                    {[
                      { device: "MacBook Pro", location: "San Francisco, CA", time: "Current session" },
                      { device: "iPhone 14", location: "San Francisco, CA", time: "2 hours ago" },
                    ].map((session, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#fff", borderRadius: 8, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{session.device}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{session.location} • {session.time}</div>
                        </div>
                        {i > 0 && <button style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#fee2e2", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Revoke</button>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedTab === "appearance" && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Appearance Settings</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 12 }}>Theme</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                      {["Light", "Dark", "Auto"].map(theme => (
                        <div key={theme} style={{ padding: 20, borderRadius: 12, border: theme === "Light" ? "2px solid #3b82f6" : "1px solid #e2e8f0", background: theme === "Dark" ? "#0f172a" : "#fff", cursor: "pointer", textAlign: "center" }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: theme === "Dark" ? "#fff" : "#0f172a" }}>{theme}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 12 }}>Accent Color</label>
                    <div style={{ display: "flex", gap: 12 }}>
                      {["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"].map(color => (
                        <div key={color} style={{ width: 48, height: 48, borderRadius: 12, background: color, cursor: "pointer", border: color === "#3b82f6" ? "3px solid #0f172a" : "none" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedTab === "integrations" && (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Integrations</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                  {[
                    { name: "Slack", desc: "Team communication", connected: true, icon: "💬" },
                    { name: "Google Drive", desc: "File storage", connected: true, icon: "📁" },
                    { name: "Stripe", desc: "Payment processing", connected: false, icon: "💳" },
                    { name: "Zapier", desc: "Workflow automation", connected: false, icon: "⚡" },
                  ].map((int, i) => (
                    <div key={i} style={{ padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: 32, marginBottom: 12 }}>{int.icon}</div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{int.name}</h3>
                      <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{int.desc}</p>
                      <button style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: int.connected ? "#dcfce7" : "#3b82f6", color: int.connected ? "#166534" : "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                        {int.connected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}