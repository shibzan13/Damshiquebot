import React from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

// Spend Trend Line Chart
export function SpendTrendChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="display_name"
                    stroke="#64748b"
                    style={{ fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                    stroke="#64748b"
                    style={{ fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                />
                <Tooltip
                    contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any) => [`${value.toLocaleString()} AED`, 'Total Spend']}
                />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSpend)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// Category Breakdown Pie Chart
export function CategoryPieChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12
                    }}
                    formatter={(value: any) => `${value.toLocaleString()} AED`}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

// Merchant Comparison Bar Chart (Existing)
export function MerchantBarChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    style={{ fontSize: 11, fontWeight: 600 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                />
                <YAxis
                    stroke="#64748b"
                    style={{ fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                />
                <Tooltip
                    contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 12
                    }}
                    formatter={(value: any) => [`${value.toLocaleString()} AED`, 'Total Spend']}
                />
                <Bar dataKey="total_spend" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// Budget vs Actual Comparison Chart
export function BudgetBarChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ left: 40, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#64748b"
                    width={100}
                    style={{ fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="actual" name="Actual" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// Mini Stat Card with Trend
export function TrendStatCard({
    title,
    value,
    change,
    icon,
    color = "#3b82f6"
}: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color?: string;
}) {
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            padding: 24,
            transition: 'all 0.3s'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `${color}15`,
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {icon}
                </div>
                {change !== undefined && (
                    <div style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: isPositive ? '#dcfce7' : isNegative ? '#fee2e2' : '#f1f5f9',
                        color: isPositive ? '#166534' : isNegative ? '#991b1b' : '#64748b',
                        fontSize: 12,
                        fontWeight: 700
                    }}>
                        {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{title}</div>
        </div>
    );
}

// Loading Skeleton for Charts
export function ChartSkeleton() {
    return (
        <div style={{
            width: '100%',
            height: 300,
            background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: 16
        }}>
            <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
        </div>
    );
}
