import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, DollarSign, Users, Package, Download, Calendar, Filter, FileText, PieChart, Activity, ArrowUpRight, ArrowDownRight, User } from "lucide-react";

const ADMIN_TOKEN = "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7";

export default function ReportsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("Last 6 Months");

  const periods = ["Last 7 Days", "Last 30 Days", "Last 3 Months", "Last 6 Months", "This Year", "Custom"];

  useEffect(() => {
    fetch("/api/admin/reports", {
      headers: { 'X-API-Token': ADMIN_TOKEN }
    })
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => console.error("Failed to fetch reports:", err));
  }, []);

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading financial analytics...</div>;
  }

  const { stats: resStats, revenueData, distribution, topProducts, topCustomers } = data;

  const displayStats = [
    { label: "Total Approved Spend", value: `${(resStats?.total_spend || 0).toLocaleString()} AED`, change: "+12.5%", trend: "up", icon: <DollarSign size={20} />, color: "#10b981" },
    { label: "Processed Invoices", value: (resStats?.total_invoices || 0).toString(), change: "+8.2%", trend: "up", icon: <Package size={20} />, color: "#3b82f6" },
    { label: "Active Employees", value: (resStats?.user_count || 0).toString(), change: "+2.8%", trend: "up", icon: <Users size={20} />, color: "#8b5cf6" },
    { label: "Avg Invoice Value", value: `${(resStats?.avg_invoice || 0).toFixed(2)} AED`, change: "-1.2%", trend: "down", icon: <TrendingUp size={20} />, color: "#f59e0b" },
  ];

  const safeRevenueData = Array.isArray(revenueData) ? revenueData : [];
  const maxRevenue = safeRevenueData.length > 0 ? Math.max(...safeRevenueData.map((d: any) => d.revenue || 0), 1) : 1;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Financial Reports</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Live analytics and spending insights from the database</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#fff" }}>
                {periods.map(p => <option key={p}>{p}</option>)}
              </select>
              <button
                onClick={() => window.open(`/api/admin/export-advanced-report?token=${ADMIN_TOKEN}`, '_blank')}
                style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                <Download size={18} /> Export Full Report
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {displayStats.map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.icon}</div>
                  <div style={{ padding: "4px 12px", borderRadius: 20, background: stat.trend === "up" ? "#dcfce7" : "#fee2e2", color: stat.trend === "up" ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {stat.change}
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Revenue Chart */}
          <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Spending Trend</h2>
                <p style={{ fontSize: 14, color: "#64748b" }}>Monthly expenditure across the company</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {safeRevenueData.map((data: any, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ width: 60, fontSize: 13, fontWeight: 800, color: "#64748b" }}>{data.month}</div>
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ height: 44, background: "#f8fafc", borderRadius: 12, position: "relative", overflow: "hidden", border: "1px solid #f1f5f9" }}>
                      <div style={{ height: "100%", width: `${(data.revenue / maxRevenue) * 100}%`, background: "linear-gradient(90deg, #3b82f6, #2563eb)", borderRadius: 10, display: "flex", alignItems: "center", paddingLeft: 16, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{data.revenue.toLocaleString()} AED</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ width: 100, fontSize: 12, color: "#64748b", fontWeight: 600, textAlign: "right" }}>{data.orders} invoices</div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "linear-gradient(135deg, #0f172a, #334155)", borderRadius: 24, padding: 32, color: "#fff" }}>
              <div style={{ fontSize: 14, opacity: 0.8, fontWeight: 500, marginBottom: 8 }}>Total Approved Expenditure</div>
              <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>{resStats.total_spend.toLocaleString()} <span style={{ fontSize: 16, opacity: 0.6 }}>AED</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(255,255,255,0.1)", borderRadius: 12, width: "fit-content" }}>
                <TrendingUp size={16} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>Up 12.5% vs last month</span>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: 32 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>Cost Center Distribution</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {distribution.map((item: any, i: number) => {
                  const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                        <span style={{ color: "#475569", fontWeight: 700 }}>{item.label}</span>
                        <span style={{ color: "#0f172a", fontWeight: 800 }}>{parseFloat(item.value).toFixed(1)}%</span>
                      </div>
                      <div style={{ height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.value}%`, background: colors[i % colors.length], borderRadius: 5 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Top Vendors */}
          <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Top Merchants</h2>
              <Download size={18} color="#94a3b8" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topProducts.map((vendor: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#f8fafc", borderRadius: 16, border: "1px solid #f1f5f9" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{vendor.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{vendor.sales} transacations</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#3b82f6", marginBottom: 2 }}>{parseFloat(vendor.revenue).toLocaleString()} <span style={{ fontSize: 10 }}>AED</span></div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>Top Vendor</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers (Employees) */}
          <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Spend by Employee</h2>
              <Users size={18} color="#94a3b8" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topCustomers.map((user: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#f8fafc", borderRadius: 16, border: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><User size={18} /></div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{user.orders} invoices</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{parseFloat(user.revenue).toLocaleString()} <span style={{ fontSize: 10 }}>AED</span></div>
                    <div style={{ padding: "4px 10px", borderRadius: 8, background: "#eff6ff", fontSize: 11, fontWeight: 700, color: "#3b82f6", display: "inline-block" }}>Elite User</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}