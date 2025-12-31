import React, { useState } from "react";
import { Users, Search, Filter, Download, Upload, Plus, Mail, Phone, Calendar, Award, TrendingUp, MoreVertical, Grid, List, X, ChevronDown, MapPin, Briefcase } from "lucide-react";

export default function EmployeesDashboard() {
  const [viewMode, setViewMode] = useState("grid"); // grid or table
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const stats = [
    { label: "Total Employees", value: "1,247", icon: <Users size={20} />, color: "#3b82f6", change: "+12%" },
    { label: "New Hires", value: "34", icon: <TrendingUp size={20} />, color: "#10b981", change: "+5%" },
    { label: "On Leave", value: "23", icon: <Calendar size={20} />, color: "#f59e0b", change: "-2%" },
    { label: "Remote Workers", value: "456", icon: <MapPin size={20} />, color: "#8b5cf6", change: "+18%" },
  ];

  const departments = ["All", "Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"];
  const statuses = ["All", "Active", "On Leave", "Remote", "Inactive"];

  const employees = [
    { id: 1, name: "Sarah Chen", role: "Senior Software Engineer", department: "Engineering", email: "sarah.chen@damshique.com", phone: "+1 (555) 123-4567", status: "Active", avatar: "SC", hireDate: "Jan 2020", tenure: "4 years", location: "San Francisco" },
    { id: 2, name: "Marcus Rodriguez", role: "Sales Director", department: "Sales", email: "marcus.r@damshique.com", phone: "+1 (555) 234-5678", status: "Active", avatar: "MR", hireDate: "Mar 2019", tenure: "5 years", location: "New York" },
    { id: 3, name: "Emily Watson", role: "Marketing Manager", department: "Marketing", email: "emily.w@damshique.com", phone: "+1 (555) 345-6789", status: "Remote", avatar: "EW", hireDate: "Jun 2021", tenure: "3 years", location: "Remote" },
    { id: 4, name: "James Park", role: "Product Designer", department: "Engineering", email: "james.park@damshique.com", phone: "+1 (555) 456-7890", status: "Active", avatar: "JP", hireDate: "Sep 2022", tenure: "2 years", location: "Austin" },
    { id: 5, name: "Lisa Anderson", role: "HR Director", department: "HR", email: "lisa.a@damshique.com", phone: "+1 (555) 567-8901", status: "On Leave", avatar: "LA", hireDate: "Feb 2018", tenure: "6 years", location: "Chicago" },
    { id: 6, name: "David Kim", role: "Finance Manager", department: "Finance", email: "david.kim@damshique.com", phone: "+1 (555) 678-9012", status: "Active", avatar: "DK", hireDate: "Nov 2021", tenure: "3 years", location: "San Francisco" },
    { id: 7, name: "Rachel Green", role: "Operations Lead", department: "Operations", email: "rachel.g@damshique.com", phone: "+1 (555) 789-0123", status: "Remote", avatar: "RG", hireDate: "Apr 2020", tenure: "4 years", location: "Remote" },
    { id: 8, name: "Tom Bradley", role: "Software Engineer", department: "Engineering", email: "tom.b@damshique.com", phone: "+1 (555) 890-1234", status: "Active", avatar: "TB", hireDate: "Jul 2023", tenure: "1 year", location: "Boston" },
  ];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDepartment === "All" || emp.department === selectedDepartment;
    const matchesStatus = selectedStatus === "All" || emp.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case "Active": return "#10b981";
      case "On Leave": return "#f59e0b";
      case "Remote": return "#8b5cf6";
      case "Inactive": return "#64748b";
      default: return "#64748b";
    }
  };

  const toggleEmployeeSelection = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "24px 32px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Employees</h1>
              <p style={{ fontSize: 15, color: "#64748b" }}>Manage your team and employee information</p>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#ffffff", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}>
                <Download size={18} /> Export
              </button>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#ffffff", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}>
                <Upload size={18} /> Import
              </button>
              <button style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#ffffff", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                <Plus size={18} /> Add Employee
              </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, transition: "all 0.3s" }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center" }}>{stat.icon}</div>
                  <div style={{ padding: "4px 12px", borderRadius: 20, background: stat.change.startsWith("+") ? "#dcfce7" : "#fef3c7", color: stat.change.startsWith("+") ? "#166534" : "#854d0e", fontSize: 12, fontWeight: 600 }}>{stat.change}</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px" }}>
        {/* Filters & Search */}
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 300, position: "relative" }}>
              <Search size={20} color="#64748b" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input 
                type="text" 
                placeholder="Search by name, role, or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "12px 12px 12px 48px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 15, outline: "none", transition: "all 0.2s" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
              />
            </div>

            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#0f172a", cursor: "pointer", background: "#ffffff" }}>
              {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>

            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 600, color: "#0f172a", cursor: "pointer", background: "#ffffff" }}>
              {statuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>

            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button onClick={() => setViewMode("grid")} style={{ padding: 12, borderRadius: 10, border: `1px solid ${viewMode === "grid" ? "#3b82f6" : "#e2e8f0"}`, background: viewMode === "grid" ? "#eff6ff" : "#ffffff", color: viewMode === "grid" ? "#3b82f6" : "#64748b", cursor: "pointer", transition: "all 0.2s" }}>
                <Grid size={20} />
              </button>
              <button onClick={() => setViewMode("table")} style={{ padding: 12, borderRadius: 10, border: `1px solid ${viewMode === "table" ? "#3b82f6" : "#e2e8f0"}`, background: viewMode === "table" ? "#eff6ff" : "#ffffff", color: viewMode === "table" ? "#3b82f6" : "#64748b", cursor: "pointer", transition: "all 0.2s" }}>
                <List size={20} />
              </button>
            </div>
          </div>

          {selectedEmployees.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: "#eff6ff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1e40af" }}>{selectedEmployees.length} employee(s) selected</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#3b82f6", color: "#ffffff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Send Message</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#ef4444", color: "#ffffff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Remove</button>
                <button onClick={() => setSelectedEmployees([])} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#ffffff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Clear</button>
              </div>
            </div>
          )}
        </div>

        {/* Grid View */}
        {viewMode === "grid" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
            {filteredEmployees.map(emp => (
              <div key={emp.id} style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", padding: 24, transition: "all 0.3s", cursor: "pointer" }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-4px)"; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={() => toggleEmployeeSelection(emp.id)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>{emp.avatar}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{emp.name}</div>
                      <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{emp.role}</div>
                    </div>
                  </div>
                  <button style={{ padding: 6, borderRadius: 8, border: "none", background: "transparent", color: "#64748b", cursor: "pointer" }}>
                    <MoreVertical size={18} />
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <div style={{ padding: "4px 10px", borderRadius: 6, background: "#f1f5f9", fontSize: 12, fontWeight: 600, color: "#475569" }}>{emp.department}</div>
                  <div style={{ padding: "4px 10px", borderRadius: 6, background: `${getStatusColor(emp.status)}15`, fontSize: 12, fontWeight: 600, color: getStatusColor(emp.status) }}>{emp.status}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
                    <Mail size={16} />
                    <span>{emp.email}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
                    <Phone size={16} />
                    <span>{emp.phone}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b" }}>
                    <MapPin size={16} />
                    <span>{emp.location}</span>
                  </div>
                </div>

                <div style={{ paddingTop: 16, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Hired</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{emp.hireDate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>Tenure</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{emp.tenure}</div>
                  </div>
                  <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#ffffff", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>View Profile</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      <input type="checkbox" onChange={(e) => setSelectedEmployees(e.target.checked ? filteredEmployees.map(emp => emp.id) : [])} style={{ width: 18, height: 18, cursor: "pointer" }} />
                    </th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Employee</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Role</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Department</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Contact</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Location</th>
                    <th style={{ padding: "16px 20px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Hired</th>
                    <th style={{ padding: "16px 20px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp, i) => (
                    <tr key={emp.id} style={{ borderBottom: i < filteredEmployees.length - 1 ? "1px solid #f1f5f9" : "none", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "#ffffff"}>
                      <td style={{ padding: "16px 20px" }}>
                        <input type="checkbox" checked={selectedEmployees.includes(emp.id)} onChange={() => toggleEmployeeSelection(emp.id)} style={{ width: 18, height: 18, cursor: "pointer" }} />
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>{emp.avatar}</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{emp.name}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 14, color: "#475569", fontWeight: 500 }}>{emp.role}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: "#f1f5f9", fontSize: 12, fontWeight: 600, color: "#475569", display: "inline-block" }}>{emp.department}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: `${getStatusColor(emp.status)}15`, fontSize: 12, fontWeight: 600, color: getStatusColor(emp.status), display: "inline-block" }}>{emp.status}</div>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b" }}>{emp.phone}</td>
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "#64748b" }}>{emp.location}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{emp.hireDate}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{emp.tenure}</div>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#ffffff", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 14, color: "#64748b" }}>Showing <span style={{ fontWeight: 600, color: "#0f172a" }}>{filteredEmployees.length}</span> of <span style={{ fontWeight: 600, color: "#0f172a" }}>1,247</span> employees</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Previous</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #3b82f6", background: "#3b82f6", color: "#ffffff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>1</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>2</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>3</button>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#ffffff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
}