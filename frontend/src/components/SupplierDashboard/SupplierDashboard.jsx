import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import Nav from "../Nav/Nav";
import "./SupplierDashboard.css";
import toast from "react-hot-toast";
import { Bell, User, Plus, Info, AlertTriangle, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * SupplierDashboard Component
 * Provides a management view for a logged-in supplier.
 * Displays owned supplements and their status.
 */
function SupplierDashboard() {
  const { id } = useParams(); // Supplier ID from URL
  const sessionSupplierId = localStorage.getItem("supplierId");
  const finalId = id || sessionSupplierId;

  const navigate = useNavigate();
  const [supplements, setSupplements] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // Reorder Modal State
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState(null);
  const [reorderQuantity, setReorderQuantity] = useState(1);
  const [reordering, setReordering] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // API Endpoints
  const SUPPLEMENTS_URL = "http://localhost:5000/supplements";
  const SUPPLIERS_URL = "http://localhost:5000/suppliers";

  /**
   * Fetches full supplier profile data.
   */
  const fetchSupplierProfile = async () => {
    if (!finalId) return;
    try {
      setProfileLoading(true);
      const res = await axios.get(`${SUPPLIERS_URL}/${finalId}`);
      setSupplier(res.data?.supplier || null);
    } catch (e) {
      console.error("Error fetching supplier profile:", e);
    } finally {
      setProfileLoading(false);
    }
  };

  /**
   * Fetches supplements belonging to this supplier.
   */
  const fetchOwnedSupplements = async () => {
    if (!finalId) {
      toast.error("No supplier session found. Please login.");
      navigate("/supplier-login");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${SUPPLEMENTS_URL}/supplier/${finalId}`);
      setSupplements(res.data?.supplements ?? []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load your supplements.");
      console.error("Error fetching supplier supplements:", e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches notifications for this supplier.
   */
  const fetchNotifications = async () => {
    if (!finalId) return;
    try {
      const res = await axios.get(`http://localhost:5000/notifications/supplier/${finalId}`);
      setNotifications(res.data?.notifications ?? []);
    } catch (e) {
      console.error("Error fetching notifications:", e);
    }
  };

  useEffect(() => {
    fetchSupplierProfile();
    fetchOwnedSupplements();
    fetchNotifications();
  }, [finalId]);

  /**
   * Handle reorder stock
   */
  const handleReorder = async (e) => {
    e.preventDefault();
    if (!selectedSupplement) return;

    try {
      setReordering(true);
      const res = await axios.put(`${SUPPLEMENTS_URL}/reorder/${selectedSupplement._id}`, {
        newQuantity: Number(reorderQuantity)
      });
      
      toast.success(res.data.message || "Stock updated successfully!");
      
      // Update local state for "Instant Sync"
      setSupplements(prev => prev.map(s => 
        s._id === selectedSupplement._id ? res.data.supplement : s
      ));
      
      setIsReorderModalOpen(false);
      setSelectedSupplement(null);
      setReorderQuantity(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update stock.");
    } finally {
      setReordering(false);
    }
  };

  const openReorderModal = (s) => {
    setSelectedSupplement(s);
    setReorderQuantity(1);
    setIsReorderModalOpen(true);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await axios.patch(`http://localhost:5000/notifications/${notification._id}/read`);
        fetchNotifications(); // Refresh notifications
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // If it's a restock request, open the modal
    if (notification.type === 'restock_request' && notification.relatedSupplementId) {
      const supplementToRestock = supplements.find(s => s._id === notification.relatedSupplementId._id);
      if (supplementToRestock) {
        openReorderModal(supplementToRestock);
        setShowNotifications(false); // Close notification panel
      }
    }
  };

  const handleShipmentUpdate = async (notificationId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/notifications/${notificationId}/shipment`, {
        shipmentStatus: newStatus
      });
      toast.success(`Order marked as ${newStatus}`);
      fetchNotifications(); // Refresh notifications to show updated status
    } catch (err) {
      toast.error("Failed to update shipment status");
      console.error(err);
    }
  };

  // Check if supplier is approved
  const isApproved = supplier?.status === "Approved";

  /**
   * Helper function to format price
   */
  const formatPrice = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value ?? "");
    return n.toLocaleString();
  };

  /**
   * Generates a PDF report for the specific supplier's supplements and sales performance.
   */
  const generateSupplierReport = () => {
    try {
      const doc = new jsPDF();
      
      // Add Title
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text("Supplier Inventory & Sales Performance", 14, 22);
      
      // Add Supplier Info
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      doc.text(`Supplier: ${supplier?.name || "N/A"}`, 14, 32);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);

      // Performance Summary
      const totalStock = supplements.reduce((acc, s) => acc + (s.availableStock || 0), 0);
      const totalSalesCount = notifications.filter(n => n.type === 'order_notification' && n.shipmentStatus === 'Shipped').length;
      
      doc.setFontSize(10);
      doc.text(`Total Supplements Managed: ${supplements.length}`, 14, 48);
      doc.text(`Total Stock Available: ${totalStock}`, 14, 53);
      doc.text(`Orders Successfully Shipped: ${totalSalesCount}`, 14, 58);

      // Inventory Table
      const tableColumn = ["#", "Supplement Name", "Category", "Stock Status", "Price (Rs.)"];
      const tableRows = supplements.map((s, index) => [
        index + 1,
        s.supplementName || "N/A",
        s.category || "N/A",
        s.availableStock <= 5 ? `Low (${s.availableStock})` : `In Stock (${s.availableStock})`,
        formatPrice(s.price || 0)
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        styles: { fontSize: 9 }
      });

      // Sales Performance Table (Recent Orders)
      const salesColumn = ["Date", "Product", "Qty", "Buyer", "Status"];
      const recentSales = notifications
        .filter(n => n.type === 'order_notification')
        .slice(0, 10)
        .map(n => [
          new Date(n.createdAt).toLocaleDateString(),
          n.relatedSupplementId?.supplementName || "N/A",
          n.quantity || 0,
          n.buyerName || "N/A",
          n.shipmentStatus || "Pending"
        ]);

      if (recentSales.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Recent Sales Performance (Last 10 Orders)", 14, 22);
        autoTable(doc, {
          head: [salesColumn],
          body: recentSales,
          startY: 30,
          theme: "grid",
          headStyles: { fillColor: [16, 185, 129] } // Emerald-500
        });
      }

      doc.save(`${supplier?.name || "Supplier"}_Performance_Report.pdf`);
      toast.success("Supplier performance report generated!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate report.");
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="supplier-dashboard-page">
      <Nav />
      <div className="dashboard-container">
        {/* --- Dashboard Header --- */}
        <header className="dashboard-header">
          <div className="header-profile-section">
            <div className="profile-avatar-container">
              {supplier?.photoUrl ? (
                <img src={supplier.photoUrl} alt={supplier.name} className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <User size={48} strokeWidth={1.5} color="#94a3b8" />
                </div>
              )}
            </div>
            <div className="header-info">
              <div className="name-status-row">
                <h1>{supplier?.name || "Supplier Dashboard"}</h1>
                {supplier?.status && (
                  <span className={`profile-status-badge ${supplier.status.toLowerCase()}`}>
                    {supplier.status}
                  </span>
                )}
              </div>
              <p className="supplier-id-sub">ID: {finalId}</p>
              <p className="supplier-email-sub">{supplier?.email}</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn-gms btn-report-solid" 
              onClick={generateSupplierReport}
            >
              <FileText size={18} />
              Generate Report
            </button>

            {isApproved ? (
              <button 
                className="btn-gms btn-gms-primary add-new-btn" 
                onClick={() => navigate(`/addsupplements?supplierId=${finalId}`)}
              >
                <Plus size={20} strokeWidth={3} /> Add New Supplement
              </button>
            ) : (
              <div className="review-feedback-badge">
                Your account is under review. You can add supplements once approved by the Admin.
              </div>
            )}
          </div>
        </header>

        {/* --- Supplements Inventory Section --- */}
        <section className="inventory-section">
          <h2>My Supplements Inventory</h2>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your inventory...</p>
            </div>
          ) : supplements.length === 0 ? (
            <div className="empty-inventory">
              <p>You haven't added any supplements yet.</p>
              <button onClick={() => navigate(`/addsupplements?supplierId=${finalId}`)}>
                Start Adding Now
              </button>
            </div>
          ) : (
            <div className="inventory-grid">
              {supplements.map((s) => (
                <div 
                  key={s._id} 
                  className={`inventory-card status-${s.status?.toLowerCase()} ${s.availableStock === 0 ? "needs-restock-card" : ""}`}
                >
                  <div className="card-media">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.supplementName} />
                    ) : (
                      <div className="placeholder-icon">{s.supplementName?.charAt(0)}</div>
                    )}
                    <div className="badge-container">
                      <span className={`status-badge ${s.status?.toLowerCase()}`}>
                        {s.status || "Pending"}
                      </span>
                      {s.availableStock === 0 && (
                        <span className="restock-badge flex items-center gap-1">
                          <AlertTriangle size={12} /> Needs Restock
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <h3>{s.supplementName}</h3>
                    <p className="brand">{s.supplementBrand}</p>
                    
                    <div className="card-details">
                      <div className="detail">
                        <span className="label">Price</span>
                        <span className="value">Rs. {formatPrice(s.price)}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Stock</span>
                        <span className={`value ${s.availableStock === 0 ? "out-of-stock-text" : ""}`}>
                          {s.availableStock} units
                        </span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <Link to={`/supplement/${s._id}`} className="view-link">
                        View Details
                      </Link>
                      
                      {s.status === "Approved" && (
                        <button 
                          className="restock-btn" 
                          onClick={() => openReorderModal(s)}
                        >
                          Update Stock
                        </button>
                      )}

                      {s.status === "Pending" && (
                        <span className="status-note">Waiting for approval</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* --- Reorder Stock Modal --- */}
      {isReorderModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Update Stock</h2>
              <button className="close-modal" onClick={() => setIsReorderModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleReorder}>
              <div className="modal-body">
                <p>Add more stock for <strong>{selectedSupplement?.supplementName}</strong>.</p>
                <div className="form-group">
                  <label>Additional Quantity:</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={reorderQuantity} 
                    onChange={(e) => setReorderQuantity(e.target.value)} 
                    required 
                  />
                </div>
                <p className="stock-preview">
                  Current Stock: {selectedSupplement?.availableStock} <br />
                  New Total: {(selectedSupplement?.availableStock || 0) + Number(reorderQuantity)}
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsReorderModalOpen(false)}>Cancel</button>
                <button type="submit" className="confirm-btn" disabled={reordering}>
                  {reordering ? "Updating..." : "Confirm Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupplierDashboard;
