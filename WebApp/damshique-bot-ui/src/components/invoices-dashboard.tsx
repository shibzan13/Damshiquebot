import React, { useState, useEffect } from "react";
import {
  FileText, Search, Download, Filter, Eye, MoreVertical,
  Calendar, ArrowUpDown, ChevronLeft, ChevronRight, X, ExternalLink,
  DollarSign, Clock, CheckCircle, AlertCircle, User, Zap, Trash2, CheckSquare, Square
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import toast, { Toaster } from 'react-hot-toast';

const ADMIN_TOKEN = "00b102be503424620ca352a41ef9558e50dc1aa8197042fa65afa28e41154fa7";

export default function InvoicesDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const fetchInvoices = async () => {
    try {
      // Don't set loading to true for background refreshes unless initial
      // setLoading(true); 
      const res = await fetch("/api/admin/invoices", {
        headers: { 'X-API-Token': ADMIN_TOKEN }
      });
      const data = await res.json();
      if (Array.isArray(data)) setInvoices(data);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If running dev server on 5173 but backend on 3000, we might need hardcoded logic or proxy
    // Assuming proxy is set up in vite.config.ts or they run on same port (unlikely for dev)
    // For now, let's try to connect to the backend port if we are on localhost
    // Actually, in `main.py` we saw server is on port 3000. 
    // Vite likely proxies /api to 3000. Does it proxy /ws? 
    // If not, we should probably hardcode localhost:3000 for dev environments or check proxy config.
    // However, usually vite proxy handles upgrades.

    const wsUrl = `ws://localhost:3000/ws`; // Hardcoded for local dev robustness
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => console.log("WS Connected");

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("WS Message:", msg);

          if (msg.type === 'invoice_received') {
            toast.success(`New invoice from ${msg.data.vendor_name || 'Vendor'}`, { duration: 5000 });
            fetchInvoices();
          } else if (msg.type === 'invoice_rejected') {
            toast.error(`Invoice rejected: ${msg.data.reason}`, { duration: 5000 });
            fetchInvoices();
          } else if (msg.type === 'duplicate_detected') {
            toast('Duplicate invoice detected', { icon: '⚠️' });
          } else if (msg.message) {
            toast(msg.message, { icon: '🔔' });
          }
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };

      ws.onclose = () => console.log("WS Disconnected");
    } catch (err) {
      console.error("WS Connection failed", err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleExport = async () => {
    const startStr = dateRange.start ? dateRange.start.toISOString().split('T')[0] : "";
    const endStr = dateRange.end ? dateRange.end.toISOString().split('T')[0] : "";
    const url = `/api/admin/export?start_date=${startStr}&end_date=${endStr}&token=${ADMIN_TOKEN}`;
    window.open(url, '_blank');
    setShowExportModal(false);
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedInvoices.length === 0) return;
    if (!confirm(`Are you sure you want to ${action} ${selectedInvoices.length} invoices?`)) return;

    setIsBulkProcessing(true);
    try {
      const res = await fetch("/api/admin/invoices/bulk-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Token": ADMIN_TOKEN
        },
        body: JSON.stringify({
          invoice_ids: selectedInvoices,
          action: action
        })
      });

      if (res.ok) {
        setSelectedInvoices([]);
        fetchInvoices();
      } else {
        alert("Failed to process bulk action");
      }
    } catch (err) {
      console.error("Bulk action failed:", err);
      alert("Error processing request");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const toggleInvoiceSelection = (id: string) => {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(i => i.invoice_id));
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const filteredInvoices = Array.isArray(invoices) ? invoices.filter(inv => {
    const matchesSearch =
      inv.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.user_id?.includes(searchQuery) ||
      inv.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(inv.status?.toLowerCase());

    const invDate = new Date(inv.invoice_date);
    const matchesDate = (!dateRange.start || invDate >= dateRange.start) &&
      (!dateRange.end || invDate <= dateRange.end);

    return matchesSearch && matchesStatus && matchesDate;
  }) : [];

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return { bg: "#dcfce7", color: "#166534", icon: <CheckCircle size={14} /> };
      case 'pending': return { bg: "#fef3c7", color: "#92400e", icon: <Clock size={14} /> };
      case 'rejected': return { bg: "#fee2e2", color: "#991b1b", icon: <AlertCircle size={14} /> };
      default: return { bg: "#f1f5f9", color: "#475569", icon: <Clock size={14} /> };
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Toaster position="top-right" />
      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Invoices & Expenses</h1>
            <p style={{ fontSize: 15, color: "#64748b" }}>Track and manage all extracted expenses from WhatsApp</p>
          </div>
          <button onClick={() => setShowExportModal(true)} style={{ padding: "12px 24px", borderRadius: 14, background: "linear-gradient(135deg, #0f172a, #334155)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
            <Download size={18} /> Export Sheet
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        {/* FILTERS & TOOLBAR */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: 20, marginBottom: 32, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            {/* SEARCH */}
            <div style={{ flex: 1, minWidth: 300, position: "relative" }}>
              <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
              <input
                placeholder="Search by vendor, phone, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", height: 48, padding: "0 16px 0 52px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 15, outline: "none" }}
              />
            </div>

            {/* DATE PICKERS */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div className="custom-datepicker-wrapper">
                <DatePicker
                  selected={dateRange.start}
                  onChange={(date) => setDateRange({ ...dateRange, start: date })}
                  placeholderText="Start Date"
                  className="p-3 border rounded-xl bg-slate-50 border-slate-300 text-sm w-36"
                />
              </div>
              <span style={{ color: "#94a3b8" }}>-</span>
              <div className="custom-datepicker-wrapper">
                <DatePicker
                  selected={dateRange.end}
                  onChange={(date) => setDateRange({ ...dateRange, end: date })}
                  placeholderText="End Date"
                  className="p-3 border rounded-xl bg-slate-50 border-slate-300 text-sm w-36"
                />
              </div>
            </div>

            {/* STATUS FILTER */}
            <div style={{ display: "flex", gap: 8 }}>
              {['pending', 'approved', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  style={{
                    padding: "8px 16px", borderRadius: 10, border: "1px solid",
                    borderColor: statusFilter.includes(status) ? "#0f172a" : "#e2e8f0",
                    background: statusFilter.includes(status) ? "#0f172a" : "#fff",
                    color: statusFilter.includes(status) ? "#fff" : "#64748b",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize"
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* BULK ACTIONS BAR */}
          {selectedInvoices.length > 0 && (
            <div style={{ padding: "12px 16px", background: "#f1f5f9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeIn 0.2s" }}>
              <div style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "#0f172a", color: "white", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>{selectedInvoices.length}</div>
                Selected
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleBulkAction('approve')} disabled={isBulkProcessing} style={{ padding: "8px 16px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={() => handleBulkAction('reject')} disabled={isBulkProcessing} style={{ padding: "8px 16px", borderRadius: 8, background: "#dc2626", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <X size={14} /> Reject
                </button>
                <button onClick={() => handleBulkAction('delete')} disabled={isBulkProcessing} style={{ padding: "8px 16px", borderRadius: 8, background: "#475569", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SELECT ALL HEADER */}
        {filteredInvoices.length > 0 && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12, paddingLeft: 8 }}>
            <button onClick={selectAll} style={{ background: "transparent", border: "none", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              {selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0 ? <CheckSquare size={20} color="#0f172a" /> : <Square size={20} />}
              Select All {filteredInvoices.length} Invoices
            </button>
          </div>
        )}

        {/* GRID */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 100, color: "#64748b", fontWeight: 700 }}>Fetching live invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>No invoices found matching your filters.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {filteredInvoices.map((inv) => {
              const status = getStatusStyle(inv.status);
              const isSelected = selectedInvoices.includes(inv.invoice_id);

              return (
                <div
                  key={inv.invoice_id}
                  style={{
                    position: "relative",
                    background: isSelected ? "#f1f5f9" : "white",
                    borderRadius: 24,
                    border: isSelected ? "2px solid #0f172a" : "1px solid #e2e8f0",
                    padding: 24,
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.03)"
                  }}
                >
                  <div
                    onClick={() => toggleInvoiceSelection(inv.invoice_id)}
                    style={{ position: "absolute", top: 24, left: 24, cursor: "pointer", zIndex: 10 }}
                  >
                    {isSelected ? <CheckSquare size={24} color="#0f172a" /> : <Square size={24} color="#cbd5e1" />}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "start", marginBottom: 20, paddingLeft: 40 }}>
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

                  <div style={{ padding: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, marginBottom: 24 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
                      {inv.total_amount} <span style={{ fontSize: 14, color: "#94a3b8" }}>{inv.currency}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginTop: 4 }}>
                      {inv.line_items_status === 'success' ? 'Items Extracted' : 'Summary Only'}
                    </div>
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

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 450, padding: 32, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Export Expenses</h2>
              <button onClick={() => setShowExportModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}><X size={24} color="#64748b" /></button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#475569", marginBottom: 12 }}>Select Date Range</label>
              <div style={{ display: "flex", gap: 12 }}>
                <DatePicker
                  selected={dateRange.start}
                  onChange={(date) => setDateRange({ ...dateRange, start: date })}
                  placeholderText="Start"
                  className="p-3 border rounded-xl bg-slate-50 border-slate-300 w-full"
                />
                <DatePicker
                  selected={dateRange.end}
                  onChange={(date) => setDateRange({ ...dateRange, end: date })}
                  placeholderText="End"
                  className="p-3 border rounded-xl bg-slate-50 border-slate-300 w-full"
                />
              </div>
            </div>

            <button onClick={handleExport} style={{ width: "100%", padding: "16px", borderRadius: 16, background: "linear-gradient(135deg, #0f172a, #334155)", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Generate Report
            </button>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onProcessed={() => { setSelectedInvoice(null); fetchInvoices(); }}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .custom-datepicker-wrapper input {
           padding: 12px;
           border-radius: 12px;
           border: 1px solid #cbd5e1;
           font-family: 'Plus Jakarta Sans', sans-serif;
           font-size: 14px;
           width: 130px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ... InvoiceDetailsModal remains largely the same, just ensuring imports are available ...
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

  const isApproved = invoice.status?.toLowerCase() === 'approved';

  const handleMarkProcessed = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/invoices/${invoice.invoice_id}/process`, {
        method: "POST",
        headers: { 'X-API-Token': ADMIN_TOKEN }
      });
      if (res.ok) {
        onProcessed();
        onClose(); // Close modal on success
        toast.success("Invoice approved successfully!");
      }
    } catch (err) {
      console.error("Failed to mark processed:", err);
      toast.error("Failed to approve invoice");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      {/* SAME MODAL UI AS BEFORE, just verifying it exists */}
      <div style={{ background: "#fff", borderRadius: 32, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.3)" }}>

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
          {/* CONTENT */}
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
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: 24, borderRadius: 24, border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>Financial Breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

          {/* TABLE */}
          <div style={{ border: "1px solid #f1f5f9", borderRadius: 20, overflow: "hidden", marginBottom: 40 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#fcfdff", borderBottom: "1px solid #f1f5f9" }}>
                  <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>DESCRIPTION</th>
                  <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>QTY</th>
                  <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>PRICE</th>
                  <th style={{ padding: "16px 20px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
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

          <div style={{ display: "flex", gap: 16 }}>
            {invoice.file_url && (
              <a href={invoice.file_url} target="_blank" rel="noreferrer" style={{ flex: 1, textDecoration: "none", padding: "18px", borderRadius: 20, background: "#f1f5f9", color: "#0f172a", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <ExternalLink size={18} /> View Document
              </a>
            )}
            <button
              onClick={handleMarkProcessed}
              disabled={isProcessing || isApproved}
              style={{
                flex: 1,
                padding: "18px",
                borderRadius: 20,
                background: isApproved ? "#f1f5f9" : "#0f172a",
                color: isApproved ? "#94a3b8" : "#fff",
                fontWeight: 800,
                border: "none",
                cursor: isApproved ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10
              }}>
              {isProcessing ? "Processing..." : isApproved ? <><CheckCircle size={18} /> Approved</> : "Approve Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}