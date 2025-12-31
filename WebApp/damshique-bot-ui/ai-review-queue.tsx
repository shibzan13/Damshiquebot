import React, { useState } from "react";
import { CheckSquare, Clock, ThumbsUp, ThumbsDown, AlertCircle, Eye, CheckCircle, XCircle, Filter } from "lucide-react";

export default function AIReviewQueue() {
  const [selectedFilter, setSelectedFilter] = useState("All");

  const stats = [
    { label: "Pending Review", value: "89", icon: <Clock size={20} />, color: "#f59e0b" },
    { label: "Approved Today", value: "234", icon: <CheckCircle size={20} />, color: "#10b981" },
    { label: "Rejected", value: "12", icon: <XCircle size={20} />, color: "#ef4444" },
    { label: "Avg Confidence", value: "92.4%", icon: <AlertCircle size={20} />, color: "#3b82f6" },
  ];

  const queueItems = [
    { id: 1, type: "Invoice", item: "INV-2024-156", action: "Auto-approval request", confidence: 96, aiDecision: "Approve", reason: "All validation checks passed", data: { amount: "$12,450", customer: "TechHub Solutions", dueDate: "Jan 15, 2025" }, priority: "high" },
    { id: 2, type: "Employee", item: "EMP-2024-089", action: "Leave approval", confidence: 88, aiDecision: "Approve", reason: "Within policy limits, manager pre-approved", data: { name: "Sarah Chen", duration: "3 days", dates: "Jan 10-12" }, priority: "medium" },
    { id: 3, type: "Merchant", item: "MCH-2024-234", action: "Contract renewal", confidence: 94, aiDecision: "Approve", reason: "Good payment history, no violations", data: { name: "Fresh Market Co", revenue: "$89K", rating: "4.9" }, priority: "high" },
    { id: 4, type: "Payment", item: "PAY-2024-567", action: "Large transaction", confidence: 72, aiDecision: "Review", reason: "Amount exceeds normal threshold", data: { amount: "$45,000", from: "Global Manufacturing", method: "Wire Transfer" }, priority: "urgent" },
    { id: 5, type: "Refund", item: "REF-2024-089", action: "Refund request", confidence: 85, aiDecision: "Approve", reason: "Within return window, product defect reported", data: { amount: "$2,340", customer: "Urban Fashion Ltd", reason: "Defective item" }, priority: "medium" },
    { id: 6, type: "Access", item: "ACC-2024-123", action: "Permission escalation", confidence: 68, aiDecision: "Review", reason: "Unusual access pattern detected", data: { user: "James Park", role: "Admin Access", department: "Engineering" }, priority: "urgent" },
  ];

  const filters = ["All", "Urgent", "High Priority", "Medium Priority", "Low Priority"];

  const getTypeColor = (type) => {
    const colors = {
      Invoice: "#3b82f6",
      Employee: "#8b5cf6",
      Merchant: "#f59e0b",
      Payment: "#10b981",
      Refund: "#ef4444",
      Access: "#6366f1"
    };
    return colors[type] || "#64748b";
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      urgent: { color: "#ef4444", bg: "#fee2e2", label: "Urgent" },
      high: { color: "#f59e0b", bg: "#fef3c7", label: "High" },
      medium: { color: "#3b82f6", bg: "#dbeafe", label: "Medium" },
      low: { color: "#64748b", bg: "#f1f5f9", label: "Low" }
    };
    return configs[priority] || configs.low;
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 90) return "#10b981";
    if (conf >= 75) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>AI Review Queue</h1>
            <p style={{ fontSize: 15, color: "#64748b" }}>Review and approve AI-suggested actions</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.icon}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, border: "1px solid #e2e8f0", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {filters.map(f => (
            <button key={f} onClick={() => setSelectedFilter(f)} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${selectedFilter === f ? "#3b82f6" : "#e2e8f0"}`, background: selectedFilter === f ? "#eff6ff" : "#fff", color: selectedFilter === f ? "#3b82f6" : "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {queueItems.map(item => {
            const pc = getPriorityConfig(item.priority);
            const typeColor = getTypeColor(item.type);
            return (
              <div key={item.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "start", flex: 1 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: `${typeColor}15`, color: typeColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>
                      {item.type.substring(0, 2)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{item.item}</span>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: `${typeColor}15`, fontSize: 12, fontWeight: 600, color: typeColor }}>{item.type}</div>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: pc.bg, fontSize: 12, fontWeight: 600, color: pc.color }}>{pc.label}</div>
                      </div>
                      <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>{item.action}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ padding: "6px 12px", borderRadius: 8, background: `${getConfidenceColor(item.confidence)}15`, color: getConfidenceColor(item.confidence), fontSize: 14, fontWeight: 700 }}>
                      {item.confidence}% Confidence
                    </div>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 12 }}>AI RECOMMENDATION</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ padding: "6px 12px", borderRadius: 8, background: item.aiDecision === "Approve" ? "#dcfce7" : "#fef3c7", color: item.aiDecision === "Approve" ? "#166534" : "#854d0e", fontSize: 14, fontWeight: 700 }}>
                      {item.aiDecision}
                    </div>
                    <span style={{ fontSize: 14, color: "#475569" }}>{item.reason}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    {Object.entries(item.data).map(([key, value]) => (
                      <div key={key}>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, textTransform: "uppercase" }}>{key}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <ThumbsUp size={18} /> Approve
                  </button>
                  <button style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#ef4444", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <ThumbsDown size={18} /> Reject
                  </button>
                  <button style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Eye size={18} /> Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}