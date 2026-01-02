import React, { useEffect, useState } from "react";
import { Users, Store, BarChart3, Bot, Search, Menu, X, FileText, Bell, Settings, Clock, Shield, Activity, CheckSquare, History, MessageSquare, TrendingUp, LogOut } from "lucide-react";
import InvoicesDashboard from "./components/invoices-dashboard";
import EmployeesDashboard from "./components/employees-dashboard";
import MerchantsDashboard from "./components/merchants-dashboard";
import ReportsDashboard from "./components/reports-dashboard";
import BotActivityDashboard from "./components/bot-activity-dashboard";
import AiReviewQueue from "./components/ai-review-queue";
import UsersRolesDashboard from "./components/users-roles-dashboard";
import AuditLogsDashboard from "./components/audit-logs-dashboard";
import AdminChat from "./components/admin-chat";
import SettingsDashboard from "./components/settings-dashboard";
import NotificationsDashboard from "./components/notifications-dashboard";
import AnalyticsDashboard from "./components/analytics-dashboard";

export default function DamshiqueHome() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: string, id: number } | null>(null);
  const [activeSection, setActiveSection] = useState("Home");
  const [stats, setStats] = useState({ employees: 0, merchants: 0, invoices: 0, reports: 0, botActivity: 0, aiQueue: 0, users: 0, audits: 0 });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        headers: {
          'X-API-Token': '00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Stats API failed:", response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      if (data && !data.error) {
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      showToast("Backend connection error. Check database.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setReady(true);
    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (message: string, type = "success") => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMenuClick = (label: string) => {
    setActiveSection(label);
    if (label !== "AI Finance Chat") setLastSearchQuery(""); // Reset search query when switching sections manually
    showToast(`Navigated to ${label}`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    window.location.href = "/login";
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // Use a timestamp to force AdminChat useEffect to trigger even if text is same
    setLastSearchQuery(searchQuery + "||" + Date.now());
    setChatOpen(true);
    setSearchQuery("");
    showToast(`Searching for: ${searchQuery}`, "success");
  };

  if (!ready) return null;

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 60, height: 60, border: "4px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Initializing System...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const menuItems = [
    { icon: <Search size={20} />, label: "Home", color: "#3b82f6", stat: "Main" },
    { icon: <TrendingUp size={20} />, label: "Analytics", color: "#10b981", stat: "AI" },
    { icon: <FileText size={20} />, label: "Invoices", color: "#06b6d4", stat: stats.invoices },
    { icon: <Shield size={20} />, label: "Users & Approval", color: "#8b5cf6", stat: stats.aiQueue },
    { icon: <Users size={20} />, label: "Employees", color: "#3b82f6", stat: stats.employees },
    { icon: <Store size={20} />, label: "Merchants", color: "#f59e0b", stat: stats.merchants },
    { icon: <BarChart3 size={20} />, label: "Reports", color: "#10b981", stat: stats.reports },
    { icon: <Activity size={20} />, label: "Bot Activity", color: "#f59e0b", stat: stats.botActivity },
    { icon: <History size={20} />, label: "Audit Logs", color: "#6366f1", stat: stats.audits },
    { icon: <Settings size={20} />, label: "Settings", color: "#64748b", stat: "—" },
  ];

  const renderHome = () => {
    return (
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center", padding: "60px 32px" }}>
        <div style={{ width: 140, height: 140, margin: "0 auto 36px" }}>
          <img src="/logo.png" alt="Damshique" style={{ width: "100%", height: "100%", borderRadius: 32, boxShadow: "0 25px 60px rgba(59,130,246,0.2)" }} />
        </div>

        <h1 style={{ fontSize: 52, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Damshique Admin Intelligence</h1>
        <p style={{ fontSize: 18, color: "#64748b", fontWeight: 500, marginBottom: 48 }}>The central hub for all WhatsApp invoice operations & AI analytics.</p>

        {/* Search Bar */}
        <div style={{ maxWidth: 700, margin: "0 auto 64px", position: "relative" }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              border: `2px solid ${searchFocused ? "#3b82f6" : "#e2e8f0"}`,
              borderRadius: 24,
              padding: "0 28px",
              height: 72,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: searchFocused ? "0 20px 60px rgba(59,130,246,0.12)" : "0 4px 12px rgba(15,23,42,0.04)",
              transform: searchFocused ? "scale(1.02)" : "scale(1)"
            }}>
              <Search size={22} color={searchFocused ? "#3b82f6" : "#64748b"} />
              <input
                placeholder="Ask about spending, search invoices, or track patterns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                style={{ flex: 1, marginLeft: 20, height: "100%", border: "none", outline: "none", fontSize: 18, color: "#0f172a", background: "transparent", fontWeight: 500 }}
              />
              <button type="submit" style={{ padding: "8px 20px", borderRadius: 12, background: searchQuery.trim() ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#f1f5f9", color: searchQuery.trim() ? "white" : "#94a3b8", border: "none", fontWeight: 700, cursor: "pointer", transition: "all 0.3s" }}>Ask AI</button>
            </div>
          </form>
          {searchFocused && !searchQuery && (
            <div style={{ position: "absolute", top: "calc(100% + 12px)", left: 0, right: 0, background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", padding: 20, textAlign: "left", zIndex: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 12, paddingLeft: 8 }}>SUGGESTIONS</div>
              {["Show me Amazon invoices", "Total spend this month", "Any anomalous vendors?", "Who has the highest spending?"].map((s, i) => (
                <div key={i} onClick={() => { setSearchQuery(s); }} style={{ padding: "12px 16px", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "background 0.2s" }} onMouseEnter={(e: any) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}>
                  <Clock size={16} color="#94a3b8" />
                  <span style={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          <DashboardCard icon={<TrendingUp size={28} />} label="Analytics" color="#10b981" desc="Spending trends & insights" onClick={() => setActiveSection("Analytics")} />
          <DashboardCard icon={<FileText size={28} />} label="Invoices" color="#06b6d4" desc={`${stats.invoices} processed invoices`} onClick={() => setActiveSection("Invoices")} />
          <DashboardCard icon={<Users size={28} />} label="Employees" color="#3b82f6" desc={`${stats.employees} active team members`} onClick={() => setActiveSection("Employees")} />
          <DashboardCard icon={<Store size={28} />} label="Merchants" color="#f59e0b" desc={`${stats.merchants} registered vendors`} onClick={() => setActiveSection("Merchants")} />
          <DashboardCard icon={<Shield size={28} />} label="Users & Approval" color="#3b82f6" desc={`${stats.aiQueue} pending approvals`} onClick={() => setActiveSection("Users & Approval")} />
          <DashboardCard icon={<BarChart3 size={28} />} label="Reports" color="#10b981" desc="Generate financial reports" onClick={() => setActiveSection("Reports")} />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "Invoices": return <InvoicesDashboard />;
      case "Analytics": return <AnalyticsDashboard />;
      case "Employees": return <EmployeesDashboard />;
      case "Merchants": return <MerchantsDashboard />;
      case "Reports": return <ReportsDashboard />;
      case "Bot Activity": return <BotActivityDashboard />;
      case "Users & Approval": return <UsersRolesDashboard />;
      case "Audit Logs": return <AuditLogsDashboard />;
      case "Settings": return <SettingsDashboard />;
      case "Notifications": return <NotificationsDashboard />;
      default: return renderHome();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#ffffff", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* HEADER */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "#ffffff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Menu size={22} color="#0f172a" />
          </button>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{activeSection}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", background: "#f0f9ff", borderRadius: 12, border: "1px solid #e0f2fe" }}>
            <Bot size={18} color="#0369a1" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0369a1" }}>AI System Online</span>
          </div>
          <Bell size={22} color="#64748b" style={{ cursor: "pointer" }} onClick={() => setActiveSection("Notifications")} />
          <Settings size={22} color="#64748b" style={{ cursor: "pointer" }} onClick={() => setActiveSection("Settings")} />
          <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 4px" }} />
          <LogOut size={22} color="#f43f5e" style={{ cursor: "pointer" }} onClick={handleLogout} />
        </div>
      </div>

      {/* SIDEBAR */}
      <div style={{ position: "fixed", top: 0, left: sidebarOpen ? 0 : -340, width: 320, height: "100%", background: "#ffffff", borderRight: "1px solid #e2e8f0", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)", zIndex: 200, padding: 32, boxShadow: sidebarOpen ? "0 0 120px rgba(0,0,0,0.12)" : "none", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.png" style={{ width: 40, height: 40, borderRadius: 10 }} />
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Damshique</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={24} color="#0f172a" />
          </button>
        </div>
        {menuItems.map((item, i) => (
          <div key={i} onClick={() => { handleMenuClick(item.label); setSidebarOpen(false); }} style={{ padding: "18px 24px", marginBottom: 12, borderRadius: 20, background: activeSection === item.label ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "#ffffff", border: `1px solid ${activeSection === item.label ? "transparent" : "#f1f5f9"}`, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.3s ease", color: activeSection === item.label ? "#ffffff" : "#475569" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ color: activeSection === item.label ? "#ffffff" : "#3b82f6" }}>{item.icon}</div>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{item.label}</span>
            </div>
            {item.stat !== "—" && <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{item.stat}</span>}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, bottom: 0, overflowY: "auto", background: "#f8fafc" }}>
        {renderContent()}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Global Persistent Chat Assistant */}
      <AdminChat isOpen={chatOpen} setIsOpen={setChatOpen} initialQuery={lastSearchQuery} showButton={activeSection !== "Home"} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes toastSlide { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

function DashboardCard({ icon, label, color, desc, onClick }: any) {
  return (
    <button onClick={onClick} style={{ padding: 32, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 32, textAlign: "left", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 4px 12px rgba(15,23,42,0.04)" }} onMouseEnter={(e: any) => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = `0 30px 60px ${color}15`; e.currentTarget.style.borderColor = color + "40"; }} onMouseLeave={(e: any) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.04)"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: `${color}15`, color: color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>{icon}</div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{label}</h3>
      <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{desc}</p>
    </button>
  );
}

function Toast({ message, type }: { message: string, type: string }) {
  return <div style={{ position: "fixed", bottom: 40, right: 40, background: type === "success" ? "#10b981" : "#ef4444", color: "white", padding: "18px 32px", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", zIndex: 400, fontWeight: 700, fontSize: 15, animation: "toastSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>{message}</div>;
}