import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import Nav from "../Nav/Nav";
import "../SuppliersDetails/suppliersdetails.css";

import { FileText, Calendar } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const SUPPLEMENTS_URL = "http://localhost:5000/supplements";
const ORDERS_URL = "http://localhost:5000/orders";

/**
 * Helper function to format price
 */
const formatPrice = (value) => {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toLocaleString();
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingSupplements, setPendingSupplements] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

/**
 * DASHBOARD DATA AGGREGATION:
 * Simultaneously fetches pending supplement requests and order history.
 * This multi-source data fetch provides a comprehensive overview of the 
 * system's operational status for Admin users.
 */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [pendingRes, ordersRes] = await Promise.all([
        axios.get(`${SUPPLEMENTS_URL}/pending`, { headers: { "x-user-role": "admin" } }),
        axios.get(`${ORDERS_URL}/all`)
      ]);
      setPendingSupplements(pendingRes.data?.supplements ?? []);
      setOrders(ordersRes.data?.orders ?? []);
    } catch (e) {
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

/**
 * FINANCIAL REPORTING LOGIC (SALES REPORT):
 * Generates a PDF report focused on revenue and payment statuses.
 * 1. DATE-BASED FILTERING: Allows Admins to specify a timeframe for the report.
 * 2. REVENUE METRICS: Calculates total turnover and payment success rates.
 * 3. EXPORT: Uses 'jspdf-autotable' to create a professional transaction log.
 */
  const generatePaymentReport = () => {
    try {
      let filteredOrders = orders;
      if (dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        filteredOrders = orders.filter(o => {
          const d = new Date(o.createdAt);
          return d >= start && d <= end;
        });
      }

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text("Sales & Payments Report", 14, 22);
      
      const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
      const paidOrders = filteredOrders.filter(o => o.paymentStatus === "Paid").length;

      doc.setFontSize(10);
      doc.text(`Report Period: ${dateRange.start || 'All Time'} to ${dateRange.end || 'Present'}`, 14, 32);
      doc.text(`Total Revenue: Rs. ${formatPrice(totalRevenue)}`, 14, 38);
      doc.text(`Paid Orders: ${paidOrders} / ${filteredOrders.length}`, 14, 44);

      const tableColumn = ["Date", "Order ID", "Customer", "Amount (Rs.)", "Status"];
      const tableRows = filteredOrders.map(o => [
        new Date(o.createdAt).toLocaleDateString(),
        o._id.slice(-8).toUpperCase(),
        o.customerEmail,
        formatPrice(o.totalAmount || 0),
        o.paymentStatus
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: "striped",
        headStyles: { fillColor: [244, 63, 94] } // Pink-500 (#f43f5e)
      });

      doc.save("Sales_Report.pdf");
      toast.success("Payment report generated!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate report.");
    }
  };

/**
 * SUPPLEMENT APPROVAL ACTION:
 * Finalizes the 'Pending' -> 'Approved' transition for a supplement.
 * Once approved, the item becomes visible to customers in the store catalog.
 */
  const approveHandler = async (id) => {
    try {
      await axios.patch(`${SUPPLEMENTS_URL}/approve/${id}`, {}, {
        headers: { "x-user-role": "admin" },
      });
      toast.success("Supplement approved successfully!");
      // Refresh list so approved items disappear immediately.
      await fetchPending();
      // Send them to the main store view so the change is visible right away.
      navigate("/supplementsdetails");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to approve supplement.");
    }
  };

  return (
    <div>
      <Nav />
      <div className="suppliers-container">
        <div className="title-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Admin Dashboard</h1>
            <p style={{ color: "var(--gms-muted)", marginTop: 8 }}>
              Manage pending supplements and track payments.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="date-input"
              />
              <span style={{ color: "var(--gms-muted)" }}>to</span>
              <input 
                type="date" 
                value={dateRange.end} 
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="date-input"
              />
            </div>
            <button 
              className="btn-gms btn-report-solid" 
              onClick={generatePaymentReport}
              title="Download Sales Report"
            >
              <FileText size={18} />
              Sales Report
            </button>
          </div>
        </div>

        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Total Revenue</label>
            <p style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>Rs. {orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0).toLocaleString()}</p>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Orders Count</label>
            <p style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>{orders.length}</p>
          </div>
          <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Pending Items</label>
            <p style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '4px 0' }}>{pendingSupplements.length}</p>
          </div>
        </div>

        <div className="title-section">
          <h2>Pending Supplements</h2>
        </div>

        {loading ? (
          <div className="empty-msg">Loading...</div>
        ) : pendingSupplements.length === 0 ? (
          <div className="empty-msg">No pending supplements.</div>
        ) : (
          <table className="suppliers-table" aria-label="Pending supplements table">
            <thead>
              <tr>
                <th>Supplement Name</th>
                <th>Brand</th>
                <th>Product Type</th>
                <th>Price</th>
                <th>Weight</th>
                <th>Status</th>
                <th data-label="Actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingSupplements.map((s) => (
                <tr key={s._id}>
                  <td>{s.supplementName}</td>
                  <td>{s.supplementBrand}</td>
                  <td>{s.supplementProduct || "-"}</td>
                  <td>Rs. {s.price}</td>
                  <td>{s.weight}</td>
                  <td>
                    <span className="pending-badge">{s.status || "Pending"}</span>
                  </td>
                  <td data-label="Actions">
                    <button
                      type="button"
                      className="btn-approve"
                      onClick={() => approveHandler(s._id)}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

