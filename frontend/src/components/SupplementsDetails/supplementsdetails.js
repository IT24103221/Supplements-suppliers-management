import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Nav from "../Nav/Nav";
import "./supplementsdetails.css";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { AlertTriangle, Info, Trash2, Edit, ShoppingCart, Bell, Package, List, Zap, ExternalLink, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notifying, setNotifying] = useState(null); // Track which supplement is being notified
  const [notifiedItems, setNotifiedItems] = useState([]); // Track which items have been notified in this session

  // Session state for permission checks
  const currentUserId = user?.id || localStorage.getItem("supplierId");
  const userRole = user?.role || localStorage.getItem("userRole");
  const isAdmin = userRole === "admin";

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
   * Generates a PDF report of all current supplements.
   */
  const generateSupplementReport = () => {
    try {
      const doc = new jsPDF();
      
      // Add Title
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text("Supplements Inventory Report", 14, 22);
      
      // Add Timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Supplements: ${supplements.length}`, 14, 35);

      // Table Data
      const tableColumn = ["#", "Name", "Brand", "Category", "Stock", "Price (Rs.)"];
      const tableRows = supplements.map((s, index) => [
        index + 1,
        s.supplementName || "N/A",
        s.supplementBrand || "N/A",
        s.category || "N/A",
        s.availableStock ?? 0,
        formatPrice(s.price || 0)
      ]);

      // Generate Table using explicit autoTable call for better reliability
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" }, // Blue-600
        alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate-50
        margin: { top: 45 },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      // Save PDF
      doc.save(`Supplements_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Supplement report generated!");
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Failed to generate report.");
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
          {isAdmin && (
            <button 
              className="btn-gms btn-report-solid" 
              onClick={generateSupplementReport}
            >
              <FileText size={18} />
              Generate Report
            </button>
          )}
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
                            <span className="store-card__brand">{s.supplementBrand}</span>
                            <h3 className="store-card__name" title={s.supplementName}>
                              {s.supplementName}
                            </h3>
                          </div>
                        </Link>

                        {/* Footer Section (Price & Actions) */}
                        <div className="store-card__footer">
                          <div className="store-card__info-row">
                            <div className="store-card__stock-info">
                              {s.availableStock === 0 ? (
                                <span className="stock-out-of-stock">OUT OF STOCK</span>
                              ) : s.availableStock <= 5 ? (
                                <span className="stock-low-stock">Only {s.availableStock} left!</span>
                              ) : (
                                <span className="stock-in-stock">In Stock</span>
                              )}
                            </div>

                            <div className="store-card__price-tag">
                              <span className="price-currency">Rs.</span>
                              <span className="price-amount">{formatPrice(s.price)}</span>
                            </div>
                          </div>
                          
                          <div className="store-card__actions">
                            {/* --- Customer View --- */}
                            {userRole === 'user' && (
                              <div className="store-card__btn-grid">
                                <button
                                  type="button"
                                  className={`btn-gms btn-gms-primary ${s.availableStock === 0 ? 'disabled' : ''}`}
                                  onClick={() => addToCart(s)}
                                  disabled={s.availableStock === 0}
                                >
                                  <ShoppingCart size={18} />
                                  {s.availableStock > 0 ? "Add to Cart" : "Out of Stock"}
                                </button>
                                <Link className="btn-gms btn-gms-text-primary" to={`/supplement/${s._id}`}>
                                  <ExternalLink size={16} />
                                  Details
                                </Link>
                              </div>
                            )}

                            {/* --- Admin & Supplier View --- */}
                            {(isAdmin || (currentUserId && (s.supplierId === currentUserId || s.supplierId?._id === currentUserId))) && (
                              <div className="store-card__btn-grid">
                                {isAdmin && (
                                  <button
                                    type="button"
                                    className="btn-gms btn-gms-danger"
                                    onClick={() => deleteSupplement(s._id)}
                                  >
                                    <Trash2 size={16} />
                                    Delete
                                  </button>
                                )}
                                {currentUserId && (s.supplierId === currentUserId || s.supplierId?._id === currentUserId) && (
                                  <Link to={`/updatesupplements/${s._id}`} className="btn-gms btn-gms-primary">
                                    <Edit size={16} />
                                    Edit
                                  </Link>
                                )}
                                <Link className="btn-gms btn-gms-ghost" to={`/supplement/${s._id}`}>
                                    <ExternalLink size={16} />
                                    Details
                                  </Link>
                              </div>
                            )}

                            {isAdmin && s.availableStock === 0 && (
                              <button
                                type="button"
                                className={`btn-gms btn-gms-ghost ${notifiedItems.includes(s._id) ? 'notified' : ''}`}
                                onClick={() => handleNotify(s)}
                                disabled={notifying === s._id || notifiedItems.includes(s._id)}
                              >
                                <Bell size={16} />
                                {notifying === s._id ? "Notifying..." : notifiedItems.includes(s._id) ? "Notified" : "Notify Supplier"}
                              </button>
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
