import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Nav from "../Nav/Nav";
import "./SupplementDetails.css";
import toast from "react-hot-toast";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

/**
 * SupplementDetails Component
 * Displays a detailed, single-page view of a specific supplement.
 */
function SupplementDetails() {
  const { id } = useParams(); // Get the supplement ID from the URL
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [supplement, setSupplement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [qtyError, setQtyError] = useState("");

  // Session state for permission checks
  const currentUserId = localStorage.getItem("supplierId");
  const userRole = user?.role || localStorage.getItem("userRole");
  const isAdmin = userRole === "admin" || localStorage.getItem("isAdmin") === "true";

  // API Endpoint for supplements
  const SUPPLEMENTS_URL = "http://localhost:5000/supplements";

  /**
   * Fetches the specific supplement data from the backend.
   */
  useEffect(() => {
    const fetchSupplement = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${SUPPLEMENTS_URL}/${id}`);
        setSupplement(res.data?.supplement || null);
      } catch (e) {
        toast.error(e?.response?.data?.message || "Failed to load supplement details.");
        console.error("Error fetching supplement details:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplement();
  }, [id]);

  /**
   * Helper function to format price with thousands separator
   */
  const formatPrice = (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value ?? "");
    return n.toLocaleString();
  };

  /**
   * Handles deletion of the supplement with confirmation.
   */
  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this supplement? This cannot be undone.");
    if (!ok) return;

    try {
      await axios.delete(`${SUPPLEMENTS_URL}/${id}`);
      toast.success("Supplement deleted successfully!");
      navigate("/supplementsdetails"); // Redirect back to store after deletion
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete supplement. Please try again.");
    }
  };

  const handleAddToCart = () => {
    if (!supplement) return;
    addToCart(supplement, quantity);
  };

  const handleBuyNow = () => {
    if (!supplement) return;
    
    // Path A: Direct Buy
    // Navigate to checkout with ONLY this product's data, ignoring current cart
    const directBuyItem = {
      ...supplement,
      quantity: quantity
    };
    
    toast.success("Redirecting to checkout...");
    navigate("/checkout", { state: { items: [directBuyItem] } });
  };

  if (loading) {
    return (
      <div className="supplement-details-page">
        <Nav />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading Supplement Details...</p>
        </div>
      </div>
    );
  }

  if (!supplement) {
    return (
      <div className="supplement-details-page">
        <Nav />
        <div className="not-found-container">
          <h2>Supplement Not Found</h2>
          <p>We couldn't find the supplement you're looking for.</p>
          <button className="back-btn" onClick={() => navigate("/supplementsdetails")}>
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="supplement-details-page">
      <Nav />
      <div className="details-main-container">
        {/* --- Header Section --- */}
        <header className="details-header">
          <button className="back-link" onClick={() => navigate("/supplementsdetails")}>
            &larr; Back to Store
          </button>
          <h1>Supplement Details</h1>
        </header>

        {/* --- Main Two-Column Layout --- */}
        <div className="details-grid">
          {/* Left Column: Product Photo */}
          <div className="details-media-section">
            <div className="photo-frame">
              {supplement.photoUrl ? (
                <img 
                  src={supplement.photoUrl} 
                  alt={supplement.supplementName} 
                  className="product-large-img" 
                />
              ) : (
                <div className="product-placeholder">
                  {supplement.supplementName?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Information */}
          <div className="details-content-section">
            <div className="product-identity">
              <h2 className="product-title">{supplement.supplementName}</h2>
              <div className="badge-group">
                <span className="badge badge-brand">{supplement.supplementBrand}</span>
                <span className="badge badge-category">{supplement.category}</span>
              </div>
            </div>

            <div className="product-pricing">
              <span className="price-label">Price:</span>
              <span className="price-value">Rs. {formatPrice(supplement.price)}</span>
            </div>

            <div className="product-specs-grid">
              <div className="spec-item">
                <span className="spec-label">Weight</span>
                <span className="spec-value">{supplement.weight || "N/A"}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Stock Available</span>
                {supplement.availableStock === 0 ? (
                  <span className="spec-value stock-out-of-stock">OUT OF STOCK</span>
                ) : supplement.availableStock <= 5 ? (
                  <span className="spec-value stock-low-stock">
                    Only {supplement.availableStock} items left! Hurry up!
                  </span>
                ) : (
                  <span className="spec-value">{supplement.availableStock} units</span>
                )}
              </div>
              <div className="spec-item">
                <span className="spec-label">Product Type</span>
                <span className="spec-value">{supplement.supplementProduct || "N/A"}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Expiry Date</span>
                <span className="spec-value">
                  {supplement.expiryDate ? new Date(supplement.expiryDate).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{supplement.description || "No description provided for this product."}</p>
            </div>

            {/* --- Shopping Actions --- */}
            <div className="shopping-actions">
              {userRole === 'user' ? (
                <div className="quantity-selector-container">
                  <div className="quantity-selector">
                    <button 
                      onClick={() => {
                        setQuantity(q => Math.max(1, q - 1));
                        setQtyError("");
                      }}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val < 1) {
                          setQuantity(1);
                          setQtyError("");
                        } else if (val > supplement.availableStock) {
                          setQuantity(supplement.availableStock);
                          setQtyError(`Only ${supplement.availableStock} units available in stock`);
                        } else {
                          setQuantity(val);
                          setQtyError("");
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (quantity < supplement.availableStock) {
                          setQuantity(prev => prev + 1);
                          setQtyError("");
                        } else {
                          setQtyError(`Only ${supplement.availableStock} units available in stock`);
                        }
                      }}
                      disabled={quantity >= supplement.availableStock}
                      className={quantity >= supplement.availableStock ? "disabled-plus" : ""}
                    >
                      +
                    </button>
                  </div>
                  {qtyError && <p className="qty-error-text">{qtyError}</p>}
                </div>
              ) : (
                <div className="stock-info-label">
                  <span className="label">Current Stock:</span>
                  <span className="value">{supplement.availableStock} units</span>
                </div>
              )}

              <div className="shopping-buttons">
                {userRole === 'user' && (
                  <>
                    <button 
                      className="buy-now-btn" 
                      onClick={handleBuyNow}
                      disabled={supplement.availableStock === 0}
                    >
                      Buy Now
                    </button>
                    <button 
                      className="add-to-cart-btn" 
                      onClick={handleAddToCart}
                      disabled={supplement.availableStock === 0}
                    >
                      {supplement.availableStock > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* --- Supplier Information Section --- */}
            <div className="supplier-info-card">
              <div className="supplier-info-header">
                <span className="sold-by-label">Sold By</span>
              </div>
              <div className="supplier-info-content">
                <div className="supplier-avatar-mini">
                  {supplement.supplierId?.photoUrl ? (
                    <img src={supplement.supplierId.photoUrl} alt={supplement.supplierId.name} />
                  ) : (
                    <span className="avatar-initial">{supplement.supplierId?.name?.charAt(0) || "?"}</span>
                  )}
                </div>
                <div className="supplier-details-mini">
                  <div className="supplier-name-mini">{supplement.supplierId?.name || "Unknown Supplier"}</div>
                  {isAdmin && (
                    <div className="supplier-email-mini">{supplement.supplierId?.email || "N/A"}</div>
                  )}
                </div>
              </div>
            </div>

            {/* --- Management Actions Section (Visible only to Owner or Admin) --- */}
            {(isAdmin || (currentUserId && supplement.supplierId === currentUserId || (supplement.supplierId?._id && supplement.supplierId._id === currentUserId))) && (
              <div className="details-actions">
                <button 
                  className="mgmt-btn mgmt-btn--edit" 
                  onClick={() => navigate(`/updatesupplements/${supplement._id}`)}
                >
                  Edit Supplement
                </button>
                <button 
                  className="mgmt-btn mgmt-btn--delete" 
                  onClick={() => handleDelete(supplement._id)}
                >
                  Delete Supplement
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplementDetails;
