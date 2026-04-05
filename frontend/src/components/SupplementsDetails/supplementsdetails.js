import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Nav from "../Nav/Nav";
import "./supplementsdetails.css";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

import "../SuppliersDetails/suppliersdetails.css";

// API Endpoint for supplements
const SUPPLEMENTS_URL = "http://localhost:5000/supplements";

/**
 * Helper function to format price with thousands separator
 */
function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toLocaleString();
}

/**
 * SupplementsDetails Component
 * Displays a catalog of approved supplements grouped by category.
 */
function SupplementsDetails() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [supplements, setSupplements] = useState([]);
  const [search, setSearch] = useState("");
  const [notifying, setNotifying] = useState(null); // Track which supplement is being notified
  const [notifiedItems, setNotifiedItems] = useState([]); // Track which items have been notified in this session

  // Session state for permission checks
  const currentUserId = localStorage.getItem("supplierId");
  const userRole = user?.role || localStorage.getItem("userRole");
  const isAdmin = userRole === "admin" || localStorage.getItem("isAdmin") === "true";

  /**
   * Fetches all approved supplements from the backend.
   */
  const fetchSupplements = async () => {
    try {
      const res = await axios.get(SUPPLEMENTS_URL);
      setSupplements(res.data?.supplements ?? []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load supplements.");
    }
  };

  // Initial load effect
  useEffect(() => {
    fetchSupplements();
  }, []);

  /**
   * Handles deletion of a supplement record.
   * Includes confirmation dialog.
   */
  const deleteSupplement = async (id) => {
    const ok = window.confirm("Delete this supplement? This cannot be undone.");
    if (!ok) return;

    try {
      await axios.delete(`${SUPPLEMENTS_URL}/${id}`);
      toast.success("Supplement deleted successfully!");
      await fetchSupplements();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete supplement.");
    }
  };

  const handleNotify = async (supplement) => {
    // Try getting adminId from Context first, then localStorage
    const adminId = user?.id || user?._id || localStorage.getItem("adminId");
    
    if (!adminId) {
      toast.error("Admin session error. Please log in again.");
      return;
    }

    if (!supplement.supplierId) {
      toast.error("This supplement has no assigned supplier.");
      return;
    }

    setNotifying(supplement._id);

    try {
      await axios.post("http://localhost:5000/notifications", {
        recipientId: supplement.supplierId,
        senderId: adminId,
        message: `Admin requested a restock for ${supplement.supplementName}.`,
        type: "restock_request",
        relatedSupplementId: supplement._id,
      });
      toast.success("Notification sent to Supplier!");
      setNotifiedItems(prev => [...prev, supplement._id]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send notification.");
    } finally {
      setNotifying(null);
    }
  };

  /**
   * Filters supplements based on the search query.
   * Matches against Name, Brand, and Category.
   */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return supplements;
    return supplements.filter((s) => {
      const parts = [
        s.supplementName,
        s.supplementBrand,
        s.category,
      ].filter(Boolean);
      return parts.some((p) => String(p).toLowerCase().includes(q));
    });
  }, [search, supplements]);

  /**
   * Groups the filtered supplements by their category.
   * Returns an array of [category, items] pairs sorted by category name.
   */
  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of filtered) {
      const c = s.category || "Other";
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div>
      <Nav />
      <div className="suppliers-container">
        {/* --- Header & Summary Section --- */}
        <div className="title-section">
          <h1>Supplements Store</h1>
          <p className="summary-text">
            {supplements.length} approved supplement(s) available in the inventory.
          </p>
        </div>

        {/* --- Search & Actions Toolbar --- */}
        <div className="suppliers-topbar">
          <input
            type="text"
            className="search-bar"
            placeholder="Search by name, brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* --- Main Store Display --- */}
        {filtered.length === 0 ? (
          <div className="empty-msg">No approved supplements found.</div>
        ) : (
          <div className="store">
            {grouped.map(([category, items]) => (
              <section key={category} className="store-section">
                {/* Section Header */}
                <div className="store-section__header">
                  <h2 className="store-section__title">{category}</h2>
                  <span className="store-section__count">{items.length} items</span>
                </div>

                {/* Grid of Supplement Cards */}
                <div className="store-grid">
                  {items.map((s) => (
                    <article className="store-card" key={s._id}>
                      {/* --- Media Section (Prominent Photo) --- */}
                      <Link to={`/supplement/${s._id}`} className="store-card__media-link">
                        <div className="store-card__media">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} alt={s.supplementName} className="store-card__img" />
                          ) : (
                            <div className="store-card__placeholder" aria-hidden="true">
                              {String(s.supplementName || "?").trim()[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                          {s.availableStock === 0 && <div className="out-of-stock-badge">Out of Stock</div>}
                          <div className="store-card__badge">{s.category}</div>
                        </div>
                      </Link>

                      {/* --- Information Body Section --- */}
                      <div className="store-card__body">
                        {/* Title Section */}
                        <Link to={`/supplement/${s._id}`} className="store-card__title-link">
                          <div className="store-card__header">
                            <h3 className="store-card__name" title={s.supplementName}>
                              {s.supplementName}
                            </h3>
                            <span className="store-card__brand">{s.supplementBrand}</span>
                          </div>
                        </Link>

                        <div className="store-card__stock-info">
                          {s.availableStock === 0 ? (
                            <span className="stock-out-of-stock">OUT OF STOCK</span>
                          ) : s.availableStock <= 5 ? (
                            <span className="stock-low-stock">
                              Only {s.availableStock} left!
                            </span>
                          ) : (
                            <span className="stock-in-stock">In Stock</span>
                          )}
                        </div>

                        {/* Footer Section (Price & Actions) */}
                        <div className="store-card__footer">
                          <div className="store-card__price-tag">
                            <span className="price-currency">Rs.</span>
                            <span className="price-amount">{formatPrice(s.price)}</span>
                          </div>
                          <div className="store-card__actions">
                            {/* --- Customer View --- */}
                            {userRole === 'user' && (
                              <button
                                type="button"
                                className={`store-card__btn store-card__btn--cart ${s.availableStock === 0 ? 'disabled' : ''}`}
                                onClick={() => addToCart(s)}
                                disabled={s.availableStock === 0}
                              >
                                {s.availableStock > 0 ? "Add to Cart" : "Out of Stock"}
                              </button>
                            )}

                            <Link className="store-card__btn store-card__btn--view" to={`/supplement/${s._id}`}>
                              Details
                            </Link>
                            
                            {/* --- Admin & Supplier View --- */}
                            {(isAdmin || (currentUserId && s.supplierId === currentUserId)) && (
                              <>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    className="store-card__btn store-card__btn--delete"
                                    onClick={() => deleteSupplement(s._id)}
                                  >
                                    Delete
                                  </button>
                                )}
                                {isAdmin && s.availableStock === 0 && (
                                  <button
                                    type="button"
                                    className={`store-card__btn store-card__btn--notify ${notifiedItems.includes(s._id) ? 'notified' : ''}`}
                                    onClick={() => handleNotify(s)}
                                    disabled={notifying === s._id || notifiedItems.includes(s._id)}
                                  >
                                    {notifying === s._id ? "Notifying..." : notifiedItems.includes(s._id) ? "Notified" : "Notify Supplier"}
                                  </button>
                                )}
                                {currentUserId && s.supplierId === currentUserId && (
                                  <Link to={`/edit-supplement/${s._id}`} className="store-card__btn store-card__btn--edit">
                                    Edit
                                  </Link>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplementsDetails;
