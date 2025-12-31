import React, { useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Users, Package, Download, Calendar, Filter, FileText, PieChart, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function ReportsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("Last 30 Days");
  const [selectedReport, setSelectedReport] = useState("Overview");

  const periods = ["Last 7 Days", "Last 30 Days", "Last 3 Months", "Last 6 Months", "This Year", "Custom"];
  const reportTypes = ["Overview", "Sales", "Revenue", "Customers", "Products", "Performance"];

  const stats = [
    { label: "Total Revenue", value: "$2.4M", change: "+22.5%", trend: "up", icon: <DollarSign size={20} />, color: "#10b981" },
    { label: "Total Orders", value: "15,234", change: "+18.2%", trend: "up", icon: <Package size={20} />, color: "#3b82f6" },
    { label: "New Customers", value: "892", change: "+12.8%", trend: "up", icon: <Users size={20} />, color: "#8b5cf6" },
    { label: "Avg Order Value", value: "$157", change: "-3.2%", trend: "down", icon: <TrendingUp size={20} />, color: "#f59e0b" },
  ];

  const revenueData = [
    { month: "Jan", revenue: 245000, orders: 1234 },
    { month: "Feb", revenue: 198000, orders: 1098 },
    { month: "Mar", revenue: 287000, orders: 1456 },
    { month: "Apr", revenue: 312000, orders: 1589 },
    { month: "May", revenue: 265000, orders: 1367 },
    { month: "Jun", revenue: 298000, orders: 1445 },
  ];

  const topProducts = [
    { name: "Premium Widget Pro", sales: 3421, revenue: "$145,234", growth: "+24%" },
    { name: "Standard Service Pack", sales: 2876, revenue: "$98,456", growth: "+18%" },
    { name: "Elite Subscription", sales: 2134, revenue: "$234,567", growth: "+32%" },
    { name: "Basic Starter Kit", sales: 1987, revenue: "$67,890", growth: "+15%" },
    { name: "Advanced Suite", sales: 1765, revenue: "$189,234", growth: "+28%" },
  ];

  const topCustomers = [
    { name: "TechHub Solutions", orders: 145, revenue: "$234,567", status: "Active" },
    { name: "Global Manufacturing", orders: 123, revenue: "$198,234", status: "Active" },
    { name: "Urban Fashion Ltd", orders: 98, revenue: "$156,789", status: "Active" },
    { name: "Elite Services Group", orders: 87, revenue: "$145,234", status: "Active" },
    { name: "Digital Solutions Pro", orders: 76, revenue: "$134,567", status: "Active" },
  ];

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Reports</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Analytics and insights for your business</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#fff" }}>
                {periods.map(p => <option key={p}>{p}</option>)}
              </select>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <Download size={18} /> Export Report
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.icon}</div>
                  <div style={{ padding: "4px 12px", borderRadius: 20, background: stat.trend === "up" ? "#dcfce7" : "#fee2e2", color: stat.trend === "up" ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    {stat.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
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
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 24 }}>
          {/* Revenue Chart */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Revenue Trend</h2>
                <p style={{ fontSize: 14, color: "#64748b" }}>Monthly revenue over time</p>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: "#3b82f6" }} />
                  <span style={{ fontSize: 13, color: "#64748b" }}>Revenue</span>
                </div>
              </div>
            </div>
            <div style={{ height: 280 }}>
              {revenueData.map((data, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 20 }}>
                  <div style={{ width: 60, fontSize: 13, fontWeight: 600, color: "#64748b" }}>{data.month}</div>
                  <div style={{ flex: 1, position: "relative" }}>
                    <div style={{ height: 40, background: "#eff6ff", borderRadius: 8, position: "relative", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(data.revenue / maxRevenue) * 100}%`, background: "linear-gradient(90deg, #3b82f6, #2563eb)", borderRadius: 8, display: "flex", alignItems: "center", paddingLeft: 12, transition: "width 0.5s ease" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>${(data.revenue / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ width: 80, fontSize: 12, color: "#64748b", textAlign: "right" }}>{data.orders} orders</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", borderRadius: 16, padding: 24, color: "#fff" }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Total Sales</div>
              <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>$2.4M</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600 }}>
                <ArrowUpRight size={16} />
                <span>+22.5% vs last period</span>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Distribution</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Products", value: 45, color: "#3b82f6" },
                  { label: "Services", value: 30, color: "#8b5cf6" },
                  { label: "Subscriptions", value: 25, color: "#10b981" }
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: "#64748b", fontWeight: 500 }}>{item.label}</span>
                      <span style={{ color: "#0f172a", fontWeight: 700 }}>{item.value}%</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${item.value}%`, background: item.color, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Top Products */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Top Products</h2>
              <button style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View All</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topProducts.map((product, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#f8fafc", borderRadius: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{product.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{product.sales} sales</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{product.revenue}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>{product.growth}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Top Customers</h2>
              <button style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View All</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topCustomers.map((customer, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#f8fafc", borderRadius: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>{customer.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{customer.orders} orders</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{customer.revenue}</div>
                    <div style={{ padding: "2px 8px", borderRadius: 6, background: "#dcfce7", fontSize: 11, fontWeight: 600, color: "#166534", display: "inline-block" }}>{customer.status}</div>
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