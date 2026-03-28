import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import Nav from "../Nav/Nav";
import "./SupplierDashboard.css";
import toast from "react-hot-toast";

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

  useEffect(() => {
    fetchSupplierProfile();
    fetchOwnedSupplements();
  }, [finalId]);

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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
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
            {isApproved ? (
              <button 
                className="add-new-btn" 
                onClick={() => navigate(`/addsupplements?supplierId=${finalId}`)}
              >
                + Add New Supplement
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
                <div key={s._id} className={`inventory-card status-${s.status?.toLowerCase()}`}>
                  <div className="card-media">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.supplementName} />
                    ) : (
                      <div className="placeholder-icon">{s.supplementName?.charAt(0)}</div>
                    )}
                    <span className={`status-badge ${s.status?.toLowerCase()}`}>
                      {s.status || "Pending"}
                    </span>
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
                        <span className="value">{s.quantity} units</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <Link to={`/supplement/${s._id}`} className="view-link">
                        View Details
                      </Link>
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
    </div>
  );
}

export default SupplierDashboard;
