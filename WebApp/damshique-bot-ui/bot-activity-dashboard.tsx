import React, { useState } from "react";
import { Bot, Activity, CheckCircle, XCircle, Clock, TrendingUp, MessageSquare, Zap, Users, Target } from "lucide-react";

export default function BotActivityDashboard() {
  const stats = [
    { label: "Total Queries", value: "5,678", change: "+24%", icon: <MessageSquare size={20} />, color: "#3b82f6" },
    { label: "Success Rate", value: "94.2%", change: "+3.2%", icon: <CheckCircle size={20} />, color: "#10b981" },
    { label: "Avg Response Time", value: "1.2s", change: "-12%", icon: <Zap size={20} />, color: "#8b5cf6" },
    { label: "Active Users", value: "1,234", change: "+18%", icon: <Users size={20} />, color: "#f59e0b" },
  ];

  const recentActivities = [
    { id: 1, user: "Sarah Chen", query: "What's the status of invoice INV-2024-001?", response: "Invoice INV-2024-001 is paid. Payment received on Dec 10, 2024.", status: "success", time: "2 mins ago", confidence: 98 },
    { id: 2, user: "Marcus Rodriguez", query: "Show me all pending merchants", response: "Found 47 pending merchants. Would you like to review them?", status: "success", time: "5 mins ago", confidence: 95 },
    { id: 3, user: "Emily Watson", query: "Generate Q4 sales report", response: "I'm generating the Q4 sales report. This may take a few moments.", status: "processing", time: "8 mins ago", confidence: 92 },
    { id: 4, user: "James Park", query: "Update employee record for John Doe", response: "I don't have permission to update employee records. Please contact HR.", status: "failed", time: "12 mins ago", confidence: 88 },
    { id: 5, user: "Lisa Anderson", query: "What's the total revenue this month?", response: "Total revenue for December 2024 is $2.4M, up 22% from last month.", status: "success", time: "15 mins ago", confidence: 99 },
    { id: 6, user: "David Kim", query: "Find overdue invoices", response: "Found 23 overdue invoices totaling $87,340. Top 3: INV-2024-004...", status: "success", time: "18 mins ago", confidence: 96 },
  ];

  const topQueries = [
    { query: "Invoice status lookup", count: 1234, percentage: 22 },
    { query: "Employee information", count: 987, percentage: 18 },
    { query: "Revenue reports", count: 856, percentage: 15 },
    { query: "Merchant details", count: 743, percentage: 13 },
    { query: "Payment tracking", count: 621, percentage: 11 },
  ];

  const getStatusConfig = (status) => {
    const configs = {
      success: { color: "#10b981", bg: "#dcfce7", icon: <CheckCircle size={14} />, label: "Success" },
      processing: { color: "#f59e0b", bg: "#fef3c7", icon: <Clock size={14} />, label: "Processing" },
      failed: { color: "#ef4444", bg: "#fee2e2", icon: <XCircle size={14} />, label: "Failed" }
    };
    return configs[status];
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Bot Activity</h1>
            <p style={{ fontSize: 15, color: "#64748b" }}>Monitor AI assistant performance and interactions</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.icon}</div>
                  <div style={{ padding: "4px 12px", borderRadius: 20, background: stat.change.startsWith("+") || stat.change.startsWith("-") && stat.label === "Avg Response Time" ? "#dcfce7" : "#fee2e2", color: stat.change.startsWith("+") || stat.change.startsWith("-") && stat.label === "Avg Response Time" ? "#166534" : "#991b1b", fontSize: 12, fontWeight: 600 }}>{stat.change}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Recent Activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {recentActivities.map(activity => {
                const sc = getStatusConfig(activity.status);
                return (
                  <div key={activity.id} style={{ padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{activity.user}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{activity.time}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: sc.bg, fontSize: 12, fontWeight: 600, color: sc.color, display: "flex", alignItems: "center", gap: 4 }}>
                          {sc.icon}
                          {sc.label}
                        </div>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: "#f1f5f9", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                          {activity.confidence}%
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 13, color: "#475569", marginBottom: 6, fontWeight: 500 }}>
                        <span style={{ color: "#64748b" }}>Q:</span> {activity.query}
                      </div>
                      <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 500, padding: 12, background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        <span style={{ color: "#3b82f6" }}>A:</span> {activity.response}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Top Queries</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {topQueries.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{item.query}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.count}</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${item.percentage}%`, background: "linear-gradient(90deg, #3b82f6, #2563eb)", borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", borderRadius: 16, padding: 24, color: "#fff" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Bot size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>AI Performance</h3>
              <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 16 }}>Bot is operating at peak efficiency with 94.2% success rate</p>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>5.7K</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Queries Today</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>1.2s</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Avg Response</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}