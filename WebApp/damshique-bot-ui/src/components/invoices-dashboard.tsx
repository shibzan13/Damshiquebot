import React, { useState, useEffect } from "react";
import {
  FileText, Search, Download, Filter, Eye, MoreVertical,
  Calendar, ArrowUpDown, ChevronLeft, ChevronRight, X, ExternalLink,
  DollarSign, Clock, CheckCircle, AlertCircle, User, Zap, Trash2, CheckSquare, Square
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import toast, { Toaster } from 'react-hot-toast';
import { getAdminToken } from "../utils/auth";

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
        headers: { 'X-API-Token': getAdminToken() }
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
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host; // This includes the port (e.g., localhost:5173 or yourdomain.com)
    const wsUrl = `${wsProtocol}//${wsHost}/ws`;
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
    const url = `/api/admin/export?start_date=${startStr}&end_date=${endStr}&token=${getAdminToken()}`;
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
          "X-API-Token": getAdminToken()
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

  const handleSingleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Are you sure you want to delete this invoice? This cannot be undone.")) return;

    setIsBulkProcessing(true);
    try {
      const res = await fetch("/api/admin/invoices/bulk-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Token": getAdminToken()
        },
        body: JSON.stringify({
          invoice_ids: [id],
          action: 'delete'
        })
      });

      if (res.ok) {
        toast.success("Invoice deleted successfully");
        if (selectedInvoice && selectedInvoice.invoice_id === id) {
          setSelectedInvoice(null);
        }
        fetchInvoices();
      } else {
        toast.error("Failed to delete invoice");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Error deleting invoice");
    } finally {
      setIsBulkProcessing(false);
    }
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
    <div className="invoices-page" style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Toaster position="top-right" />
      {/* HEADER */}
      <div className="invoices-header" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }} className="page-heading">Invoices & Expenses</h1>
            <p style={{ fontSize: 15, color: "#64748b" }} className="page-subheading">Track and manage all extracted expenses</p>
          </div>
          <button onClick={() => setShowExportModal(true)} style={{ padding: "12px 24px", borderRadius: 14, background: "linear-gradient(135deg, #0f172a, #334155)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: "max-content" }}>
            <Download size={18} /> Export <span className="action-text">Sheet</span>
          </button>
        </div>
      </div>

      <div className="invoices-content" style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        {/* FILTERS & TOOLBAR */}
        <div className="toolbar" style={{ background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", padding: 20, marginBottom: 32, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            {/* SEARCH */}
            <div style={{ flex: "1 1 300px", position: "relative" }}>
              <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
              <input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", height: 48, padding: "0 16px 0 52px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#f8fafc", fontSize: 15, outline: "none" }}
              />
            </div>

            {/* DATE PICKERS */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div className="custom-datepicker-wrapper">
                <DatePicker
                  selected={dateRange.start}
                  onChange={(date) => setDateRange({ ...dateRange, start: date })}
                  placeholderText="Start"
                  className="p-3 border rounded-xl bg-slate-50 border-slate-300 text-sm w-36"
                />
              </div>
              <span style={{ color: "#94a3b8" }} className="date-separator">-</span>
              <div className="custom-datepicker-wrapper">
                <DatePicker
                  selected={dateRange.end}
                  onChange={(date) => setDateRange({ ...dateRange, end: date })}
                  placeholderText="End"
                  className="p-3 border rounded-xl bg-slate-50 border-slate-300 text-sm w-36"
                />
              </div>
            </div>

            {/* STATUS FILTER */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
            <div style={{ padding: "12px 16px", background: "#f1f5f9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, animation: "fadeIn 0.2s" }}>
              <div style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "#0f172a", color: "white", padding: "2px 8px", borderRadius: 6, fontSize: 12 }}>{selectedInvoices.length}</div>
                Selected
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => handleBulkAction('approve')} disabled={isBulkProcessing} style={{ padding: "8px 12px", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={() => handleBulkAction('reject')} disabled={isBulkProcessing} style={{ padding: "8px 12px", borderRadius: 8, background: "#dc2626", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <X size={14} /> Reject
                </button>
                <button onClick={() => handleBulkAction('delete')} disabled={isBulkProcessing} style={{ padding: "8px 12px", borderRadius: 8, background: "#475569", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
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
                    padding: 20,
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(15,23,42,0.03)"
                  }}
                >
                  <div
                    onClick={() => toggleInvoiceSelection(inv.invoice_id)}
                    style={{ position: "absolute", top: 20, left: 20, cursor: "pointer", zIndex: 10 }}
                  >
                    {isSelected ? <CheckSquare size={22} color="#0f172a" /> : <Square size={22} color="#cbd5e1" />}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "start", marginBottom: 16, paddingLeft: 30 }}>
                    <div style={{ padding: "4px 10px", borderRadius: 8, background: status.bg, color: status.color, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      {status.icon}
                      {inv.status}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{inv.vendor_name || "Unknown Vendor"}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 12, fontWeight: 500 }}>
                      <Calendar size={13} /> {inv.invoice_date}
                    </div>
                  </div>

                  <div style={{ padding: "14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                      {inv.total_amount} <span style={{ fontSize: 13, color: "#94a3b8" }}>{inv.currency}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><User size={14} /></div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{inv.user_name || "Employee"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={(e) => handleSingleDelete(inv.invoice_id, e)}
                        style={{
                          width: 32, height: 32,
                          borderRadius: 10, border: "1px solid #fee2e2",
                          background: "#fff", color: "#ef4444",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.2s"
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => setSelectedInvoice(inv)} style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Details</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .custom-datepicker-wrapper input {
           padding: 10px;
           border-radius: 10px;
           border: 1px solid #cbd5e1;
           font-family: 'Plus Jakarta Sans', sans-serif;
           font-size: 13px;
           width: 120px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          .invoices-header, .invoices-content { padding: 20px !important; }
          .page-heading { font-size: 24px !important; }
          .page-subheading { font-size: 13px !important; }
          .action-text { display: none; }
          .date-separator { display: none; }
          .toolbar { padding: 15px !important; }
        }
      `}</style>

      {/* EXPORT MODAL */}
      {
        showExportModal && (
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
        )
      }

      {/* DETAILS MODAL */}
      {
        selectedInvoice && (
          <InvoiceDetailsModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onProcessed={() => { setSelectedInvoice(null); fetchInvoices(); }}
            onDelete={() => handleSingleDelete(selectedInvoice.invoice_id)}
          />
        )
      }
    </div >
  );
}

// ... InvoiceDetailsModal remains largely the same, just ensuring imports are available ...
function InvoiceDetailsModal({ invoice, onClose, onProcessed, onDelete }: any) {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/admin/invoices/${invoice.invoice_id}`, {
      headers: { 'X-API-Token': getAdminToken() }
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
        headers: { 'X-API-Token': getAdminToken() }
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

        <div className="modal-content" style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {/* CONTENT */}
          <div className="info-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
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

          <div className="modal-actions" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {invoice.file_url && (
              <a href={invoice.file_url} target="_blank" rel="noreferrer" style={{ flex: "1 1 200px", textDecoration: "none", padding: "16px", borderRadius: 20, background: "#f1f5f9", color: "#0f172a", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <ExternalLink size={18} /> View Document
              </a>
            )}
            <button
              onClick={onDelete}
              style={{
                width: 56,
                padding: "0",
                borderRadius: 20,
                background: "#fee2e2",
                color: "#ef4444",
                border: "none",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700,
                fontSize: 15
              }}
              title="Delete Invoice"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={handleMarkProcessed}
              disabled={isProcessing || isApproved}
              style={{
                flex: "1 1 200px",
                padding: "16px",
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
