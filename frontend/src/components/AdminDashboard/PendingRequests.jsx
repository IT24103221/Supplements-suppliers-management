import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Nav from "../Nav/Nav";
import "./PendingRequests.css";
import "../SuppliersDetails/suppliersdetails.css";

const SUPPLEMENTS_URL = "http://localhost:5000/supplements";
const SUPPLIERS_URL = "http://localhost:5000/suppliers";

function PendingRequests() {
  const [pendingSupplements, setPendingSupplements] = useState([]);
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("suppliers"); // "suppliers" or "supplements"
  
  // Modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewType, setReviewType] = useState(null); // "supplier" or "supplement"
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppRes, suppliRes] = await Promise.all([
        axios.get(`${SUPPLEMENTS_URL}/pending`, { headers: { "x-user-role": "admin" } }),
        axios.get(`${SUPPLIERS_URL}/pending`, { headers: { "x-user-role": "admin" } })
      ]);
      setPendingSupplements(suppRes.data?.supplements ?? []);
      setPendingSuppliers(suppliRes.data?.suppliers ?? []);
    } catch (e) {
      toast.error("Failed to load pending requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openReviewModal = (item, type) => {
    setSelectedItem(item);
    setReviewType(type);
    setShowRejectInput(false);
    setRejectionReason("");
  };

  const closeReviewModal = () => {
    setSelectedItem(null);
    setReviewType(null);
    setShowRejectInput(false);
    setRejectionReason("");
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    try {
      const url = reviewType === 'supplement' 
        ? `${SUPPLEMENTS_URL}/approve/${selectedItem._id}` 
        : `${SUPPLIERS_URL}/approve/${selectedItem._id}`;
      
      await axios.patch(url, {}, { headers: { "x-user-role": "admin" } });
      toast.success(`${reviewType.charAt(0).toUpperCase() + reviewType.slice(1)} approved!`);
      
      // Real-time UI update: remove from local state
      if (reviewType === 'supplement') {
        setPendingSupplements(prev => prev.filter(s => s._id !== selectedItem._id));
      } else {
        setPendingSuppliers(prev => prev.filter(s => s._id !== selectedItem._id));
      }
      closeReviewModal();
    } catch (e) {
      toast.error(`Failed to approve ${reviewType}.`);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    try {
      const url = reviewType === 'supplement' 
        ? `${SUPPLEMENTS_URL}/reject/${selectedItem._id}` 
        : `${SUPPLIERS_URL}/reject/${selectedItem._id}`;
      
      await axios.patch(url, { reason: rejectionReason }, { headers: { "x-user-role": "admin" } });
      toast.success(`${reviewType.charAt(0).toUpperCase() + reviewType.slice(1)} rejected.`);
      
      // Real-time UI update: remove from local state
      if (reviewType === 'supplement') {
        setPendingSupplements(prev => prev.filter(s => s._id !== selectedItem._id));
      } else {
        setPendingSuppliers(prev => prev.filter(s => s._id !== selectedItem._id));
      }
      closeReviewModal();
    } catch (e) {
      toast.error(`Failed to reject ${reviewType}.`);
    }
  };

  return (
    <div className="pending-requests-page">
      <Nav />
      <div className="suppliers-container">
        <div className="title-section pending-header-section">
          <h1>Review Pending Requests</h1>
          <p className="subtitle-text">
            Manage and approve new supplier applications and supplement listings.
          </p>
        </div>

        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActiveTab('suppliers')}
          >
            Pending Suppliers
            {pendingSuppliers.length > 0 && <span className="tab-badge">{pendingSuppliers.length}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'supplements' ? 'active' : ''}`}
            onClick={() => setActiveTab('supplements')}
          >
            Pending Supplements
            {pendingSupplements.length > 0 && <span className="tab-badge">{pendingSupplements.length}</span>}
          </button>
        </div>

        {loading ? (
          <div className="empty-msg">Loading requests...</div>
        ) : (
          <div className="tab-content">
            {activeTab === 'suppliers' ? (
              pendingSuppliers.length === 0 ? (
                <div className="empty-msg">No pending supplier registrations.</div>
              ) : (
                <table className="suppliers-table">
                  <thead>
                    <tr>
                      <th>Supplier Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSuppliers.map((s) => (
                      <tr key={s._id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.phone}</td>
                        <td>
                          <button className="btn-gms btn-gms-primary btn-review" onClick={() => openReviewModal(s, 'supplier')}>Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              pendingSupplements.length === 0 ? (
                <div className="empty-msg">No pending supplement reviews.</div>
              ) : (
                <table className="suppliers-table">
                  <thead>
                    <tr>
                      <th>Supplement</th>
                      <th>Brand</th>
                      <th>Price</th>
                      <th>Added By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSupplements.map((s) => (
                      <tr key={s._id}>
                        <td>{s.supplementName}</td>
                        <td>{s.supplementBrand}</td>
                        <td>Rs. {s.price}</td>
                        <td>{s.supplierId?.name || "Unknown Supplier"}</td>
                        <td>
                          <button className="btn-gms btn-gms-primary btn-review" onClick={() => openReviewModal(s, 'supplement')}>Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={closeReviewModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeReviewModal}>&times;</button>
            
            <div className="review-grid">
              <div className="review-media">
                {selectedItem.photoUrl ? (
                  <img src={selectedItem.photoUrl} alt="Preview" className="review-photo" />
                ) : (
                  <div className="review-photo" style={{ display: 'grid', placeItems: 'center', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '48px', fontWeight: 'bold' }}>
                    {reviewType === 'supplier' ? selectedItem.name?.[0] : selectedItem.supplementName?.[0]}
                  </div>
                )}
              </div>
              <div className="review-info">
                <h2>{reviewType === 'supplier' ? selectedItem.name : selectedItem.supplementName}</h2>
                
                {reviewType === 'supplier' ? (
                  <>
                    <div className="info-row">
                      <div className="info-label">Supplier ID</div>
                      <div className="info-value">{selectedItem._id}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Email</div>
                      <div className="info-value">{selectedItem.email}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Phone</div>
                      <div className="info-value">{selectedItem.phone}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Address</div>
                      <div className="info-value">{selectedItem.address}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="info-row">
                      <div className="info-label">Brand</div>
                      <div className="info-value">{selectedItem.supplementBrand}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Category</div>
                      <div className="info-value">{selectedItem.category}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Price</div>
                      <div className="info-value">Rs. {selectedItem.price}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Description</div>
                      <div className="info-value">{selectedItem.description || "No description provided."}</div>
                    </div>
                    
                    {/* Supplier Details Section for Supplements */}
                    <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div className="info-label" style={{ color: '#2563eb', marginBottom: '8px' }}>Supplier Details</div>
                      <div className="info-row" style={{ marginBottom: '4px' }}>
                        <span className="info-label" style={{ fontSize: '10px' }}>Name:</span>
                        <span className="info-value" style={{ marginLeft: '8px', fontSize: '13px' }}>{selectedItem.supplierId?.name || "Unknown"}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label" style={{ fontSize: '10px' }}>Email:</span>
                        <span className="info-value" style={{ marginLeft: '8px', fontSize: '13px' }}>{selectedItem.supplierId?.email || "N/A"}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {!showRejectInput ? (
              <div className="modal-actions">
                <button className="btn-approve-lg" onClick={handleApprove}>Approve Request</button>
                <button className="btn-reject-lg" onClick={() => setShowRejectInput(true)}>Reject</button>
              </div>
            ) : (
              <div className="rejection-input-container">
                <div className="info-label" style={{ marginBottom: 8 }}>Reason for Rejection</div>
                <textarea 
                  className="rejection-textarea"
                  placeholder="Explain why this request is being rejected..."
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
                <div className="modal-actions">
                  <button className="btn-reject-lg" style={{ backgroundColor: '#e11d48', color: 'white' }} onClick={handleReject}>Confirm Rejection</button>
                  <button className="btn-approve-lg" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }} onClick={() => setShowRejectInput(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingRequests;
