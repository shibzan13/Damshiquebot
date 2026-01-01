import React, { useState, useEffect } from "react";
import { History, Search, Filter, Download, Eye, User, FileText, Settings, Lock, Trash2, Edit, Plus, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const ADMIN_TOKEN = "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7";

export default function AuditLogsDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit-logs", {
      headers: { 'X-API-Token': ADMIN_TOKEN }
    })
      .then(r => r.json())
      .then(data => {
        setLogs(data);
        setLoading(false);
      })
      .catch(err => console.error("Failed to fetch audit logs:", err));
  }, []);

  const stats = [
    { label: "Total Events", value: logs.length.toString(), icon: <History size={20} />, color: "#3b82f6" },
    { label: "Today", value: logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length.toString(), icon: <CheckCircle size={20} />, color: "#10b981" },
    { label: "Security Events", value: "0", icon: <Lock size={20} />, color: "#f59e0b" },
    { label: "Failed Actions", value: "0", icon: <XCircle size={20} />, color: "#ef4444" },
  ];

  const getActionIcon = (action: string) => {
    const icons: any = {
      submit: <Plus size={16} />,
      approve: <CheckCircle size={16} />,
      reject: <XCircle size={16} />,
      delete: <Trash2 size={16} />,
      edit: <Edit size={16} />
    };
    return icons[action] || <Activity size={16} />;
  };

  const getActionColor = (action: string) => {
    const colors: any = {
      submit: "#3b82f6",
      approve: "#10b981",
      reject: "#ef4444",
      delete: "#ef4444",
      edit: "#f59e0b"
    };
    return colors[action] || "#64748b";
  };

  const filteredLogs = Array.isArray(logs) ? logs.filter(log =>
    log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Audit Logs</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Complete trail of all human and system actions</p>
            </div>
            <button
              onClick={() => window.open(`/api/admin/export-audit?token=${ADMIN_TOKEN}`, '_blank')}
              style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Download size={18} /> Export History
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{stat.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ position: "relative" }}>
            <Search size={20} color="#94a3b8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "14px 14px 14px 52px", borderRadius: 14, border: "1px solid #f1f5f9", background: "#f8fafc", fontSize: 15, outline: "none" }}
            />
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "24px 32px", borderBottom: "1px solid #f1f5f9", background: "#fcfdff" }}>
            <div style={{ display: "grid", gridTemplateColumns: "250px 150px 150px 1fr 200px", gap: 24, fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <div>User</div>
              <div>Action</div>
              <div>Entity</div>
              <div>Details</div>
              <div>Timestamp</div>
            </div>
          </div>

          <div>
            {loading ? (
              <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading system logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>No matching audit logs found.</div>
            ) : filteredLogs.map((log, i) => {
              const actionColor = getActionColor(log.action);
              return (
                <div key={log.audit_id} style={{ padding: "24px 32px", borderBottom: i < filteredLogs.length - 1 ? "1px solid #f8fafc" : "none", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#fcfdff"} onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                  <div style={{ display: "grid", gridTemplateColumns: "250px 150px 150px 1fr 200px", gap: 24, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><User size={18} /></div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{log.user_name || "System"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{log.user_id}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ padding: "6px 12px", borderRadius: 10, background: `${actionColor}15`, color: actionColor, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6, textTransform: "capitalize" }}>
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "capitalize" }}>{log.entity_type}</div>
                    <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>
                      {log.action} {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)})` : ""}
                    </div>
                    <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}

const Activity = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
)