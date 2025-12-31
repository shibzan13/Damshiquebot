import React, { useState, useEffect } from "react";
import {
    FileText, Search, Download, Filter, Eye, MoreVertical,
    Calendar, ArrowUpDown, ChevronLeft, ChevronRight, X, ExternalLink,
    DollarSign, Clock, CheckCircle, AlertCircle, User, Zap, Check, Trash2
} from "lucide-react";
import { DateRangePicker, MultiSelect, AmountSlider } from './AdvancedFilters';
import { useToast } from './ToastNotification';

const ADMIN_TOKEN = "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7";

export default function InvoicesDashboardEnhanced() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [amountRange, setAmountRange] = useState<[number, number]>([0, 10000]);

    const { showToast } = useToast();

    const fetchInvoices = async () => {
        try {
            const res = await fetch("/api/admin/invoices", {
                headers: { 'X-API-Token': ADMIN_TOKEN }
            });
            const data = await res.json();
            if (Array.isArray(data)) setInvoices(data);
        } catch (err) {
            console.error("Failed to fetch invoices:", err);
            showToast("Failed to load invoices", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    // Apply filters
    const filteredInvoices = invoices.filter(inv => {
        // Search filter
        const matchesSearch = !searchQuery ||
            inv.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.user_id?.includes(searchQuery) ||
            inv.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

        // Date range filter
        const matchesDate = (!dateRange.start && !dateRange.end) ||
            (dateRange.start && dateRange.end &&
                new Date(inv.invoice_date) >= dateRange.start &&
                new Date(inv.invoice_date) <= dateRange.end);

        // Category filter
        const matchesCategory = selectedCategories.length === 0 ||
            selectedCategories.includes(inv.category || 'Uncategorized');

        // Status filter
        const matchesStatus = selectedStatuses.length === 0 ||
            selectedStatuses.includes(inv.status || 'pending');

        // Amount filter
        const matchesAmount = inv.total_amount >= amountRange[0] && inv.total_amount <= amountRange[1];

        return matchesSearch && matchesDate && matchesCategory && matchesStatus && matchesAmount;
    });

    // Get unique categories and statuses
    const categories = Array.from(new Set(invoices.map(inv => inv.category || 'Uncategorized')));
    const statuses = Array.from(new Set(invoices.map(inv => inv.status || 'pending')));

    // Bulk actions
    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedIds(filteredInvoices.map(inv => inv.invoice_id));
    };

    const clearSelection = () => {
        setSelectedIds([]);
    };

    const bulkApprove = async () => {
        if (selectedIds.length === 0) return;

        try {
            await Promise.all(selectedIds.map(id =>
                fetch(`/api/admin/invoices/${id}/process`, {
                    method: 'POST',
                    headers: { 'X-API-Token': ADMIN_TOKEN }
                })
            ));
            showToast(`${selectedIds.length} invoices approved!`, "success");
            clearSelection();
            fetchInvoices();
        } catch (err) {
            showToast("Failed to approve invoices", "error");
        }
    };

    const bulkExport = () => {
        const selectedInvoices = invoices.filter(inv => selectedIds.includes(inv.invoice_id));
        // Create CSV
        const csv = [
            ['Date', 'Vendor', 'Amount', 'Currency', 'Status', 'User'].join(','),
            ...selectedInvoices.map(inv =>
                [inv.invoice_date, inv.vendor_name, inv.total_amount, inv.currency, inv.status, inv.user_name].join(',')
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();

        showToast(`Exported ${selectedIds.length} invoices`, "success");
    };

    const clearFilters = () => {
        setSearchQuery("");
        setDateRange({ start: null, end: null });
        setSelectedCategories([]);
        setSelectedStatuses([]);
        setAmountRange([0, 10000]);
        showToast("Filters cleared", "info");
    };

    const getStatusStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'approved': return { bg: "#dcfce7", color: "#166534", icon: <CheckCircle size={14} /> };
            case 'pending': return { bg: "#fef3c7", color: "#92400e", icon: <Clock size={14} /> };
            case 'rejected': return { bg: "#fee2e2", color: "#991b1b", icon: <AlertCircle size={14} /> };
            default: return { bg: "#f1f5f9", color: "#475569", icon: <Clock size={14} /> };
        }
    };

    const activeFiltersCount =
        (searchQuery ? 1 : 0) +
        (dateRange.start || dateRange.end ? 1 : 0) +
        (selectedCategories.length > 0 ? 1 : 0) +
        (selectedStatuses.length > 0 ? 1 : 0) +
        ((amountRange[0] !== 0 || amountRange[1] !== 10000) ? 1 : 0);

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* HEADER */}
            <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
                <div style={{ maxWidth: 1400, margin: "0 auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <div>
                            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Invoices & Expenses</h1>
                            <p style={{ fontSize: 15, color: "#64748b" }}>
                                {filteredInvoices.length} of {invoices.length} invoices
                                {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                style={{
                                    padding: "12px 20px",
                                    borderRadius: 12,
                                    border: "1px solid #e2e8f0",
                                    background: showFilters ? "#eff6ff" : "#fff",
                                    color: showFilters ? "#3b82f6" : "#64748b",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    position: 'relative'
                                }}
                            >
                                <Filter size={18} />
                                Filters
                                {activeFiltersCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: -8,
                                        right: -8,
                                        background: '#3b82f6',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        width: 20,
                                        height: 20,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => window.open(`/api/admin/export?token=${ADMIN_TOKEN}`, '_blank')}
                                style={{ padding: "12px 24px", borderRadius: 12, background: "linear-gradient(135deg, #0f172a, #334155)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                            >
                                <Download size={18} /> Export All
                            </button>
                        </div>
                    </div>

                    {/* BULK ACTIONS BAR */}
                    {selectedIds.length > 0 && (
                        <div style={{
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            borderRadius: 16,
                            padding: "16px 24px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 20
                        }}>
                            <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>
                                {selectedIds.length} invoice{selectedIds.length > 1 ? 's' : ''} selected
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <button
                                    onClick={bulkApprove}
                                    style={{ padding: "10px 20px", borderRadius: 10, background: "#fff", color: "#3b82f6", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                                >
                                    <Check size={16} /> Approve All
                                </button>
                                <button
                                    onClick={bulkExport}
                                    style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                                >
                                    <Download size={16} /> Export Selected
                                </button>
                                <button
                                    onClick={clearSelection}
                                    style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
                {/* ADVANCED FILTERS */}
                {showFilters && (
                    <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: 24, marginBottom: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Advanced Filters</h3>
                            <button
                                onClick={clearFilters}
                                style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#64748b" }}
                            >
                                Clear All
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                            <DateRangePicker
                                startDate={dateRange.start}
                                endDate={dateRange.end}
                                onStartDateChange={(date) => setDateRange({ ...dateRange, start: date })}
                                onEndDateChange={(date) => setDateRange({ ...dateRange, end: date })}
                            />

                            <MultiSelect
                                options={categories}
                                selected={selectedCategories}
                                onChange={setSelectedCategories}
                                placeholder="Categories"
                            />

                            <MultiSelect
                                options={statuses}
                                selected={selectedStatuses}
                                onChange={setSelectedStatuses}
                                placeholder="Status"
                            />
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <AmountSlider
                                min={0}
                                max={10000}
                                value={amountRange}
                                onChange={setAmountRange}
                            />
                        </div>
                    </div>
                )}

                {/* SEARCH BAR */}
                <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: 12, marginBottom: 24, display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
                        <input
                            placeholder="Search by vendor, phone, or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: "100%", height: 52, padding: "0 16px 0 52px", borderRadius: 14, border: "1px solid #f1f5f9", background: "#f8fafc", fontSize: 15, outline: "none" }}
                        />
                    </div>
                    {selectedIds.length === 0 && (
                        <button
                            onClick={selectAll}
                            style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#3b82f6", whiteSpace: "nowrap" }}
                        >
                            Select All ({filteredInvoices.length})
                        </button>
                    )}
                </div>

                {/* INVOICE CARDS */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 100, color: "#64748b", fontWeight: 700 }}>Fetching live invoices...</div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
                        {filteredInvoices.map((inv) => {
                            const status = getStatusStyle(inv.status);
                            const isSelected = selectedIds.includes(inv.invoice_id);

                            return (
                                <div
                                    key={inv.invoice_id}
                                    style={{
                                        background: "white",
                                        borderRadius: 24,
                                        border: isSelected ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                                        padding: 24,
                                        transition: "all 0.3s",
                                        boxShadow: isSelected ? "0 8px 24px rgba(59,130,246,0.15)" : "0 4px 12px rgba(15,23,42,0.03)",
                                        position: "relative"
                                    }}
                                    onMouseEnter={(e: any) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.transform = "translateY(-4px)";
                                            e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.06)";
                                        }
                                    }}
                                    onMouseLeave={(e: any) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(15,23,42,0.03)";
                                        }
                                    }}
                                >
                                    {/* Checkbox */}
                                    <div style={{ position: "absolute", top: 20, left: 20 }}>
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelect(inv.invoice_id)}
                                            style={{ width: 20, height: 20, cursor: "pointer" }}
                                        />
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20, marginLeft: 32 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "#f0f9ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <FileText size={24} />
                                        </div>
                                        <div style={{ padding: "6px 12px", borderRadius: 10, background: status.bg, color: status.color, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                                            {status.icon}
                                            {inv.status}
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 20 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{inv.vendor_name || "Unknown Vendor"}</h3>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 13, fontWeight: 500 }}>
                                            <Calendar size={14} /> {inv.invoice_date}
                                        </div>
                                    </div>

                                    <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 16, marginBottom: 24 }}>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
                                            {inv.total_amount} <span style={{ fontSize: 14, color: "#94a3b8" }}>{inv.currency}</span>
                                        </div>
                                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 4 }}>Extracted from WhatsApp</div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><User size={16} /></div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>{inv.user_name || "Employee"}</div>
                                        </div>
                                        <button onClick={() => setSelectedInvoice(inv)} style={{ padding: "8px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "background 0.2s" }} onMouseEnter={(e: any) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e: any) => e.currentTarget.style.background = "#fff"}>Details</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* DETAILS MODAL - Reuse existing component */}
            {selectedInvoice && (
                <InvoiceDetailsModal
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                    onProcessed={() => { setSelectedInvoice(null); fetchInvoices(); }}
                />
            )}

            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
        </div>
    );
}

// Reuse the existing InvoiceDetailsModal component
function InvoiceDetailsModal({ invoice, onClose, onProcessed }: any) {
    const [items, setItems] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isProcessing, setIsProcessing] = React.useState(false);

    React.useEffect(() => {
        fetch(`/api/admin/invoices/${invoice.invoice_id}`, {
            headers: { 'X-API-Token': ADMIN_TOKEN }
        })
            .then(r => r.json())
            .then(data => {
                setItems(data.line_items || []);
                setLoading(false);
            });
    }, [invoice.invoice_id]);

    const handleMarkProcessed = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch(`/api/admin/invoices/${invoice.invoice_id}/process`, {
                method: "POST",
                headers: { 'X-API-Token': ADMIN_TOKEN }
            });
            if (res.ok) {
                onProcessed();
            }
        } catch (err) {
            console.error("Failed to mark processed:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 32, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.3)" }}>
                {/* Modal content - same as before */}
                <div style={{ padding: "32px 40px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fcfdff" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FileText size={20} />
                            </div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{invoice.vendor_name}</h2>
                        </div>
                        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Transaction ID: {invoice.invoice_id}</p>
                    </div>
                    <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 14, background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={20} color="#0f172a" />
                    </button>
                </div>

                <div style={{ padding: "40px", overflowY: "auto", flex: 1 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
                        <div style={{ background: "#f8fafc", padding: 24, borderRadius: 24, border: "1px solid #f1f5f9" }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>General Info</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>Date</span>
                                    <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{invoice.invoice_date}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>Currency</span>
                                    <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{invoice.currency}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>User</span>
                                    <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{invoice.user_name || invoice.user_id}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: "#f8fafc", padding: 24, borderRadius: 24, border: "1px solid #f1f5f9" }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Financial Breakdown</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>Subtotal</span>
                                    <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{invoice.subtotal || "—"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>Tax</span>
                                    <span style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{invoice.tax_amount || "0.00"}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px dashed #e2e8f0" }}>
                                    <span style={{ color: "#0f172a", fontSize: 16, fontWeight: 800 }}>Total</span>
                                    <span style={{ color: "#3b82f6", fontSize: 18, fontWeight: 800 }}>{invoice.total_amount} {invoice.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 40 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                            Line Items
                            <span style={{ padding: "4px 10px", background: "#f1f5f9", borderRadius: 8, fontSize: 12, color: "#64748b" }}>{items.length} items</span>
                        </h3>

                        <div style={{ border: "1px solid #f1f5f9", borderRadius: 20, overflow: "hidden" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ textAlign: "left", background: "#fcfdff", borderBottom: "1px solid #f1f5f9" }}>
                                        <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>DESCRIPTION</th>
                                        <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>QTY</th>
                                        <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>UNIT PRICE</th>
                                        <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading items...</td></tr>
                                    ) : items.length === 0 ? (
                                        <tr><td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>No line items extracted.</td></tr>
                                    ) : items.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                                            <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#334155" }}>{item.description}</td>
                                            <td style={{ padding: "14px 20px", fontSize: 14, color: "#64748b" }}>{item.quantity || 1}</td>
                                            <td style={{ padding: "14px 20px", fontSize: 14, color: "#64748b" }}>{item.unit_price}</td>
                                            <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{item.line_total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 16 }}>
                        {invoice.file_url ? (
                            <a href={invoice.file_url} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none", padding: "18px", borderRadius: 20, background: "#f1f5f9", color: "#0f172a", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "background 0.2s" }} onMouseEnter={(e: any) => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={(e: any) => e.currentTarget.style.background = "#f1f5f9"}>
                                <ExternalLink size={18} /> View Raw Document
                            </a>
                        ) : (
                            <div style={{ flex: 1, padding: "18px", borderRadius: 20, background: "#f1f5f9", color: "#94a3b8", fontSize: 15, fontWeight: 700, textAlign: "center" }}>No raw file available</div>
                        )}
                        <button
                            onClick={handleMarkProcessed}
                            disabled={isProcessing || invoice.status === 'approved'}
                            style={{
                                flex: 1,
                                padding: "18px",
                                borderRadius: 20,
                                border: "2px solid #3b82f6",
                                background: invoice.status === 'approved' ? '#f1f5f9' : 'transparent',
                                color: invoice.status === 'approved' ? '#94a3b8' : '#3b82f6',
                                fontSize: 15,
                                fontWeight: 800,
                                cursor: invoice.status === 'approved' ? 'default' : 'pointer'
                            }}
                        >
                            {isProcessing ? "Processing..." : invoice.status === 'approved' ? "Already Approved" : "Mark as Processed"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
