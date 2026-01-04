import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, AlertTriangle, Download, Calendar, Filter, PieChart as PieIcon, BarChart as BarIcon, RefreshCw, Layers, ArrowUpRight, Clock } from 'lucide-react';
import { SpendTrendChart, CategoryPieChart, MerchantBarChart, BudgetBarChart, TrendStatCard, ChartSkeleton } from './ChartComponents';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import { getAdminToken } from "../utils/auth";

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [merchantData, setMerchantData] = useState<any[]>([]);
    const [budgetData, setBudgetData] = useState<any[]>([]);
    const [topExpenses, setTopExpenses] = useState<any[]>([]);
    const [recurringCosts, setRecurringCosts] = useState<any[]>([]);
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [predictive, setPredictive] = useState<any>(null);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000),
        end: new Date()
    });

    const [period, setPeriod] = useState('6months');
    const [interval, setInterval] = useState('month'); // week, month, quarter

    useEffect(() => {
        fetchAllAnalytics();
    }, [period, interval, dateRange]);

    const fetchAllAnalytics = async () => {
        setLoading(true);
        try {
            const token = getAdminToken();
            const headers = { 'X-API-Token': token };

            const [trendsRes, categoriesRes, merchantsRes, anomaliesRes, predictiveRes, budgetRes, topRes, recurRes] = await Promise.all([
                fetch(`/api/analytics/spend-trends?period=${period}&interval=${interval}`, { headers }),
                fetch(`/api/analytics/category-breakdown?start_date=${dateRange.start.toISOString().split('T')[0]}&end_date=${dateRange.end.toISOString().split('T')[0]}`, { headers }),
                fetch(`/api/analytics/merchant-comparison?limit=10&start_date=${dateRange.start.toISOString().split('T')[0]}&end_date=${dateRange.end.toISOString().split('T')[0]}`, { headers }),
                fetch('/api/analytics/anomalies', { headers }),
                fetch('/api/analytics/predictive-spend', { headers }),
                fetch('/api/analytics/budget-vs-actual', { headers }),
                fetch('/api/analytics/top-expenses?limit=5', { headers }),
                fetch('/api/analytics/recurring-costs', { headers })
            ]);

            const trends = await trendsRes.json();
            const categories = await categoriesRes.json();
            const merchants = await merchantsRes.json();
            const anomaliesData = await anomaliesRes.json();
            const predictiveData = await predictiveRes.json();
            const budgets = await budgetRes.json();
            const tops = await topRes.json();
            const recurring = await recurRes.json();

            setTrendData(Array.isArray(trends.data) ? trends.data : []);
            setCategoryData(Array.isArray(categories.categories) ? categories.categories : []);
            setMerchantData(Array.isArray(merchants.merchants) ? merchants.merchants : []);
            setAnomalies(Array.isArray(anomaliesData.anomalies) ? anomaliesData.anomalies : []);
            setPredictive(predictiveData);
            setBudgetData(Array.isArray(budgets) ? budgets : []);
            setTopExpenses(Array.isArray(tops) ? tops : []);
            setRecurringCosts(Array.isArray(recurring) ? recurring : []);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Header */}
            <div className="analytics-header" style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '24px 32px' }}>
                <div style={{ maxWidth: 1400, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 8 }} className="page-title">Analytics Dashboard</h1>
                            <p style={{ fontSize: 15, color: '#64748b' }}>AI-powered insights and spending intelligence</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 'max-content' }} className="header-actions">
                            <select
                                value={interval}
                                onChange={(e) => setInterval(e.target.value)}
                                style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#fff' }}
                            >
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                                <option value="quarter">Quarterly</option>
                            </select>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#fff' }}
                            >
                                <option value="3months">Last 3 Months</option>
                                <option value="6months">Last 6 Months</option>
                                <option value="1year">Last Year</option>
                                <option value="all">All Time</option>
                            </select>
                            <button
                                onClick={fetchAllAnalytics}
                                style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0f172a, #334155)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> <span className="action-text">Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Predictive Stats / Cash Flow Forecast */}
                    {predictive && typeof predictive === 'object' && !predictive.error && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                            <TrendStatCard
                                title="Current Spend (MTD)"
                                value={`${(predictive.current_spend || 0).toLocaleString()} AED`}
                                change={predictive.variance_percentage}
                                icon={<DollarSign size={24} />}
                                color="#3b82f6"
                            />
                            <TrendStatCard
                                title="Projected Forecast"
                                value={`${Math.round(predictive.projected_spend || 0).toLocaleString()} AED`}
                                icon={<TrendingUp size={24} />}
                                color="#8b5cf6"
                            />
                            <TrendStatCard
                                title="Daily Projection"
                                value={`${Math.round(predictive.daily_average || 0).toLocaleString()} AED`}
                                icon={<Clock size={24} />}
                                color="#10b981"
                            />
                            <TrendStatCard
                                title="Anomalies Found"
                                value={Array.isArray(anomalies) ? anomalies.length : 0}
                                icon={<AlertTriangle size={24} />}
                                color="#ef4444"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="analytics-content" style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>

                {/* Spending Trends Row */}
                <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: "32px 24px", marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Spending Trends</h2>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['week', 'month', 'quarter'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setInterval(v)}
                                    style={{
                                        padding: '6px 12px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none',
                                        background: interval === v ? '#0f172a' : '#f1f5f9',
                                        color: interval === v ? '#fff' : '#64748b', cursor: 'pointer'
                                    }}
                                >{v.toUpperCase()}</button>
                            ))}
                        </div>
                    </div>
                    {loading ? <ChartSkeleton /> : <SpendTrendChart data={trendData} />}
                </div>

                {/* Budget vs Actual Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
                    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Budget vs Actual</h2>
                        {loading ? <ChartSkeleton /> : <BudgetBarChart data={budgetData} />}
                    </div>

                    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Top Expenses</h2>
                            <Layers size={20} color="#64748b" />
                        </div>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {topExpenses.map((exp, i) => (
                                <div key={i} style={{ padding: 16, borderRadius: 16, border: '1px solid #f1f5f9', background: '#fcfdff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>{exp.vendor_name}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{exp.category} • {exp.user_name}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, color: '#3b82f6' }}>{exp.total_amount.toLocaleString()} AED</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(exp.invoice_date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
                    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Category Distribution</h2>
                        {loading ? <ChartSkeleton /> : <CategoryPieChart data={categoryData} />}
                    </div>

                    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Top Vendors</h2>
                        {loading ? <ChartSkeleton /> : <MerchantBarChart data={merchantData} />}
                    </div>
                </div>

                {/* Recurring Costs and Anomalies */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                    {/* Recurring Row */}
                    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 24 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <RefreshCw size={18} color="#3b82f6" /> Recurring Costs
                        </h2>
                        {recurringCosts.slice(0, 4).map((rec, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{rec.vendor_name}</div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>Frequency: {rec.month_count} months</div>
                                </div>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>~{rec.avg_amount.toLocaleString()} AED</div>
                            </div>
                        ))}
                    </div>

                    {/* Anomalies Row */}
                    <div style={{ background: 'linear-gradient(135deg, #fff5f5, #ffffff)', borderRadius: 24, border: '2px solid #fee2e2', padding: 24 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#991b1b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <AlertTriangle size={18} /> Anomaly Detection
                        </h2>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {anomalies.slice(0, 3).map((anomaly, i) => (
                                <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 14, boxShadow: '0 2px 4px rgba(0,0,0,0.02)', border: '1px solid #fee2e2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ minWidth: 150 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{anomaly.vendor}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{new Date(anomaly.date).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#ef4444' }}>{anomaly.amount.toLocaleString()} AED</div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>High Deviation</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .analytics-header, .analytics-content { padding: 20px !important; }
                    .page-title { font-size: 24px !important; }
                    .action-text { display: none; }
                    .chart-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
