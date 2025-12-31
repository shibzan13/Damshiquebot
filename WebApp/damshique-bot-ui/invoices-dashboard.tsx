import React, { useState } from "react";
import { FileText, Search, Download, Upload, Plus, Send, Eye, Edit, Trash2, DollarSign, TrendingUp, TrendingDown, Calendar, CheckCircle, Clock, XCircle, AlertCircle, Filter, Grid, List, MoreVertical, Printer } from "lucide-react";

export default function InvoicesDashboard() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("All Time");
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  const stats = [
    { label: "Total Invoices", value: "3,421", icon: <FileText size={20} />, color: "#3b82f6", change: "+14%" },
    { label: "Paid", value: "$1.2M", icon: <CheckCircle size={20} />, color: "#10b981", change: "+22%" },
    { label: "Pending", value: "$340K", icon: <Clock size={20} />, color: "#f59e0b", change: "+8%" },
    { label: "Overdue", value: "$87K", icon: <AlertCircle size={20} />, color: "#ef4444", change: "-5%" },
  ];

  const invoices = [
    { id: "INV-2024-001", customer: "TechHub Solutions", amount: 15420, status: "Paid", dueDate: "2024-12-15", issueDate: "2024-11-15", items: 12, paymentMethod: "Bank Transfer", paidDate: "2024-12-10" },
    { id: "INV-2024-002", customer: "Fresh Market Co", amount: 8950, status: "Pending", dueDate: "2024-12-28", issueDate: "2024-11-28", items: 8, paymentMethod: "Credit Card", paidDate: null },
    { id: "INV-2024-003", customer: "Urban Fashion Ltd", amount: 23400, status: "Paid", dueDate: "2024-12-20", issueDate: "2024-11-20", items: 15, paymentMethod: "PayPal", paidDate: "2024-12-18" },
    { id: "INV-2024-004", customer: "MediCare Supplies", amount: 6780, status: "Overdue", dueDate: "2024-12-05", issueDate: "2024-11-05", items: 5, paymentMethod: "Bank Transfer", paidDate: null },
    { id: "INV-2024-005", customer: "Global Manufacturing", amount: 45600, status: "Paid", dueDate: "2024-12-18", issueDate: "2024-11-18", items: 24, paymentMethod: "Wire Transfer", paidDate: "2024-12-15" },
    { id: "INV-2024-006", customer: "Elite Services Group", amount: 12300, status: "Pending", dueDate: "2024-12-30", issueDate: "2024-11-30", items: 10, paymentMethod: "Credit Card", paidDate: null },
    { id: "INV-2024-007", customer: "QuickBite Restaurants", amount: 4500, status: "Overdue", dueDate: "2024-11-25", issueDate: "2024-10-25", items: 6, paymentMethod: "Check", paidDate: null },
    { id: "INV-2024-008", customer: "Digital Solutions Pro", amount: 34200, status: "Pending", dueDate: "2025-01-05", issueDate: "2024-12-05", items: 18, paymentMethod: "Bank Transfer", paidDate: null },
    { id: "INV-2024-009", customer: "Green Energy Corp", amount: 19800, status: "Paid", dueDate: "2024-12-22", issueDate: "2024-11-22", items: 14, paymentMethod: "Credit Card", paidDate: "2024-12-20" },
    { id: "INV-2024-010", customer: "Metro Construction", amount: 28900, status: "Draft", dueDate: "2025-01-10", issueDate: "2024-12-26", items: 16, paymentMethod: "Bank Transfer", paidDate: null },
  ];

  const statuses = ["All", "Paid", "Pending", "Overdue", "Draft"];
  const periods = ["All Time", "This Month", "Last Month", "This Quarter", "This Year"];

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         inv.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "All" || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status) => {
    const configs = {
      Paid: { color: "#10b981", bg: "#dcfce7", icon: <CheckCircle size={14} /> },
      Pending: { color: "#f59e0b", bg: "#fef3c7", icon: <Clock size={14} /> },
      Overdue: { color: "#ef4444", bg: "#fee2e2", icon: <AlertCircle size={14} /> },
      Draft: { color: "#64748b", bg: "#f1f5f9", icon: <Edit size={14} /> }
    };
    return configs[status] || configs.Draft;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Invoices</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Track and manage your invoices and payments</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Download size={18} /> Export
              </button>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Upload size={18} /> Import
              </button>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} /> Create Invoice
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.icon}</div>
                  <div style={{ padding: "4px 12px", borderRadius: 20, background: stat.change.startsWith("+") ? "#dcfce7" : "#fee2e2", color: stat.change.startsWith("+") ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    {stat.change.startsWith("+") ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {stat.change}
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        {/* Filters */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 300, position: "relative" }}>
              <Search size={20} color="#64748b" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input type="text" placeholder="Search by invoice ID or customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "12px 12px 12px 48px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
            </div>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {periods.map(p => <option key={p}>{p}</option>)}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: 12, borderRadius: 10, border: `1px solid ${viewMode === "grid" ? "#3b82f6" : "#e2e8f0"}`, background: viewMode === "grid" ? "#eff6ff" : "#fff", color: viewMode === "grid" ? "#3b82f6" : "#64748b", cursor: "pointer" }}>
                <Grid size={20} />
              </button>
              <button onClick={() => setViewMode("table")} style={{ padding: 12, borderRadius: 10, border: `1px solid ${viewMode === "table" ? "#3b82f6" : "#e2e8f0"}`, background: viewMode === "table" ? "#eff6ff" : "#fff", color: viewMode === "table" ? "#3b82f6" : "#64748b", cursor: "pointer" }}>
                <List size={20} />
              </button>
            </div>
          </div>

          {selectedInvoices.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: "#eff6ff", borderRadius: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1e40af" }}>{selectedInvoices.length} invoice(s) selected</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Send Reminder</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Mark Paid</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Delete</button>
                <button onClick={() => setSelectedInvoices([])} style={{ padding: "8px 16px", borderRadius: 8, background: "#fff", border: "1px solid #cbd5e1", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Clear</button>
              </div>
            </div>
          )}
        </div>

        {/* Grid View */}
        {viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 20 }}>
            {filteredInvoices.map(inv => {
              const sc = getStatusConfig(inv.status);
              const daysUntilDue = getDaysUntilDue(inv.dueDate);
              return (
                <div key={inv.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, position: "relative" }}>
                  <div style={{ position: "absolute", top: 16, right: 16 }}>
                    <input type="checkbox" checked={selectedInvoices.includes(inv.id)} onChange={() => setSelectedInvoices(prev => prev.includes(inv.id) ? prev.filter(id => id !== inv.id) : [...prev, inv.id])} style={{ width: 18, height: 18, cursor: "pointer" }} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{inv.id}</div>
                    <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{inv.customer}</div>
                  </div>

                  <div style={{ padding: "4px 10px", borderRadius: 6, background: sc.bg, fontSize: 12, fontWeight: 600, color: sc.color, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
                    {sc.icon}
                    {inv.status}
                  </div>

                  <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "#64748b" }}>Amount</span>
                      <span style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{formatCurrency(inv.amount)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{inv.items} items</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>Issue Date</span>
                      <span style={{ color: "#0f172a", fontWeight: 600 }}>{formatDate(inv.issueDate)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>Due Date</span>
                      <span style={{ color: daysUntilDue < 0 ? "#ef4444" : daysUntilDue < 7 ? "#f59e0b" : "#0f172a", fontWeight: 600 }}>{formatDate(inv.dueDate)}</span>
                    </div>
                    {inv.paidDate && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                        <span style={{ color: "#64748b" }}>Paid Date</span>
                        <span style={{ color: "#10b981", fontWeight: 600 }}>{formatDate(inv.paidDate)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#64748b" }}>Payment Method</span>
                      <span style={{ color: "#0f172a", fontWeight: 600 }}>{inv.paymentMethod}</span>
                    </div>
                  </div>

                  {inv.status === "Overdue" && (
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>
                        ⚠️ {Math.abs(daysUntilDue)} days overdue
                      </div>
                    </div>
                  )}

                  {inv.status === "Pending" && daysUntilDue < 7 && daysUntilDue > 0 && (
                    <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>
                        ⏱ Due in {daysUntilDue} days
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Eye size={16} /> View
                    </button>
                    <button style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
                      <Send size={16} />
                    </button>
                    <button style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
                      <Printer size={16} />
                    </button>
                    <button style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                    <input type="checkbox" onChange={(e) => setSelectedInvoices(e.target.checked ? filteredInvoices.map(i => i.id) : [])} style={{ width: 18, height: 18 }} />
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Invoice</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Customer</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Amount</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Issue Date</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Due Date</th>
                  <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv, i) => {
                  const sc = getStatusConfig(inv.status);
                  const daysUntilDue = getDaysUntilDue(inv.dueDate);
                  return (
                    <tr key={inv.id} style={{ borderBottom: i < filteredInvoices.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <input type="checkbox" checked={selectedInvoices.includes(inv.id)} onChange={() => setSelectedInvoices(prev => prev.includes(inv.id) ? prev.filter(id => id !== inv.id) : [...prev, inv.id])} style={{ width: 18, height: 18 }} />
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{inv.id}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{inv.items} items</div>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 600, color: "#475569" }}>{inv.customer}</td>
                      <td style={{ padding: "16px 20px", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{formatCurrency(inv.amount)}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: sc.bg, fontSize: 12, fontWeight: 600, color: sc.color, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {sc.icon}
                          {inv.status}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b" }}>{formatDate(inv.issueDate)}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: daysUntilDue < 0 ? "#ef4444" : daysUntilDue < 7 ? "#f59e0b" : "#0f172a" }}>
                          {formatDate(inv.dueDate)}
                        </div>
                        {daysUntilDue < 0 && inv.status !== "Paid" && (
                          <div style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>{Math.abs(daysUntilDue)}d overdue</div>
                        )}
                        {daysUntilDue >= 0 && daysUntilDue < 7 && inv.status === "Pending" && (
                          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>Due in {daysUntilDue}d</div>
                        )}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View</button>
                          <button style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer" }}>
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, color: "#64748b" }}>Showing <span style={{ fontWeight: 600, color: "#0f172a" }}>{filteredInvoices.length}</span> of <span style={{ fontWeight: 600, color: "#0f172a" }}>3,421</span></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>Previous</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600, border: "none" }}>1</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>2</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>3</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}