import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, AlertTriangle, Download, Calendar, Filter } from 'lucide-react';
import { SpendTrendChart, CategoryPieChart, MerchantBarChart, TrendStatCard, ChartSkeleton } from './ChartComponents';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import { getAdminToken } from "../utils/auth";

export default function AnalyticsDashboard() {
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [merchantData, setMerchantData] = useState<any[]>([]);
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [predictive, setPredictive] = useState<any>(null);

    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date()
    });

    const [period, setPeriod] = useState('6months');

    useEffect(() => {
        fetchAllAnalytics();
    }, [period, dateRange]);

    const fetchAllAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch all analytics in parallel
            const [trendsRes, categoriesRes, merchantsRes, anomaliesRes, predictiveRes] = await Promise.all([
                fetch(`/api/analytics/spend-trends?period=${period}`, {
                    headers: { 'X-API-Token': getAdminToken() }
                }),
                fetch(`/api/analytics/category-breakdown?start_date=${dateRange.start.toISOString().split('T')[0]}&end_date=${dateRange.end.toISOString().split('T')[0]}`, {
                    headers: { 'X-API-Token': getAdminToken() }
                }),
                fetch(`/api/analytics/merchant-comparison?limit=10&start_date=${dateRange.start.toISOString().split('T')[0]}&end_date=${dateRange.end.toISOString().split('T')[0]}`, {
                    headers: { 'X-API-Token': getAdminToken() }
                }),
                fetch('/api/analytics/anomalies', {
                    headers: { 'X-API-Token': getAdminToken() }
                }),
                fetch('/api/analytics/predictive-spend', {
                    headers: { 'X-API-Token': getAdminToken() }
                })
            ]);

            const trends = await trendsRes.json();
            const categories = await categoriesRes.json();
            const merchants = await merchantsRes.json();
            const anomaliesData = await anomaliesRes.json();
            const predictiveData = await predictiveRes.json();

            setTrendData(Array.isArray(trends.data) ? trends.data : []);
            setCategoryData(Array.isArray(categories.categories) ? categories.categories : []);
            setMerchantData(Array.isArray(merchants.merchants) ? merchants.merchants : []);
            setAnomalies(Array.isArray(anomaliesData.anomalies) ? anomaliesData.anomalies : []);
            setPredictive(predictiveData);
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
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#fff', flex: 1 }}
                            >
                                <option value="3months">3 Months</option>
                                <option value="6months">6 Months</option>
                                <option value="1year">1 Year</option>
                                <option value="all">All Time</option>
                            </select>
                            <button
                                onClick={fetchAllAnalytics}
                                style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                            >
                                <Download size={18} /> <span className="action-text">Export</span>
                            </button>
                        </div>
                    </div>

                    {/* Predictive Stats */}
                    {predictive && typeof predictive === 'object' && !predictive.error && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                            <TrendStatCard
                                title="Current Spend"
                                value={`${(predictive.current_spend || 0).toLocaleString()}`}
                                change={predictive.variance_percentage}
                                icon={<DollarSign size={24} />}
                                color="#3b82f6"
                            />
                            <TrendStatCard
                                title="Projected End"
                                value={`${Math.round(predictive.projected_spend || 0).toLocaleString()}`}
                                icon={<TrendingUp size={24} />}
                                color="#8b5cf6"
                            />
                            <TrendStatCard
                                title="Daily Avg"
                                value={`${Math.round(predictive.daily_average || 0).toLocaleString()}`}
                                icon={<ShoppingCart size={24} />}
                                color="#10b981"
                            />
                            <TrendStatCard
                                title="Anomalies"
                                value={Array.isArray(anomalies) ? anomalies.length : 0}
                                icon={<AlertTriangle size={24} />}
                                color="#ef4444"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="analytics-content" style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
                {/* Spend Trend Chart */}
                <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: "32px 24px", marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Spending Trends</h2>
                    {loading ? <ChartSkeleton /> : <SpendTrendChart data={trendData} />}
                </div>

                {/* Category & Merchant Charts */}
                <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
                    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Category Breakdown</h2>
                        {loading ? <ChartSkeleton /> : <CategoryPieChart data={categoryData} />}
                        <div style={{ marginTop: 20 }}>
                            {Array.isArray(categoryData) && categoryData.slice(0, 5).map((cat: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{cat.name || "Unknown"}</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{(cat.value || 0).toLocaleString()} AED</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', padding: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Top Merchants</h2>
                        {loading ? <ChartSkeleton /> : <MerchantBarChart data={merchantData} />}
                    </div>
                </div>

                {/* Anomalies Alert */}
                {anomalies.length > 0 && (
                    <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: 24, border: '2px solid #f59e0b', padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#92400e' }}>Spending Anomalies</h2>
                                <p style={{ fontSize: 13, color: '#78350f' }}>Significant deviation from patterns</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gap: 12 }}>
                            {anomalies.slice(0, 5).map((anomaly, i) => (
                                <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ minWidth: 150 }}>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{anomaly.vendor}</div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>{anomaly.user} • {new Date(anomaly.date).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>{anomaly.amount.toLocaleString()} AED</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{anomaly.deviation}σ deviation</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
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
