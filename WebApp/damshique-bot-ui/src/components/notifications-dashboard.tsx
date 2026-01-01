import React, { useState, useEffect } from "react";
import { Bell, Info, AlertTriangle, CheckCircle, Clock, ExternalLink, Download } from "lucide-react";

const ADMIN_TOKEN = "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7";

export default function NotificationsDashboard() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = () => {
        setLoading(true);
        fetch("/api/admin/notifications", {
            headers: { 'X-API-Token': ADMIN_TOKEN }
        })
            .then(r => r.json())
            .then(data => {
                setNotifications(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

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
        <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 32px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>System Notifications</h1>
                        <p style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>Real-time alerts from the AI extraction engine and user requests.</p>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                            onClick={() => window.open(`/api/admin/export-notifications?token=${ADMIN_TOKEN}`, '_blank')}
                            style={{ padding: "12px 24px", borderRadius: 12, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                        >
                            <Download size={18} /> Export Logs
                        </button>
                        <button onClick={fetchNotifications} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                            Refresh List
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>Syncing with system events...</div>
                ) : !Array.isArray(notifications) || notifications.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 24, border: "1px solid #e2e8f0" }}>
                        <Bell size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>No notifications yet</div>
                        <p style={{ color: "#64748b", marginTop: 4 }}>System events will appear here as they occur.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {notifications.map(n => (
                            <div key={n.event_id} style={{
                                background: "white",
                                padding: 28,
                                borderRadius: 24,
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                gap: 24,
                                position: "relative",
                                transition: "all 0.2s"
                            }}>
                                {!n.is_delivered && <div style={{ position: "absolute", top: 28, right: 28, width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />}
                                <div style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 16,
                                    background: n.event_type === 'error' ? '#fee2e2' : n.event_type?.includes('approve') ? '#dcfce7' : '#f0f9ff',
                                    color: n.event_type === 'error' ? '#ef4444' : n.event_type?.includes('approve') ? '#166534' : '#3b82f6',
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0
                                }}>
                                    {n.event_type === 'error' ? <AlertTriangle size={24} /> : <Info size={24} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", textTransform: "capitalize" }}>
                                            {n.event_type.replace('_', ' ')}
                                        </div>
                                        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                            <Clock size={14} /> {getTimeAgo(n.created_at)}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 15, color: "#475569", fontWeight: 500, lineHeight: 1.6, marginBottom: 16 }}>{n.message}</div>

                                    {n.payload && (
                                        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#64748b", fontFamily: "monospace" }}>
                                            {JSON.stringify(n.payload).slice(0, 100)}...
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
