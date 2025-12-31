import React, { useState } from "react";
import { Users, Shield, Key, Lock, UserPlus, Search, Edit, Trash2, MoreVertical, CheckCircle, XCircle, Clock } from "lucide-react";

export default function UsersRolesDashboard() {
  const [selectedTab, setSelectedTab] = useState("users");

  const stats = [
    { label: "Total Users", value: "156", icon: <Users size={20} />, color: "#3b82f6" },
    { label: "Active Users", value: "142", icon: <CheckCircle size={20} />, color: "#10b981" },
    { label: "Roles Defined", value: "8", icon: <Shield size={20} />, color: "#8b5cf6" },
    { label: "Pending Invites", value: "5", icon: <Clock size={20} />, color: "#f59e0b" },
  ];

  const users = [
    { id: 1, name: "Sarah Chen", email: "sarah.chen@damshique.com", role: "Admin", status: "Active", lastLogin: "2 mins ago", avatar: "SC", permissions: 15 },
    { id: 2, name: "Marcus Rodriguez", email: "marcus.r@damshique.com", role: "Manager", status: "Active", lastLogin: "1 hour ago", avatar: "MR", permissions: 12 },
    { id: 3, name: "Emily Watson", email: "emily.w@damshique.com", role: "Editor", status: "Active", lastLogin: "3 hours ago", avatar: "EW", permissions: 8 },
    { id: 4, name: "James Park", email: "james.park@damshique.com", role: "Viewer", status: "Inactive", lastLogin: "2 days ago", avatar: "JP", permissions: 4 },
    { id: 5, name: "Lisa Anderson", email: "lisa.a@damshique.com", role: "Manager", status: "Active", lastLogin: "30 mins ago", avatar: "LA", permissions: 12 },
    { id: 6, name: "David Kim", email: "david.kim@damshique.com", role: "Editor", status: "Active", lastLogin: "5 hours ago", avatar: "DK", permissions: 8 },
  ];

  const roles = [
    { id: 1, name: "Admin", users: 3, color: "#ef4444", permissions: ["Full Access", "User Management", "System Settings", "All Resources"], description: "Complete system access" },
    { id: 2, name: "Manager", users: 12, color: "#f59e0b", permissions: ["View All", "Edit Most", "Approve Actions", "Generate Reports"], description: "Manage team and resources" },
    { id: 3, name: "Editor", users: 45, color: "#3b82f6", permissions: ["View Resources", "Edit Content", "Create Items", "Basic Reports"], description: "Create and edit content" },
    { id: 4, name: "Viewer", users: 96, color: "#64748b", permissions: ["View Only", "Export Data", "Basic Access"], description: "Read-only access" },
  ];

  const permissions = [
    { category: "Users", items: ["View Users", "Create Users", "Edit Users", "Delete Users"] },
    { category: "Content", items: ["View Content", "Create Content", "Edit Content", "Delete Content"] },
    { category: "Reports", items: ["View Reports", "Generate Reports", "Export Reports", "Schedule Reports"] },
    { category: "Settings", items: ["View Settings", "Edit Settings", "System Config", "Security Settings"] },
  ];

  const getStatusConfig = (status) => {
    return status === "Active" 
      ? { color: "#10b981", bg: "#dcfce7", icon: <CheckCircle size={14} /> }
      : { color: "#64748b", bg: "#f1f5f9", icon: <XCircle size={14} /> };
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Users & Roles</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Manage user access and permissions</p>
            </div>
            <button style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <UserPlus size={18} /> Invite User
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
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", marginBottom: 24 }}>
          <div style={{ borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", gap: 24 }}>
            <button onClick={() => setSelectedTab("users")} style={{ padding: "16px 0", border: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: selectedTab === "users" ? "#3b82f6" : "#64748b", cursor: "pointer", borderBottom: selectedTab === "users" ? "2px solid #3b82f6" : "2px solid transparent" }}>
              Users
            </button>
            <button onClick={() => setSelectedTab("roles")} style={{ padding: "16px 0", border: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: selectedTab === "roles" ? "#3b82f6" : "#64748b", cursor: "pointer", borderBottom: selectedTab === "roles" ? "2px solid #3b82f6" : "2px solid transparent" }}>
              Roles
            </button>
            <button onClick={() => setSelectedTab("permissions")} style={{ padding: "16px 0", border: "none", background: "transparent", fontSize: 15, fontWeight: 600, color: selectedTab === "permissions" ? "#3b82f6" : "#64748b", cursor: "pointer", borderBottom: selectedTab === "permissions" ? "2px solid #3b82f6" : "2px solid transparent" }}>
              Permissions
            </button>
          </div>

          <div style={{ padding: 24 }}>
            {selectedTab === "users" && (
              <>
                <div style={{ marginBottom: 24, position: "relative" }}>
                  <Search size={20} color="#64748b" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                  <input type="text" placeholder="Search users..." style={{ width: "100%", padding: "12px 12px 12px 48px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {users.map(user => {
                    const sc = getStatusConfig(user.status);
                    return (
                      <div key={user.id} style={{ padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>{user.avatar}</div>
                          <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{user.name}</div>
                            <div style={{ fontSize: 13, color: "#64748b" }}>{user.email}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Role</div>
                            <div style={{ padding: "4px 12px", borderRadius: 6, background: "#f1f5f9", fontSize: 13, fontWeight: 600, color: "#475569" }}>{user.role}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Status</div>
                            <div style={{ padding: "4px 12px", borderRadius: 6, background: sc.bg, fontSize: 13, fontWeight: 600, color: sc.color, display: "flex", alignItems: "center", gap: 4 }}>{sc.icon}{user.status}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Last Login</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{user.lastLogin}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Permissions</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#3b82f6" }}>{user.permissions}</div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                            <button style={{ padding: "8px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>
                              <MoreVertical size={16} color="#64748b" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {selectedTab === "roles" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {roles.map(role => (
                  <div key={role.id} style={{ background: "#f8fafc", borderRadius: 16, padding: 24, border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${role.color}15`, color: role.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Shield size={24} />
                      </div>
                      <button style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
                        <MoreVertical size={18} color="#64748b" />
                      </button>
                    </div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{role.name}</h3>
                    <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>{role.description}</p>
                    <div style={{ padding: "10px 12px", background: "#fff", borderRadius: 10, marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Users with this role</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{role.users}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10 }}>PERMISSIONS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {role.permissions.map((perm, i) => (
                        <div key={i} style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle size={14} color="#10b981" />
                          {perm}
                        </div>
                      ))}
                    </div>
                    <button style={{ marginTop: 16, width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Edit Role
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === "permissions" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 24 }}>
                {permissions.map((perm, i) => (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 16, padding: 24, border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#3b82f615", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Key size={20} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{perm.category}</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {perm.items.map((item, j) => (
                        <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#fff", borderRadius: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: "#475569" }}>{item}</span>
                          <input type="checkbox" defaultChecked={j < 2} style={{ width: 18, height: 18, cursor: "pointer" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}