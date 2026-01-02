import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Info, FileText, ExternalLink, Download, PieChart as IconPieChart, TrendingUp, DollarSign, Zap, X, MessageSquare } from "lucide-react";
import { getAdminToken } from "../utils/auth";
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';

interface AdminChatProps {
    initialQuery?: string;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    showButton?: boolean;
}

export default function AdminChat({ initialQuery, isOpen, setIsOpen, showButton = true }: AdminChatProps) {
    const [messages, setMessages] = useState<any[]>([
        { role: "bot", content: "👋 Welcome back, Admin! I'm your Damshique Finance Assistant. I can now visualize your data—try asking 'Show me a pie chart of spend by category'.", timestamp: new Date() }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasInitiated = useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading, isOpen]);

    const lastHandledQuery = useRef<string | null>(null);
    useEffect(() => {
        if (initialQuery && initialQuery !== lastHandledQuery.current) {
            lastHandledQuery.current = initialQuery;
            setIsOpen(true);
            handleSend(initialQuery);
        }
    }, [initialQuery]);

    const handleSend = async (queryOverride?: string) => {
        let userMsg = queryOverride || input.trim();
        // Remove uniqueness suffix if coming from home search
        if (userMsg.includes("||")) userMsg = userMsg.split("||")[0];

        if (!userMsg || loading) return;

        if (!queryOverride) setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg, timestamp: new Date() }]);
        setLoading(true);

        try {
            const response = await fetch("/api/admin/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Token": getAdminToken()
                },
                body: JSON.stringify({
                    query: userMsg,
                    history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
                })
            });

            const data = await response.json();
            setMessages(prev => [...prev, {
                role: "bot",
                content: data.response || "I couldn't find any information on that.",
                results: data.query_results?.results || [],
                summary: data.query_results?.summary || null,
                chart: data.chart,
                intent: data.intent,
                timestamp: new Date()
            }]);
        } catch (err) {
            console.error("Chat failed:", err);
            setMessages(prev => [...prev, { role: "bot", content: "Sorry, I'm having trouble connecting to the database right now.", timestamp: new Date() }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        if (!showButton) return null;
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: "fixed", bottom: 32, right: 32,
                    width: 64, height: 64, borderRadius: "50%",
                    background: "linear-gradient(135deg, #0f172a, #1e293b)",
                    color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 10px 40px rgba(15, 23, 42, 0.4)",
                    zIndex: 9999, border: "none", cursor: "pointer",
                    transition: "transform 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
                <Bot size={32} />
                <div style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, background: "#10b981", borderRadius: "50%", border: "2px solid #fff" }} />
            </button>
        );
    }

    return (
        <>
            {/* Overlay removed to allow interaction with main content */}

            <div style={{
                position: "fixed", top: 0, right: 0,
                width: "100%", maxWidth: 450, height: "100vh",
                background: "#fcfdff", zIndex: 9999,
                boxShadow: "-10px 0 40px rgba(0,0,0,0.1)",
                display: "flex", flexDirection: "column",
                borderLeft: "1px solid #e2e8f0",
                animation: "slideIn 0.3s ease-out"
            }}>
                {/* Chat Header */}
                <div style={{ background: "#ffffff", padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(59,130,246,0.2)" }}>
                            <Bot size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>Finance Assistant</h2>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Online • Admin Mode</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} style={{ padding: 8, borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", color: "#64748b" }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24, background: "#f8fafc" }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: 8 }}>
                            <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 12, width: "100%" }}>
                                {msg.role === "bot" && (
                                    <div style={{ width: 32, height: 32, borderRadius: 10, background: "#ffffff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Bot size={18} color="#3b82f6" />
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: "85%",
                                    padding: "16px 20px",
                                    borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "4px 20px 20px 20px",
                                    background: msg.role === "user" ? "#0f172a" : "#ffffff",
                                    color: msg.role === "user" ? "#ffffff" : "#0f172a",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                    border: msg.role === "bot" ? "1px solid #e2e8f0" : "none",
                                    whiteSpace: "pre-wrap"
                                }}>
                                    {msg.content}
                                    {msg.chart && <ChatChart config={msg.chart} />}
                                </div>
                            </div>

                            {/* Structured Data View */}
                            {msg.role === "bot" && (msg.results?.length > 0 || msg.summary) && (
                                <div style={{ marginLeft: 44, width: "calc(100% - 60px)" }}>
                                    <ResultsStructured items={msg.results} summary={msg.summary} />
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div style={{ display: "flex", gap: 12, paddingLeft: 44 }}>
                            <div style={{ padding: "12px 20px", borderRadius: "4px 20px 20px 20px", background: "#ffffff", border: "1px solid #e2e8f0", color: "#64748b", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                                <Loader2 size={16} className="animate-spin" color="#3b82f6" />
                                Analyzing financial records...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: "20px 24px", background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <input
                                type="text"
                                placeholder="Query invoices, reports..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                style={{
                                    width: "100%",
                                    padding: "14px 20px",
                                    borderRadius: 16,
                                    border: "1px solid #e2e8f0",
                                    fontSize: 14,
                                    outline: "none",
                                    background: "#f8fafc",
                                    fontWeight: 500,
                                    color: "#0f172a"
                                }}
                            />
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 16,
                                background: input.trim() ? "#0f172a" : "#cbd5e1",
                                color: "#ffffff",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: input.trim() ? "pointer" : "default",
                                transition: "all 0.2s"
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
                <style>{`
                    .animate-spin { animation: spin 1s linear infinite; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
                    @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
                `}</style>
            </div>
        </>
    );
}

function ResultsStructured({ items, summary }: { items: any[], summary: any }) {
    if (items && items.length > 0) {
        return (
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 11, fontWeight: 800, color: "#64748b" }}>
                    <TrendingUp size={14} color="#3b82f6" /> {items.length} RESULTS FOUND
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ textAlign: "left", borderBottom: "1px solid #f1f5f9" }}>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Vendor</th>
                                <th style={thStyle}>Amt</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.slice(0, 5).map((row, idx) => {
                                const dateObj = new Date(row.invoice_date);
                                const isValidDate = !isNaN(dateObj.getTime());
                                return (
                                    <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                                        <td style={tdStyle}>{isValidDate ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "Recently"}</td>
                                        <td style={{ ...tdStyle, fontWeight: 600 }}>{row.vendor_name || "General Merchant"}</td>
                                        <td style={tdStyle}>{row.total_amount || 0}</td>
                                        <td style={tdStyle}>
                                            {row.file_url && (
                                                <a
                                                    href={row.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        padding: "4px 10px",
                                                        background: "#3b82f6",
                                                        color: "#fff",
                                                        borderRadius: 6,
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        textDecoration: "none",
                                                        transition: "background 0.2s"
                                                    }}
                                                    onMouseEnter={(e: any) => e.currentTarget.style.background = "#2563eb"}
                                                    onMouseLeave={(e: any) => e.currentTarget.style.background = "#3b82f6"}
                                                >
                                                    <FileText size={12} />
                                                    View
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {items.length > 5 && <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>+ {items.length - 5} more rows</div>}
                </div>
            </div>
        );
    }
    if (summary) {
        return (
            <div style={{ background: "#f0f9ff", padding: 16, borderRadius: 16, border: "1px solid #bae6fd", color: "#0369a1" }}>
                <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>TOTAL SPEND</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{summary.total_amount?.toLocaleString()} {summary.currency || 'AED'}</div>
            </div>
        );
    }
    return null;
}

const thStyle = { padding: "8px 4px", fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" } as any;
const tdStyle = { padding: "8px 4px", fontSize: 12, color: "#475569", fontWeight: 500 } as any;

function ChatChart({ config }: { config: any }) {
    if (!config || !config.data) return null;
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'];

    return (
        <div style={{ marginTop: 16, background: "white", borderRadius: 12, padding: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginBottom: 16, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em" }}>{config.title}</div>
            <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    {config.type === 'pie' ? (
                        <RePieChart>
                            <Pie
                                data={config.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {config.data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <ReTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </RePieChart>
                    ) : (
                        <BarChart data={config.data}>
                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} interval={0} tick={{ fill: '#64748b' }} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} width={35} />
                            <ReTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    )
}
