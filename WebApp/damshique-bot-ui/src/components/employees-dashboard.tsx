import React, { useState, useEffect } from "react";
import { Users, Search, Filter, Download, Upload, Plus, Mail, Phone, Calendar, Award, TrendingUp, MoreVertical, Grid, List, X, ChevronDown, MapPin, Briefcase, User, Trash2, FileText, ExternalLink } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

const ADMIN_TOKEN = "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7";

export default function EmployeesDashboard() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const fetchEmployees = () => {
    setLoading(true);
    fetch("/api/admin/users", {
      headers: { 'X-API-Token': ADMIN_TOKEN }
    })
      .then(r => r.json())
      .then(data => {
        setEmployees(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEditUser = (emp: any) => {
    setEditingEmployee(emp);
  };

  const handleDeleteUser = async (phone: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${phone}`, {
        method: 'DELETE',
        headers: { 'X-API-Token': ADMIN_TOKEN }
      });
      if (res.ok) {
        toast.success("User deleted successfully");
        fetchEmployees();
      } else {
        toast.error("Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting user");
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.phone.includes(searchQuery)
  );

  const stats = [
    { label: "Total Employees", value: employees.length.toString(), icon: <Users size={20} />, color: "#3b82f6" },
    { label: "Admins", value: employees.filter(e => e.role === 'admin').length.toString(), icon: <Award size={20} />, color: "#10b981" },
    { label: "Pending Issues", value: "0", icon: <X size={20} />, color: "#ef4444" },
    { label: "Active Channels", value: "WhatsApp", icon: <Phone size={20} />, color: "#8b5cf6" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Toaster position="top-right" />
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Employee List</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Manage access and roles for all system users</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setEditingEmployee({})}
                style={{ padding: "12px 24px", borderRadius: 14, border: "none", background: "#0f172a", color: "#ffffff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              >
                <Plus size={18} /> Add User
              </button>
              <button
                onClick={() => window.open(`/api/admin/export-employees?token=${ADMIN_TOKEN}`, '_blank')}
                style={{ padding: "12px 24px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#ffffff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
              >
                <Download size={18} /> Export Employees
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{stat.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 20, marginBottom: 32, border: "1px solid #e2e8f0", display: "flex", gap: 16 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={20} color="#94a3b8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search by name, role, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "14px 14px 14px 52px", borderRadius: 14, border: "1px solid #f1f5f9", background: "#f8fafc", fontSize: 15, outline: "none" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading employees...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 }}>
            {filteredEmployees.map(emp => (
              <div key={emp.phone} style={{ background: "#ffffff", borderRadius: 24, border: "1px solid #e2e8f0", padding: 28, transition: "all 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-6px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 60, height: 60, borderRadius: 18, background: emp.role === 'admin' ? "linear-gradient(135deg, #f59e0b, #d97706)" : "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 }}>
                      <User size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{emp.name}</div>
                      <div style={{ fontSize: 13, color: emp.role === 'admin' ? "#d97706" : "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{emp.role}</div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteUser(emp.phone)} style={{ padding: 10, borderRadius: 12, border: "none", background: "#fef2f2", color: "#ef4444", cursor: "pointer" }}>
                    <Trash2 size={18} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#475569", fontWeight: 600 }}>
                    <Phone size={18} color="#94a3b8" />
                    <span>{emp.phone}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#475569", fontWeight: 600 }}>
                    <Calendar size={18} color="#94a3b8" />
                    <span>Joined {new Date(emp.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => handleEditUser(emp)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#ffffff", color: "#0f172a", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Edit Details</button>
                  <button onClick={() => setSelectedEmployee(emp)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#eff6ff", color: "#3b82f6", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>View History</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedEmployee && (
        <EmployeeInvoicesModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {editingEmployee && (
        <EditUserModal
          user={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={() => { setEditingEmployee(null); fetchEmployees(); }}
        />
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}

function EditUserModal({ user, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    role: user.role || "employee"
  });
  const [loading, setLoading] = useState(false);
  const isNew = !user.phone;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Token": ADMIN_TOKEN
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(isNew ? "User added!" : "User updated!");
        onSuccess();
      } else {
        toast.error("Failed to save user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 450, padding: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>{isNew ? "Add User" : "Edit User"}</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8, display: "block" }}>Name</label>
            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", outline: "none" }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8, display: "block" }}>WhatsApp Phone</label>
            <input required value={formData.phone} disabled={!isNew} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", outline: "none", background: isNew ? "#fff" : "#f1f5f9" }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 8, display: "block" }}>Role</label>
            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", outline: "none" }}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 12, background: "#f1f5f9", fontWeight: 700, border: "none", cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: 14, borderRadius: 12, background: "#0f172a", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>{loading ? "Saving..." : "Save User"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeInvoicesModal({ employee, onClose }: { employee: any, onClose: () => void }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${employee.phone}/invoices`, {
      headers: { 'X-API-Token': ADMIN_TOKEN }
    })
      .then(r => r.json())
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, [employee.phone]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 32, width: "100%", maxWidth: 800, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "32px 40px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Spend History: {employee.name}</h2>
            <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{invoices.length} extracted invoices</p>
          </div>
          <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 14, background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} color="#0f172a" />
          </button>
        </div>
        <div style={{ padding: 40, overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading transactions...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {invoices.map((inv, idx) => (
                <div key={idx} style={{ padding: 20, background: "#f8fafc", borderRadius: 16, border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{inv.vendor_name || "Unknown Vendor"}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{new Date(inv.invoice_date).toLocaleDateString()} • {inv.total_amount} {inv.currency}</div>
                    </div>
                  </div>
                  {inv.file_url && (
                    <button onClick={() => window.open(inv.file_url, '_blank')} style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
                      <ExternalLink size={16} /> View Doc
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}