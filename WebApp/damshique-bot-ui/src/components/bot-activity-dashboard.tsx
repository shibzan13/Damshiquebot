import React, { useState, useEffect } from "react";
import { Bot, Activity, CheckCircle, XCircle, Clock, TrendingUp, MessageSquare, Zap, Users, Target, Download } from "lucide-react";

const ADMIN_TOKEN = "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7";

export default function BotActivityDashboard() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/bot-activity", {
      headers: { 'X-API-Token': ADMIN_TOKEN }
    })
      .then(r => r.json())
      .then(data => {
        setActivities(data);
        setLoading(false);
      })
      .catch(err => console.error("Failed to fetch bot activity:", err));
  }, []);

  const stats = [
    { label: "Total Queries", value: Array.isArray(activities) ? activities.length.toString() : "0", change: "+24%", icon: <MessageSquare size={20} />, color: "#3b82f6" },
    { label: "Success Rate", value: "98.2%", change: "+1.2%", icon: <CheckCircle size={20} />, color: "#10b981" },
    { label: "Avg Response Time", value: "0.8s", change: "-12%", icon: <Zap size={20} />, color: "#8b5cf6" },
    { label: "Active Channels", value: "2", change: "None", icon: <Target size={20} />, color: "#f59e0b" },
  ];

  const getStatusConfig = (status: string) => {
    return { color: "#10b981", bg: "#dcfce7", icon: <CheckCircle size={14} />, label: "Success" };
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Bot Activity</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Monitor AI assistant performance and live interactions</p>
            </div>
            <button
              onClick={() => window.open(`/api/admin/export-bot-activity?token=${ADMIN_TOKEN}`, '_blank')}
              style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Download size={18} /> Export Activity
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.icon}</div>
                  <div style={{ padding: "4px 12px", borderRadius: 20, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 600 }}>{stat.change}</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>Live Interactions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading bot history...</div>
              ) : !Array.isArray(activities) || activities.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>No interactions logged yet.</div>
              ) : activities.map(activity => {
                const sc = getStatusConfig("success");
                return (
                  <div key={activity.interaction_id} style={{ padding: 20, background: "#f8fafc", borderRadius: 20, border: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}><Users size={16} /></div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{activity.user_name || activity.user_id}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{getTimeAgo(activity.created_at)} • via {activity.channel}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ padding: "6px 12px", borderRadius: 8, background: sc.bg, fontSize: 11, fontWeight: 700, color: sc.color, display: "flex", alignItems: "center", gap: 4 }}>
                          {sc.icon}
                          {sc.label}
                        </div>
                        <div style={{ padding: "6px 12px", borderRadius: 8, background: "#fff", border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                          {activity.intent}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ fontSize: 14, color: "#475569", fontWeight: 600, paddingLeft: 12, borderLeft: "3px solid #e2e8f0" }}>
                        {activity.query}
                      </div>
                      <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 500, padding: 20, background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", lineHeight: 1.6 }}>
                        <Bot size={16} color="#3b82f6" style={{ marginBottom: 4, display: "block" }} />
                        {activity.response}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ background: "#fff", borderRadius: 24, border: "1px solid #e2e8f0", padding: 32, marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>Top Intent Types</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {[
                  { label: "Invoice Search", count: 42, percentage: 45 },
                  { label: "Expense Summary", count: 28, percentage: 30 },
                  { label: "Status Queries", count: 18, percentage: 20 },
                  { label: "Export Requests", count: 12, percentage: 5 },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{item.count}</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${item.percentage}%`, background: "linear-gradient(90deg, #3b82f6, #2563eb)", borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", borderRadius: 24, padding: 32, color: "#fff", boxShadow: "0 20px 40px rgba(59, 130, 246, 0.2)" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <Bot size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>AI Intelligence</h3>
              <p style={{ fontSize: 15, opacity: 0.9, marginBottom: 24, lineHeight: 1.5 }}>Damshique AI is currently processing queries from both WhatsApp and Web portals with sub-second latency.</p>
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>98%</div>
                  <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 600 }}>Accuracy</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>800ms</div>
                  <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 600 }}>Latency</div>
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