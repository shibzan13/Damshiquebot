import React, { useState, useEffect } from 'react';
import { Settings, Shield, Plus, Clock, AlertTriangle, CheckCircle, Search, Filter, Layers, CreditCard, RefreshCcw, ArrowRight, UserCheck, Trash2, Edit3, Briefcase, ChevronRight, X } from 'lucide-react';
import { getAdminToken } from "../utils/auth";

export default function WorkflowsDashboard() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('rules');
    const [rules, setRules] = useState<any[]>([]);
    const [pos, setPos] = useState<any[]>([]);
    const [recurring, setRecurring] = useState<any[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

    // Modal States
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [showPOModal, setShowPOModal] = useState(false);

    const [newRule, setNewRule] = useState<any>({ name: '', priority: 1, approver_role: 'manager', conditions: { min_amount: 0, category: '' } });
    const [newPO, setNewPO] = useState({ po_number: '', vendor_name: '', total_amount: 0, description: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        const token = getAdminToken();
        const headers = { 'X-API-Token': token };

        try {
            if (activeTab === 'rules') {
                const res = await fetch('/api/automation/rules', { headers });
                setRules(await res.json());
                const pen = await fetch('/api/automation/pending-approvals', { headers });
                setPendingApprovals(await pen.json());
            } else if (activeTab === 'pos') {
                const res = await fetch('/api/automation/purchase-orders', { headers });
                setPos(await res.json());
            } else if (activeTab === 'recurring') {
                const res = await fetch('/api/automation/recurring', { headers });
                setRecurring(await res.json());
            }
        } catch (err) {
            console.error("Failed to fetch automation data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async () => {
        try {
            const res = await fetch('/api/automation/rules', {
                method: 'POST',
                headers: { 'X-API-Token': getAdminToken(), 'Content-Type': 'application/json' },
                body: JSON.stringify(newRule)
            });
            if (res.ok) {
                setShowRuleModal(false);
                setNewRule({ name: '', priority: 1, approver_role: 'manager', conditions: { min_amount: 0, category: '' } });
                fetchData();
            }
        } catch (err) {
            console.error("Rule creation failed:", err);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;
        try {
            await fetch(`/api/automation/rules/${ruleId}`, {
                method: 'DELETE',
                headers: { 'X-API-Token': getAdminToken() }
            });
            fetchData();
        } catch (err) {
            console.error("Deletion failed:", err);
        }
    };

    const handleCreatePO = async () => {
        try {
            const res = await fetch('/api/automation/purchase-orders', {
                method: 'POST',
                headers: { 'X-API-Token': getAdminToken(), 'Content-Type': 'application/json' },
                body: JSON.stringify(newPO)
            });
            if (res.ok) {
                setShowPOModal(false);
                setNewPO({ po_number: '', vendor_name: '', total_amount: 0, description: '' });
                fetchData();
            }
        } catch (err) {
            console.error("PO creation failed:", err);
        }
    };

    const handleDeletePO = async (poId: string) => {
        if (!confirm("Are you sure you want to delete this Purchase Order?")) return;
        try {
            await fetch(`/api/automation/purchase-orders/${poId}`, {
                method: 'DELETE',
                headers: { 'X-API-Token': getAdminToken() }
            });
            fetchData();
        } catch (err) {
            console.error("PO deletion failed:", err);
        }
    };

    return (
        <div style={{ padding: "40px", maxWidth: 1400, margin: "0 auto", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <div>
                    <h1 style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: "-0.02em" }}>Business Automation</h1>
                    <p style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>Smart routing, approval workflows, and expenditure controls.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {activeTab === 'rules' && (
                        <button
                            onClick={() => setShowRuleModal(true)}
                            style={{ padding: '14px 28px', borderRadius: 16, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                        >
                            <Plus size={20} /> New Approval Rule
                        </button>
                    )}
                    {activeTab === 'pos' && (
                        <button
                            onClick={() => setShowPOModal(true)}
                            style={{ padding: '14px 28px', borderRadius: 16, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                        >
                            <Plus size={20} /> Create PO
                        </button>
                    )}
                </div>
            </div>

            {/* Premium Tabs */}
            <div style={{ display: 'flex', gap: 8, background: "#fff", padding: "6px", borderRadius: 20, border: "1px solid #e2e8f0", width: "fit-content", marginBottom: 40 }}>
                {[
                    { id: 'rules', label: 'Approval Rules', icon: <Shield size={18} /> },
                    { id: 'pos', label: 'Purchase Orders', icon: <Briefcase size={18} /> },
                    { id: 'recurring', label: 'Recurring Billing', icon: <RefreshCcw size={18} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 24px', fontSize: 14, fontWeight: 700, border: 'none',
                            background: activeTab === tab.id ? '#f1f5f9' : 'transparent',
                            color: activeTab === tab.id ? '#0f172a' : '#64748b',
                            borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'rules' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 40 }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Active Control Rules</h2>
                            <span style={{ padding: "6px 14px", background: "#dcfce7", color: "#166534", borderRadius: 10, fontSize: 12, fontWeight: 800 }}>{rules.length} LIVE</span>
                        </div>
                        <div style={{ display: 'grid', gap: 20 }}>
                            {rules.map((rule, i) => (
                                <div key={i} className="rule-card" style={{ padding: 28, background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: "all 0.3s ease", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                                        <div style={{ width: 56, height: 56, borderRadius: 16, background: i % 2 === 0 ? "#eff6ff" : "#f5f3ff", color: i % 2 === 0 ? "#3b82f6" : "#8b5cf6", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Shield size={28} />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 18 }}>{rule.name}</span>
                                                <span style={{ padding: '4px 8px', background: '#f1f5f9', color: '#475569', borderRadius: 8, fontSize: 11, fontWeight: 800 }}>PRIORITY {rule.priority}</span>
                                            </div>
                                            <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>
                                                Check <span style={{ fontWeight: 700, color: "#0f172a" }}>{rule.approver_role.toUpperCase()}</span> if
                                                {(() => {
                                                    let conds = rule.conditions;
                                                    if (typeof conds === 'string') {
                                                        try { conds = JSON.parse(conds); } catch (e) { conds = {}; }
                                                    }
                                                    return Object.entries(conds || {}).map(([key, val]: any, idx) => (
                                                        <span key={key}>{idx > 0 ? " & " : ""} <span style={{ color: "#3b82f6", fontWeight: 700 }}>{key.replace('_', ' ')}</span> is <span style={{ color: "#0f172a", fontWeight: 700 }}>{val}</span></span>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button
                                            onClick={() => {
                                                setNewRule({
                                                    rule_id: rule.rule_id,
                                                    name: rule.name,
                                                    priority: rule.priority,
                                                    approver_role: rule.approver_role,
                                                    conditions: { ...rule.conditions }
                                                });
                                                setShowRuleModal(true);
                                            }}
                                            style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Edit3 size={18} color="#64748b" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRule(rule.rule_id)}
                                            style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #fee2e2', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} color="#ef4444" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {rules.length === 0 && !loading && (
                                <div style={{ padding: 60, textAlign: "center", background: "#ffffff", borderRadius: 24, border: "2px dashed #e2e8f0" }}>
                                    <Shield size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>No Automation Rules Yet</h3>
                                    <p style={{ color: "#64748b", maxWidth: 400, margin: "0 auto" }}>Define your first approval rule to start automating your invoice workflows.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div style={{ background: 'linear-gradient(135deg, #6366f1, #4338ca)', borderRadius: 32, padding: 32, color: "#fff", marginBottom: 32, boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.2)" }}>
                            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Clock size={24} color="#fff" /> Pending Reviews
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 24, fontWeight: 500 }}>Invoices awaiting your confirmation.</p>
                            <div style={{ display: 'grid', gap: 16 }}>
                                {pendingApprovals.map((inv, i) => (
                                    <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.1)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: "blur(4px)" }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{inv.vendor_name || 'Vendor Extraction...'}</div>
                                                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>By {inv.user_name}</div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div style={{ fontWeight: 800 }}>{inv.total_amount} {inv.currency}</div>
                                                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Rule Hit</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button style={{ flex: 1, padding: '10px', borderRadius: 12, background: '#fff', color: '#4338ca', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Approve</button>
                                            <button style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reject</button>
                                        </div>
                                    </div>
                                ))}
                                {pendingApprovals.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: "20px 0", fontStyle: "italic" }}>
                                        No pending reviews at the moment.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'pos' && (
                <div style={{ background: '#fff', borderRadius: 32, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04)" }}>
                    <div style={{ padding: "30px 40px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Active Purchase Orders</h2>
                        <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ position: "relative" }}>
                                <Search size={18} color="#94a3b8" style={{ position: "absolute", left: 14, top: 12 }} />
                                <input placeholder="Search POs..." style={{ padding: "10px 16px 10px 42px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, width: 240 }} />
                            </div>
                        </div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '20px 40px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#64748b' }}>PO NUMBER</th>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#64748b' }}>VENDOR</th>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#64748b' }}>ALLOCATED</th>
                                <th style={{ padding: '20px 24px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#64748b' }}>STATUS</th>
                                <th style={{ padding: '20px 40px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#64748b' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pos.map((po, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '20px 40px', fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{po.po_number}</td>
                                    <td style={{ padding: '20px 24px', color: "#475569", fontWeight: 600 }}>{po.vendor_name || "Any Vendor"}</td>
                                    <td style={{ padding: '20px 24px', fontWeight: 800 }}>{po.total_amount.toLocaleString()} {po.currency}</td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span style={{
                                            padding: '6px 14px', borderRadius: 10, fontSize: 11, fontWeight: 800,
                                            background: po.status === 'open' ? '#dcfce7' : '#f1f5f9',
                                            color: po.status === 'open' ? '#166534' : '#64748b', textTransform: "uppercase"
                                        }}>{po.status}</span>
                                    </td>
                                    <td style={{ padding: '20px 40px', textAlign: 'right' }}>
                                        <button onClick={() => handleDeletePO(po.po_id)} style={{ padding: 8, borderRadius: 8, border: "none", background: "#fff", cursor: "pointer" }}>
                                            <Trash2 size={18} color="#ef4444" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pos.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: 60, textAlign: "center", color: "#64748b" }}>No Purchase Orders found. Click "Create PO" to start.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'recurring' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                    {recurring.map((sub, i) => (
                        <div key={i} style={{ padding: 32, background: '#fff', borderRadius: 32, border: '1px solid #e2e8f0', position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: "#3b82f6" }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <RefreshCcw size={28} color="#3b82f6" />
                                </div>
                                <div style={{ padding: '6px 14px', background: '#dcfce7', color: '#166534', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>AUTOPILOT</div>
                            </div>
                            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{sub.vendor_name}</h3>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: '#64748b', fontSize: 14, fontWeight: 600, marginBottom: 24 }}>
                                <Clock size={14} /> Billed {sub.frequency}
                            </div>

                            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: 20, marginBottom: 24 }}>
                                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.5px" }}>Next Scheduled Payment</div>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 18 }}>{new Date(sub.next_billing_date).toLocaleDateString()}</div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 800, fontSize: 22, color: "#0f172a" }}>{sub.amount.toLocaleString()} <span style={{ fontSize: 14 }}>{sub.currency}</span></div>
                                <button style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Manage</button>
                            </div>
                        </div>
                    ))}
                    {recurring.length === 0 && (
                        <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", background: "#fff", borderRadius: 32, border: "2px dashed #e2e8f0" }}>
                            <RefreshCcw size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>No recurring schedules yet.</h3>
                        </div>
                    )}
                </div>
            )}

            {/* Rule Modal */}
            {showRuleModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: 540, borderRadius: 36, padding: 48, boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)', position: "relative" }}>
                        <button onClick={() => setShowRuleModal(false)} style={{ position: "absolute", top: 32, right: 32, background: "#f1f5f9", border: "none", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
                        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: "-0.02em" }}>{newRule.rule_id ? "Update Rule" : "Create Control Rule"}</h2>
                        <p style={{ color: '#64748b', marginBottom: 40, fontWeight: 500 }}>Control exactly when an invoice needs manual review.</p>

                        <div style={{ display: 'grid', gap: 24 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#475569', marginBottom: 10 }}>RULE NAME</label>
                                <input type="text" placeholder="e.g. IT Procurement Review" style={{ width: '100%', padding: '16px 24px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 16, fontWeight: 500 }} value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#475569', marginBottom: 10 }}>PRIORITY (1-10)</label>
                                    <input type="number" style={{ width: '100%', padding: '16px 24px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 16, fontWeight: 500 }} value={newRule.priority} onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#475569', marginBottom: 10 }}>TARGET APPROVER</label>
                                    <select style={{ width: '100%', padding: '16px 24px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 16, fontWeight: 600, background: '#fff' }} value={newRule.approver_role} onChange={(e) => setNewRule({ ...newRule, approver_role: e.target.value })}>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                        <option value="finance">Finance Team</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ padding: 28, background: '#f8fafc', borderRadius: 24, border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 20, textTransform: 'uppercase', letterSpacing: "1px" }}>Activation Criteria</label>
                                <div style={{ display: 'grid', gap: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 120, fontSize: 14, fontWeight: 700, color: '#475569' }}>If Amount Over</div>
                                        <input type="number" style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700 }} value={newRule.conditions.min_amount} onChange={(e) => setNewRule({ ...newRule, conditions: { ...newRule.conditions, min_amount: parseInt(e.target.value) } })} />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 120, fontSize: 14, fontWeight: 700, color: '#475569' }}>Or Category is</div>
                                        <input type="text" placeholder="e.g. Travel" style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: '1px solid #e2e8f0', fontWeight: 700 }} value={newRule.conditions.category} onChange={(e) => setNewRule({ ...newRule, conditions: { ...newRule.conditions, category: e.target.value } })} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, marginTop: 44 }}>
                            <button onClick={() => setShowRuleModal(false)} style={{ flex: 1, padding: '18px', borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateRule} style={{ flex: 1, padding: '18px', borderRadius: 18, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: "0 10px 20px rgba(59, 130, 246, 0.2)" }}>{newRule.rule_id ? "Save Changes" : "Create Workflow"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PO Modal */}
            {showPOModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: 540, borderRadius: 36, padding: 48, boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)', position: "relative" }}>
                        <button onClick={() => setShowPOModal(false)} style={{ position: "absolute", top: 32, right: 32, background: "#f1f5f9", border: "none", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>
                        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: "-0.02em" }}>Register Purchase Order</h2>
                        <p style={{ color: '#64748b', marginBottom: 40, fontWeight: 500 }}>Create a PO to automatically reconcile incoming invoices.</p>

                        <div style={{ display: 'grid', gap: 24 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>PO NUMBER (UNIQUE)</label>
                                <input type="text" placeholder="PO-2024-001" style={{ width: '100%', padding: '16px 24px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 16, fontWeight: 700 }} value={newPO.po_number} onChange={(e) => setNewPO({ ...newPO, po_number: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>ALLOCATED VENDOR (OPTIONAL)</label>
                                <input type="text" placeholder="e.g. AWS Middle East" style={{ width: '100%', padding: '16px 24px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 16, fontWeight: 600 }} value={newPO.vendor_name} onChange={(e) => setNewPO({ ...newPO, vendor_name: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>TOTAL AUTHORIZED AMOUNT (AED)</label>
                                <input type="number" placeholder="5000" style={{ width: '100%', padding: '16px 24px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 24, fontWeight: 800 }} value={newPO.total_amount} onChange={(e) => setNewPO({ ...newPO, total_amount: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#475569', marginBottom: 10 }}>DESCRIPTION / PROJECT</label>
                                <textarea placeholder="Describe the purpose..." style={{ width: '100%', padding: '16px 24px', borderRadius: 16, border: '1px solid #e2e8f0', fontSize: 15, fontWeight: 500, height: 100, resize: "none" }} value={newPO.description} onChange={(e) => setNewPO({ ...newPO, description: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, marginTop: 44 }}>
                            <button onClick={() => setShowPOModal(false)} style={{ flex: 1, padding: '18px', borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreatePO} style={{ flex: 1, padding: '18px', borderRadius: 18, border: 'none', background: '#0f172a', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Save PO Record</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .rule-card:hover { transform: translateY(-4px); border-color: #3b82f6 !important; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1) !important; }
            `}</style>
        </div>
    );
}
