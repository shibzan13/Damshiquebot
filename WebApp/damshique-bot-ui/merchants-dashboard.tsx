import React, { useState } from "react";
import { Store, Search, Download, Upload, Plus, Mail, Phone, DollarSign, TrendingUp, TrendingDown, MapPin, MoreVertical, Grid, List, Package, CheckCircle, XCircle, Clock, AlertCircle, Star } from "lucide-react";

export default function MerchantsDashboard() {
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedMerchants, setSelectedMerchants] = useState([]);

  const stats = [
    { label: "Total Merchants", value: "856", icon: <Store size={20} />, color: "#3b82f6", change: "+8%" },
    { label: "Active Contracts", value: "723", icon: <CheckCircle size={20} />, color: "#10b981", change: "+12%" },
    { label: "Monthly Revenue", value: "$2.4M", icon: <DollarSign size={20} />, color: "#8b5cf6", change: "+15%" },
    { label: "Pending Reviews", value: "47", icon: <AlertCircle size={20} />, color: "#f59e0b", change: "-3%" },
  ];

  const merchants = [
    { id: 1, name: "TechHub Solutions", category: "Technology", email: "contact@techhub.com", phone: "+1 (555) 111-2222", status: "Active", logo: "TH", rating: 4.8, revenue: "$145K", products: 234, location: "San Francisco, CA", contractStart: "Jan 2023", paymentTerms: "Net 30", lastOrder: "2 days ago" },
    { id: 2, name: "Fresh Market Co", category: "Food & Beverage", email: "info@freshmarket.com", phone: "+1 (555) 222-3333", status: "Active", logo: "FM", rating: 4.9, revenue: "$89K", products: 156, location: "New York, NY", contractStart: "Mar 2022", paymentTerms: "Net 15", lastOrder: "1 day ago" },
    { id: 3, name: "Urban Fashion Ltd", category: "Retail", email: "support@urbanfashion.com", phone: "+1 (555) 333-4444", status: "Active", logo: "UF", rating: 4.6, revenue: "$203K", products: 489, location: "Los Angeles, CA", contractStart: "Jun 2021", paymentTerms: "Net 30", lastOrder: "5 hours ago" },
    { id: 4, name: "MediCare Supplies", category: "Healthcare", email: "orders@medicare-sup.com", phone: "+1 (555) 444-5555", status: "Pending", logo: "MS", rating: 4.7, revenue: "$67K", products: 89, location: "Chicago, IL", contractStart: "Pending", paymentTerms: "Net 45", lastOrder: "Never" },
    { id: 5, name: "Global Manufacturing Inc", category: "Manufacturing", email: "sales@globalmfg.com", phone: "+1 (555) 555-6666", status: "Active", logo: "GM", rating: 4.5, revenue: "$312K", products: 567, location: "Detroit, MI", contractStart: "Sep 2020", paymentTerms: "Net 60", lastOrder: "3 days ago" },
    { id: 6, name: "Elite Services Group", category: "Services", email: "contact@eliteservices.com", phone: "+1 (555) 666-7777", status: "Active", logo: "ES", rating: 4.9, revenue: "$178K", products: 123, location: "Seattle, WA", contractStart: "Feb 2023", paymentTerms: "Net 30", lastOrder: "Today" },
    { id: 7, name: "QuickBite Restaurants", category: "Food & Beverage", email: "admin@quickbite.com", phone: "+1 (555) 777-8888", status: "Suspended", logo: "QB", rating: 3.8, revenue: "$45K", products: 67, location: "Miami, FL", contractStart: "Nov 2022", paymentTerms: "Net 15", lastOrder: "2 weeks ago" },
    { id: 8, name: "Digital Solutions Pro", category: "Technology", email: "info@digitalpro.com", phone: "+1 (555) 888-9999", status: "Active", logo: "DS", rating: 4.7, revenue: "$234K", products: 345, location: "Austin, TX", contractStart: "Apr 2021", paymentTerms: "Net 30", lastOrder: "Yesterday" },
  ];

  const categories = ["All", "Retail", "Food & Beverage", "Technology", "Healthcare", "Services", "Manufacturing"];
  const statuses = ["All", "Active", "Pending", "Suspended", "Inactive"];

  const filteredMerchants = merchants.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || m.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || m.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusConfig = (status) => {
    const configs = {
      Active: { color: "#10b981", bg: "#dcfce7", icon: <CheckCircle size={14} /> },
      Pending: { color: "#f59e0b", bg: "#fef3c7", icon: <Clock size={14} /> },
      Suspended: { color: "#ef4444", bg: "#fee2e2", icon: <XCircle size={14} /> },
      Inactive: { color: "#64748b", bg: "#f1f5f9", icon: <AlertCircle size={14} /> }
    };
    return configs[status] || configs.Inactive;
  };

  const renderStars = (rating) => Array.from({ length: 5 }).map((_, i) => (
    <Star key={i} size={14} fill={i < Math.floor(rating) ? "#fbbf24" : "none"} color="#fbbf24" />
  ));

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Merchants</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Manage merchant partnerships and business relationships</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Download size={18} /> Export
              </button>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Upload size={18} /> Import
              </button>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Plus size={18} /> Add Merchant
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.icon}</div>
                  <div style={{ padding: "4px 12px", borderRadius: 20, background: stat.change.startsWith("+") ? "#dcfce7" : "#fef3c7", color: stat.change.startsWith("+") ? "#166534" : "#854d0e", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
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

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 300, position: "relative" }}>
              <Search size={20} color="#64748b" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input type="text" placeholder="Search merchants..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "12px 12px 12px 48px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 15, outline: "none" }} />
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {categories.map(cat => <option key={cat}>{cat}</option>)}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {statuses.map(status => <option key={status}>{status}</option>)}
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

          {selectedMerchants.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: "#eff6ff", borderRadius: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1e40af" }}>{selectedMerchants.length} selected</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Message</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>Suspend</button>
                <button onClick={() => setSelectedMerchants([])} style={{ padding: "8px 16px", borderRadius: 8, background: "#fff", border: "1px solid #cbd5e1", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Clear</button>
              </div>
            </div>
          )}
        </div>

        {viewMode === "grid" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
            {filteredMerchants.map(m => {
              const sc = getStatusConfig(m.status);
              return (
                <div key={m.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                      <input type="checkbox" checked={selectedMerchants.includes(m.id)} onChange={() => setSelectedMerchants(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])} style={{ width: 18, height: 18, cursor: "pointer" }} />
                      <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>{m.logo}</div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{m.name}</div>
                        <div style={{ display: "flex", gap: 4 }}>{renderStars(m.rating)}</div>
                      </div>
                    </div>
                    <MoreVertical size={18} color="#64748b" />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <div style={{ padding: "4px 10px", borderRadius: 6, background: "#f1f5f9", fontSize: 12, fontWeight: 600, color: "#475569" }}>{m.category}</div>
                    <div style={{ padding: "4px 10px", borderRadius: 6, background: sc.bg, fontSize: 12, fontWeight: 600, color: sc.color, display: "flex", alignItems: "center", gap: 4 }}>{sc.icon}{m.status}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, padding: 16, background: "#f8fafc", borderRadius: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Revenue</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}><DollarSign size={16} />{m.revenue}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Products</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#3b82f6", display: "flex", alignItems: "center", gap: 4 }}><Package size={16} />{m.products}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}><Mail size={16} />{m.email}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}><Phone size={16} />{m.phone}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}><MapPin size={16} />{m.location}</div>
                  </div>
                  <div style={{ paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Contract</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{m.contractStart}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Payment</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{m.paymentTerms}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Last Order</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{m.lastOrder}</div>
                    </div>
                  </div>
                  <button style={{ marginTop: 16, width: "100%", padding: "10px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>View Details</button>
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
                    <input type="checkbox" onChange={(e) => setSelectedMerchants(e.target.checked ? filteredMerchants.map(m => m.id) : [])} style={{ width: 18, height: 18 }} />
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Merchant</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Category</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Revenue</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Products</th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Location</th>
                  <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMerchants.map((m, i) => {
                  const sc = getStatusConfig(m.status);
                  return (
                    <tr key={m.id} style={{ borderBottom: i < filteredMerchants.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <input type="checkbox" checked={selectedMerchants.includes(m.id)} onChange={() => setSelectedMerchants(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])} style={{ width: 18, height: 18 }} />
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{m.logo}</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{m.name}</div>
                            <div style={{ display: "flex", gap: 2 }}>{renderStars(m.rating)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: "#f1f5f9", fontSize: 12, fontWeight: 600, color: "#475569", display: "inline-block" }}>{m.category}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: sc.bg, fontSize: 12, fontWeight: 600, color: sc.color, display: "inline-flex", alignItems: "center", gap: 4 }}>{sc.icon}{m.status}</div>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 700, color: "#10b981" }}>{m.revenue}</td>
                      <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 600, color: "#475569" }}>{m.products}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b" }}>{m.location}</td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, color: "#64748b" }}>Showing <span style={{ fontWeight: 600, color: "#0f172a" }}>{filteredMerchants.length}</span> of <span style={{ fontWeight: 600, color: "#0f172a" }}>856</span></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>Previous</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, background: "#3b82f6", color: "#fff", fontSize: 13, fontWeight: 600, border: "none" }}>1</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600 }}>2</button>
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