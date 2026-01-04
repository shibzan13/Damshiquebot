import React, { useState, useEffect } from 'react';
import { Settings, Shield, Plus, Clock, AlertTriangle, CheckCircle, Search, Filter, Layers, CreditCard, RefreshCcw, ArrowRight, UserCheck } from 'lucide-react';
import { getAdminToken } from "../utils/auth";

export default function WorkflowsDashboard() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('rules');
    const [rules, setRules] = useState<any[]>([]);
    const [pos, setPos] = useState<any[]>([]);
    const [recurring, setRecurring] = useState<any[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

    // Form States
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [newRule, setNewRule] = useState({ name: '', priority: 1, approver_role: 'manager', conditions: { min_amount: 0, category: '' } });

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
                fetchData();
            }
        } catch (err) {
            console.error("Rule creation failed:", err);
        }
    };

    return (
        <div style={{ padding: 32, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Workflows & Automation</h1>
                    <p style={{ color: '#64748b', fontSize: 16 }}>Manage approval rules, reconciliation, and recurring billing.</p>
                </div>
                {activeTab === 'rules' && (
                    <button
                        onClick={() => setShowRuleModal(true)}
                        style={{ padding: '12px 24px', borderRadius: 12, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                    >
                        <Plus size={20} /> New Approval Rule
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid #e2e8f0', marginBottom: 32 }}>
                {[
                    { id: 'rules', label: 'Approval Rules', icon: <Shield size={18} /> },
                    { id: 'pos', label: 'Purchase Orders', icon: <Layers size={18} /> },
                    { id: 'recurring', label: 'Recurring Schedules', icon: <RefreshCcw size={18} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '12px 8px', fontSize: 15, fontWeight: 700, border: 'none', background: 'none',
                            color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                            borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'rules' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Active Workflow Rules</h2>
                        <div style={{ display: 'grid', gap: 16 }}>
                            {rules.map((rule, i) => (
                                <div key={i} style={{ padding: 20, background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{rule.name}</span>
                                            <span style={{ padding: '4px 8px', background: '#eff6ff', color: '#3b82f6', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>P{rule.priority}</span>
                                        </div>
                                        <div style={{ fontSize: 13, color: '#64748b' }}>
                                            Route to <span style={{ fontWeight: 700 }}>{rule.approver_role.toUpperCase()}</span> if
                                            {Object.entries(JSON.parse(JSON.stringify(rule.conditions))).map(([key, val]) => (
                                                <span key={key}> {key.replace('_', ' ')} is {String(val)}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button
                                            onClick={() => {
                                                setNewRule({
                                                    name: rule.name,
                                                    priority: rule.priority,
                                                    approver_role: rule.approver_role,
                                                    conditions: JSON.parse(JSON.stringify(rule.conditions))
                                                });
                                                setShowRuleModal(true);
                                            }}
                                            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Clock size={20} color="#f59e0b" /> Pending Approvals
                        </h2>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {pendingApprovals.map((inv, i) => (
                                <div key={i} style={{ padding: 16, background: '#fffbeb', borderRadius: 16, border: '1px solid #fef3c7' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontWeight: 800, fontSize: 14 }}>{inv.vendor_name || 'Generic Invoice'}</span>
                                        <span style={{ fontWeight: 800, color: '#b45309' }}>{inv.total_amount} {inv.currency}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#92400e', marginBottom: 12 }}>Submitted by {inv.user_name}</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Approve</button>
                                        <button style={{ padding: '8px', borderRadius: 8, background: '#fff', color: '#991b1b', border: '1px solid #fecaca', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Reject</button>
                                    </div>
                                </div>
                            ))}
                            {pendingApprovals.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No pending approvals.</p>}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'pos' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Purchase Orders for Reconciliation</h2>
                        <button style={{ padding: '8px 16px', borderRadius: 10, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>+ Add PO</button>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b' }}>PO Number</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b' }}>Vendor</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b' }}>Amount</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b' }}>Status</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b' }}>Date Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pos.map((po, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: 700, color: '#0f172a' }}>{po.po_number}</td>
                                        <td style={{ padding: '16px 24px' }}>{po.vendor_name}</td>
                                        <td style={{ padding: '16px 24px', fontWeight: 700 }}>{po.total_amount} {po.currency}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                                                background: po.status === 'open' ? '#dcfce7' : '#f1f5f9',
                                                color: po.status === 'open' ? '#166534' : '#64748b'
                                            }}>{po.status}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#64748b' }}>{new Date(po.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'recurring' && (
                <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Auto-Invoice Schedules</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                        {recurring.map((sub, i) => (
                            <div key={i} style={{ padding: 24, background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <RefreshCcw size={24} color="#3b82f6" />
                                    </div>
                                    <div style={{ padding: '4px 12px', background: '#dcfce7', color: '#166534', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>ACTIVE</div>
                                </div>
                                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{sub.vendor_name}</h3>
                                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Frequency: <span style={{ fontWeight: 700, color: '#3b82f6' }}>{sub.frequency.toUpperCase()}</span></p>

                                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 16, marginBottom: 20 }}>
                                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Next Billing Date</div>
                                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{new Date(sub.next_billing_date).toLocaleDateString()}</div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 800, fontSize: 18 }}>{sub.amount} {sub.currency}</div>
                                    <button style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Manage</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Rule Creation Modal */}
            {showRuleModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 32, padding: 40, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>New Approval Rule</h2>
                        <p style={{ color: '#64748b', marginBottom: 32 }}>Define when an invoice needs special approval.</p>

                        <div style={{ display: 'grid', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Rule Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. IT Equipment Review"
                                    style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 16 }}
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Priority (1-10)</label>
                                    <input
                                        type="number"
                                        style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 16 }}
                                        value={newRule.priority}
                                        onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Approver Role</label>
                                    <select
                                        style={{ width: '100%', padding: '14px 20px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 16, background: '#fff' }}
                                        value={newRule.approver_role}
                                        onChange={(e) => setNewRule({ ...newRule, approver_role: e.target.value })}
                                    >
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                        <option value="finance">Finance</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 16, textTransform: 'uppercase' }}>Conditions</label>
                                <div style={{ display: 'grid', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 14, color: '#64748b', minWidth: 100 }}>Min Amount:</span>
                                        <input
                                            type="number"
                                            style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                                            value={newRule.conditions.min_amount}
                                            onChange={(e) => setNewRule({ ...newRule, conditions: { ...newRule.conditions, min_amount: parseInt(e.target.value) } })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontSize: 14, color: '#64748b', minWidth: 100 }}>Category:</span>
                                        <input
                                            type="text"
                                            placeholder="e.g. Software"
                                            style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}
                                            value={newRule.conditions.category}
                                            onChange={(e) => setNewRule({ ...newRule, conditions: { ...newRule.conditions, category: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
                            <button
                                onClick={() => setShowRuleModal(false)}
                                style={{ flex: 1, padding: '16px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRule}
                                style={{ flex: 1, padding: '16px', borderRadius: 14, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Create Rule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
