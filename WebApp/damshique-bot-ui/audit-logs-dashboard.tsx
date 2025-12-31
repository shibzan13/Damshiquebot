import React, { useState } from "react";
import { History, Search, Filter, Download, Eye, User, FileText, Settings, Lock, Trash2, Edit, Plus, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function AuditLogsDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("All");
  const [selectedUser, setSelectedUser] = useState("All Users");

  const stats = [
    { label: "Total Events", value: "2,341", icon: <History size={20} />, color: "#3b82f6" },
    { label: "Today", value: "156", icon: <CheckCircle size={20} />, color: "#10b981" },
    { label: "Security Events", value: "23", icon: <Lock size={20} />, color: "#f59e0b" },
    { label: "Failed Actions", value: "8", icon: <XCircle size={20} />, color: "#ef4444" },
  ];

  const actions = ["All", "Create", "Update", "Delete", "Login", "Logout", "View", "Export", "Security"];
  const users = ["All Users", "Sarah Chen", "Marcus Rodriguez", "Emily Watson", "James Park"];

  const logs = [
    { id: 1, user: "Sarah Chen", action: "Update", resource: "Invoice", details: "Updated INV-2024-001 status to Paid", status: "success", timestamp: "2 mins ago", ip: "192.168.1.1", severity: "info" },
    { id: 2, user: "Marcus Rodriguez", action: "Create", resource: "Employee", details: "Added new employee: John Smith", status: "success", timestamp: "15 mins ago", ip: "192.168.1.45", severity: "info" },
    { id: 3, user: "Emily Watson", action: "Delete", resource: "Merchant", details: "Removed merchant MCH-2024-089", status: "success", timestamp: "28 mins ago", ip: "192.168.1.23", severity: "warning" },
    { id: 4, user: "System", action: "Security", resource: "Login Attempt", details: "Failed login attempt detected", status: "failed", timestamp: "1 hour ago", ip: "203.45.67.89", severity: "critical" },
    { id: 5, user: "James Park", action: "View", resource: "Report", details: "Generated Q4 sales report", status: "success", timestamp: "1 hour ago", ip: "192.168.1.67", severity: "info" },
    { id: 6, user: "Sarah Chen", action: "Update", resource: "Settings", details: "Changed notification preferences", status: "success", timestamp: "2 hours ago", ip: "192.168.1.1", severity: "info" },
    { id: 7, user: "Marcus Rodriguez", action: "Export", resource: "Employee Data", details: "Exported 156 employee records", status: "success", timestamp: "3 hours ago", ip: "192.168.1.45", severity: "warning" },
    { id: 8, user: "Lisa Anderson", action: "Login", resource: "System", details: "Successful login from new device", status: "success", timestamp: "4 hours ago", ip: "192.168.1.89", severity: "info" },
    { id: 9, user: "David Kim", action: "Update", resource: "Merchant", details: "Updated Fresh Market Co contract", status: "success", timestamp: "5 hours ago", ip: "192.168.1.34", severity: "info" },
    { id: 10, user: "System", action: "Security", resource: "Password Reset", details: "Password reset requested for user: emily.w@damshique.com", status: "success", timestamp: "6 hours ago", ip: "192.168.1.23", severity: "warning" },
  ];

  const getActionIcon = (action) => {
    const icons = {
      Create: <Plus size={16} />,
      Update: <Edit size={16} />,
      Delete: <Trash2 size={16} />,
      Login: <User size={16} />,
      Logout: <User size={16} />,
      View: <Eye size={16} />,
      Export: <Download size={16} />,
      Security: <Lock size={16} />
    };
    return icons[action] || <History size={16} />;
  };

  const getActionColor = (action) => {
    const colors = {
      Create: "#10b981",
      Update: "#3b82f6",
      Delete: "#ef4444",
      Login: "#8b5cf6",
      Logout: "#64748b",
      View: "#06b6d4",
      Export: "#f59e0b",
      Security: "#ef4444"
    };
    return colors[action] || "#64748b";
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      info: { color: "#3b82f6", bg: "#dbeafe", icon: <CheckCircle size={14} /> },
      warning: { color: "#f59e0b", bg: "#fef3c7", icon: <AlertTriangle size={14} /> },
      critical: { color: "#ef4444", bg: "#fee2e2", icon: <XCircle size={14} /> }
    };
    return configs[severity] || configs.info;
  };

  const getStatusConfig = (status) => {
    return status === "success"
      ? { color: "#10b981", bg: "#dcfce7" }
      : { color: "#ef4444", bg: "#fee2e2" };
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = selectedAction === "All" || log.action === selectedAction;
    const matchesUser = selectedUser === "All Users" || log.user === selectedUser;
    return matchesSearch && matchesAction && matchesUser;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Audit Logs</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Track all system activities and user actions</p>
            </div>
            <button style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Download size={18} /> Export Logs
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{stat.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 300, position: "relative" }}>
              <Search size={20} color="#64748b" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input type="text" placeholder="Search logs by user, action, or resource..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "12px 12px 12px 48px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
            </div>
            <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {actions.map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {users.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
            <div style={{ display: "grid", gridTemplateColumns: "200px 120px 150px 1fr 120px 150px 100px", gap: 16, fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              <div>User</div>
              <div>Action</div>
              <div>Resource</div>
              <div>Details</div>
              <div>Status</div>
              <div>Time</div>
              <div>Severity</div>
            </div>
          </div>

          <div>
            {filteredLogs.map((log, i) => {
              const actionColor = getActionColor(log.action);
              const sc = getStatusConfig(log.status);
              const sev = getSeverityConfig(log.severity);
              return (
                <div key={log.id} style={{ padding: "20px 24px", borderBottom: i < filteredLogs.length - 1 ? "1px solid #f1f5f9" : "none", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                  <div style={{ display: "grid", gridTemplateColumns: "200px 120px 150px 1fr 120px 150px 100px", gap: 16, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>{log.user}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{log.ip}</div>
                    </div>
                    <div>
                      <div style={{ padding: "6px 12px", borderRadius: 8, background: `${actionColor}15`, color: actionColor, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{log.resource}</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{log.details}</div>
                    <div>
                      <div style={{ padding: "4px 10px", borderRadius: 6, background: sc.bg, fontSize: 12, fontWeight: 600, color: sc.color, display: "inline-block", textTransform: "capitalize" }}>
                        {log.status}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>{log.timestamp}</div>
                    <div>
                      <div style={{ padding: "4px 10px", borderRadius: 6, background: sev.bg, fontSize: 11, fontWeight: 600, color: sev.color, display: "inline-flex", alignItems: "center", gap: 4, textTransform: "capitalize" }}>
                        {sev.icon}
                        {log.severity}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
            <div style={{ fontSize: 14, color: "#64748b" }}>Showing <span style={{ fontWeight: 600, color: "#0f172a" }}>{filteredLogs.length}</span> of <span style={{ fontWeight: 600, color: "#0f172a" }}>2,341</span> events</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>Previous</button>
              <button style={{ padding: "8px 16px", borderRadius: 8, background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600, border: "none" }}>1</button>
              <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>2</button>
              <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>3</button>
              <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>Next</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}