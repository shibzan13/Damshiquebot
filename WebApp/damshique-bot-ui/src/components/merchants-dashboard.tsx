import React, { useState, useEffect } from "react";
import { Store, Search, Filter, Download, Plus, Mail, Phone, Calendar, ArrowUpRight, TrendingUp, MoreVertical, Grid, List, MapPin, DollarSign, Package, X, FileText, ExternalLink } from "lucide-react";

import { getAdminToken } from "../utils/auth";

export default function MerchantsDashboard() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  const fetchMerchants = () => {
    setLoading(true);
    fetch("/api/admin/merchants", {
      headers: { 'X-API-Token': getAdminToken() }
    })
      .then(r => r.json())
      .then(data => {
        setMerchants(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const filteredMerchants = Array.isArray(merchants) ? merchants.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const stats = [
    { label: "Total Merchants", value: Array.isArray(merchants) ? merchants.length.toString() : "0", icon: <Store size={20} />, color: "#3b82f6" },
    { label: "Top Merchant", value: Array.isArray(merchants) && merchants.length > 0 ? (merchants[0].name || "None").split(' ')[0] : "None", icon: <TrendingUp size={20} />, color: "#10b981" },
    { label: "Total Spend", value: `${Math.round(Array.isArray(merchants) ? merchants.reduce((acc, m) => acc + parseFloat(m.total_spend || 0), 0) : 0).toLocaleString()} AED`, icon: <DollarSign size={20} />, color: "#f59e0b" },
    { label: "Active Items", value: (Array.isArray(merchants) ? merchants.reduce((acc, m) => acc + (m.total_invoices || 0), 0) : 0).toString(), icon: <Package size={20} />, color: "#8b5cf6" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Merchants</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Track spending and interaction history with various vendors</p>
            </div>
            <button
              onClick={() => window.open(`/api/admin/export-merchants?token=${getAdminToken()}`, '_blank')}
              style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
            >
              <Download size={18} /> Export Registry
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{stat.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        <div style={{ background: "#ffffff", borderRadius: 20, padding: 20, marginBottom: 32, border: "1px solid #e2e8f0", display: "flex", gap: 16 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={20} color="#94a3b8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "14px 14px 14px 52px", borderRadius: 14, border: "1px solid #f1f5f9", background: "#f8fafc", fontSize: 15, outline: "none" }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>Loading merchant registry...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 24 }}>
            {filteredMerchants.map((merchant, i) => (
              <div key={i} style={{ background: "#ffffff", borderRadius: 24, border: "1px solid #e2e8f0", padding: 28, position: "relative", overflow: "hidden", transition: "all 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-6px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 }}>
                      <Store size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{merchant.name || "Unknown"}</div>
                      <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>ID: MCH-{i + 1000}</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 16, border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Total Spend</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{parseFloat(merchant.total_spend || 0).toLocaleString()} <span style={{ fontSize: 10 }}>AED</span></div>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", borderRadius: 16, border: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Invoices</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#3b82f6" }}>{merchant.total_invoices || 0}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={14} color="#94a3b8" />
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Last: {merchant.last_interaction ? new Date(merchant.last_interaction).toLocaleDateString() : '—'}</span>
                  </div>
                  <button onClick={() => setSelectedMerchant(merchant)} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#eff6ff", color: "#3b82f6", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>View Invoices</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMerchant && (
        <MerchantInvoicesModal
          merchant={selectedMerchant}
          onClose={() => setSelectedMerchant(null)}
        />
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
}

function MerchantInvoicesModal({ merchant, onClose }: { merchant: any, onClose: () => void }) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/merchants/${encodeURIComponent(merchant.name)}/invoices`, {
      headers: { 'X-API-Token': getAdminToken() }
    })
      .then(r => r.json())
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, [merchant.name]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 32, width: "100%", maxWidth: 800, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px -20px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "32px 40px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Invoices for {merchant.name}</h2>
            <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{invoices.length} historical records found</p>
          </div>
          <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 14, background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} color="#0f172a" />
          </button>
        </div>
        <div style={{ padding: 40, overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading transactions...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {invoices.map((inv, idx) => (
                <div key={idx} style={{ padding: 20, background: "#f8fafc", borderRadius: 16, border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6" }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{new Date(inv.invoice_date).toLocaleDateString()}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{inv.total_amount} {inv.currency} • By {inv.user_name || "System"}</div>
                    </div>
                  </div>
                  {inv.file_url && (
                    <button onClick={() => window.open(inv.file_url, '_blank')} style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
                      <ExternalLink size={16} /> View
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
