import React, { useEffect, useState } from "react";
import { Users, Shield, Key, Lock, UserPlus, Search, Edit, Trash2, MoreVertical, CheckCircle, XCircle, Clock, UserCheck, X, Download } from "lucide-react";

const ADMIN_TOKEN = "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7";

export default function UsersRolesDashboard() {
  const [selectedTab, setSelectedTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });
  const [processing, setProcessing] = useState<string | null>(null);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: "", phone: "", role: "employee" });

  const fetchUsers = async () => {
    try {
      const uRes = await fetch("/api/admin/users", { headers: { 'X-API-Token': ADMIN_TOKEN } });
      const rRes = await fetch("/api/admin/requests", { headers: { 'X-API-Token': ADMIN_TOKEN } });
      const uData = await uRes.json();
      const rData = await rRes.json();

      setUsers(uData);
      setRequests(rData);
      setStats({
        total: uData.length,
        active: uData.filter((u: any) => u.is_approved).length,
        pending: rData.length
      });
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (phone: string, action: 'approve' | 'reject' | 'delete') => {
    setProcessing(phone);
    try {
      let url = "";
      let method = "POST";

      if (action === 'approve') url = `/api/admin/requests/${phone}/approve`;
      else if (action === 'reject') url = `/api/admin/requests/${phone}/reject`;
      else if (action === 'delete') {
        url = `/api/admin/users/${phone}`;
        method = "DELETE";
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'X-API-Token': ADMIN_TOKEN }
      });

      if (res.ok) {
        await fetchUsers();
      }
    } catch (err) {
      console.error(`${action} failed:`, err);
    } finally {
      setProcessing(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.phone) return;

    setProcessing("adding");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          'X-API-Token': ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUserData)
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewUserData({ name: "", phone: "", role: "employee" });
        await fetchUsers();
      }
    } catch (err) {
      console.error("Add user failed:", err);
    } finally {
      setProcessing(null);
    }
  };

  const dashboardStats = [
    { label: "Total Approved", value: stats.active, icon: <Users size={20} />, color: "#3b82f6" },
    { label: "Pending Requests", value: stats.pending, icon: <Clock size={20} />, color: "#f59e0b" },
    { label: "Active Roles", value: "2", icon: <Shield size={20} />, color: "#8b5cf6" },
    { label: "System Health", value: "100%", icon: <CheckCircle size={20} />, color: "#10b981" },
  ];

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading users...</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Users & Permissions</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Manage user access and approve new registration requests</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => window.open(`/api/admin/export-employees?token=${ADMIN_TOKEN}`, '_blank')}
                style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                <Download size={18} /> Export List
              </button>
              <button onClick={() => setShowAddModal(true)} style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={18} /> Add User
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {dashboardStats.map((stat, i) => (
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
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", marginBottom: 24 }}>
          <div style={{ borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", gap: 24 }}>
            <button onClick={() => setSelectedTab("users")} style={{ padding: "16px 0", border: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: selectedTab === "users" ? "#3b82f6" : "#64748b", cursor: "pointer", borderBottom: selectedTab === "users" ? "2px solid #3b82f6" : "2px solid transparent" }}>
              Approved Users ({users.length})
            </button>
            <button onClick={() => setSelectedTab("requests")} style={{ padding: "16px 0", border: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: selectedTab === "requests" ? "#f59e0b" : "#64748b", cursor: "pointer", borderBottom: selectedTab === "requests" ? "2px solid #f59e0b" : "2px solid transparent" }}>
              Pending Requests ({requests.length})
            </button>
          </div>

          <div style={{ padding: 24 }}>
            {selectedTab === "users" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {users.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>No approved users found.</div>}
                {users.map((user: any) => (
                  <div key={user.phone} style={{ padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>{user.name[0]}</div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{user.name}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{user.phone} • {user.role}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ padding: "6px 12px", borderRadius: 10, background: "#dcfce7", color: "#166534", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                        <UserCheck size={14} /> Approved
                      </div>
                      <button onClick={() => handleAction(user.phone, 'delete')} disabled={processing === user.phone} style={{ padding: 10, borderRadius: 10, border: "1px solid #fee2e2", background: "#fff", cursor: "pointer", opacity: processing === user.phone ? 0.5 : 1 }}><Trash2 size={16} color="#ef4444" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === "requests" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {requests.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>No pending requests.</div>}
                {requests.map((req: any) => (
                  <div key={req.phone} style={{ padding: 20, background: "#fffbeb", borderRadius: 12, border: "1px solid #fef3c7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f59e0b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>{req.name[0]}</div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{req.name}</div>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{req.phone} • {req.details || "Requesting access"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={() => handleAction(req.phone, 'approve')} disabled={!!processing} style={{ padding: "10px 20px", borderRadius: 12, background: "#3b82f6", color: "#fff", border: "none", fontWeight: 700, cursor: processing === req.phone ? "wait" : "pointer", opacity: processing === req.phone ? 0.5 : 1 }}>
                        {processing === req.phone ? "Processing..." : "Approve Access"}
                      </button>
                      <button onClick={() => handleAction(req.phone, 'reject')} disabled={!!processing} style={{ padding: "10px 20px", borderRadius: 12, background: "#fff", color: "#ef4444", border: "1px solid #fee2e2", fontWeight: 700, cursor: "pointer", opacity: processing === req.phone ? 0.5 : 1 }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 500, padding: 32, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Add New User</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={24} color="#64748b" /></button>
            </div>

            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Full Name</label>
                <input required type="text" value={newUserData.name} onChange={e => setNewUserData({ ...newUserData, name: e.target.value })} placeholder="e.g. John Doe" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 15 }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8 }}>WhatsApp Phone (Include Country Code)</label>
                <input required type="text" value={newUserData.phone} onChange={e => setNewUserData({ ...newUserData, phone: e.target.value })} placeholder="e.g. 971501234567" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", outline: "none", fontSize: 15 }} />
              </div>

              <div style={{ marginBottom: 32 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Role</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {["employee", "admin"].map(r => (
                    <button key={r} type="button" onClick={() => setNewUserData({ ...newUserData, role: r })} style={{ flex: 1, padding: "12px", borderRadius: 12, border: `2px solid ${newUserData.role === r ? "#3b82f6" : "#e2e8f0"}`, background: newUserData.role === r ? "#eff6ff" : "transparent", color: newUserData.role === r ? "#3b82f6" : "#64748b", fontWeight: 700, fontSize: 14, cursor: "pointer", textTransform: "capitalize" }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button disabled={processing === "adding"} type="submit" style={{ width: "100%", padding: "16px", borderRadius: 16, background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                {processing === "adding" ? "Creating..." : <><UserPlus size={20} /> Create User</>}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}