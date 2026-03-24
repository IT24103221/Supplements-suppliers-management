import React, { useState, useEffect } from 'react'
import Nav from '../Nav/Nav'
import axios from 'axios';
import './suppliersdetails.css';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const URL = "http://localhost:5000/suppliers";

// Centralized fetch function so list refresh logic can reuse it
const fetchHandler = async () => {
  return await axios.get(URL).then((res) => res.data);
}

function SuppliersDetails() { 
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const history = useNavigate();

  useEffect(() => {
    // Initial load for supplier catalog/dashboard
    fetchHandler().then((data) => {
      setSuppliers(data.suppliers);
    });
  }, []);

  // Delete supplier then refresh list to keep dashboard counts in sync
  const deleteHandler = async (id) => {
    try {
      await axios.delete(`${URL}/${id}`);
      fetchHandler().then((data) => {
        setSuppliers(data.suppliers);
      });
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete supplier. Please try again.");
    }
  }

  // Approve a pending request then refresh the lists
  const approveHandler = async (id) => {
    try {
      await axios.patch(`${URL}/${id}/approve`);
      fetchHandler().then((data) => setSuppliers(data.suppliers));
    } catch (error) {
      console.error("Approve failed:", error);
      alert("Failed to approve supplier. Please try again.");
    }
  };

  const rejectHandler = async (id) => {
    try {
      await axios.patch(`${URL}/${id}/reject`);
      fetchHandler().then((data) => setSuppliers(data.suppliers));
    } catch (error) {
      console.error("Reject failed:", error);
      alert("Failed to reject supplier. Please try again.");
    }
  };

  // Search supports all user-visible supplier fields
  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    supplier.email.toLowerCase().includes(search.toLowerCase()) ||
    supplier.phone.toLowerCase().includes(search.toLowerCase()) ||
    supplier.address.toLowerCase().includes(search.toLowerCase()) ||
    (supplier.supplimentCategory || "").toLowerCase().includes(search.toLowerCase()) ||
    (supplier.supplimentProduct || "").toLowerCase().includes(search.toLowerCase())
  );

  // Split lists by approval status (defensive defaults avoid undefined errors)
  const approvedSuppliers = filteredSuppliers.filter(
    (s) => (s.status || "Approved") === "Approved"
  );
  const pendingSuppliers = filteredSuppliers.filter((s) => s.status === "Pending");

  // ===== PDF REPORT GENERATOR =====
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date().toLocaleString();

    // ── Header Background ──
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 30, 'F');

    // ── Title ──
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Suppliers Report', pageWidth / 2, 18, { align: 'center' });

    // ── Generated date ──
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${now}`, pageWidth / 2, 26, { align: 'center' });

    // ── Dashboard Summary ──
    doc.setTextColor(26, 26, 46);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Dashboard Summary', 14, 42);

    const uniqueCategories = [...new Set(suppliers.map((s) => (s.supplimentCategory || "").trim()).filter(Boolean))].length;
    const uniqueProducts = [...new Set(suppliers.map((s) => (s.supplimentProduct || "").trim()).filter(Boolean))].length;
    const latestSupplier = suppliers.length > 0 ? suppliers[suppliers.length - 1].name : "N/A";

    const summaryData = [
      ['Total Suppliers', suppliers.length],
      ['Total Supplement Categories', uniqueCategories],
      ['Total Supplement Products', uniqueProducts],
      ['Latest Supplier', latestSupplier],
    ];

    autoTable(doc, {
      startY: 46,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [233, 69, 96],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
      },
    });

    // ── All Suppliers Table ──
    const afterSummary = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 46);
    doc.text('All Suppliers', 14, afterSummary);

    autoTable(doc, {
      startY: afterSummary + 4,
      head: [['Name', 'Email', 'Phone', 'Address', 'Category', 'Product']],
      body: suppliers.map((s) => [
        s.name,
        s.email,
        s.phone,
        s.address,
        s.supplimentCategory || "-",
        s.supplimentProduct || "-",
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [26, 26, 46],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: { fillColor: [250, 250, 255] },
      margin: { left: 14, right: 14 },
    });

    // ── Search Filtered Results (only if search is active) ──
    if (search.trim() !== "") {
      const afterAll = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 46);
      doc.text(`Search Results for: "${search}"`, 14, afterAll);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(`${filteredSuppliers.length} result(s) found`, 14, afterAll + 6);

      autoTable(doc, {
        startY: afterAll + 10,
        head: [['Name', 'Email', 'Phone', 'Address', 'Category', 'Product']],
        body: filteredSuppliers.map((s) => [
          s.name,
          s.email,
          s.phone,
          s.address,
          s.supplimentCategory || "-",
          s.supplimentProduct || "-",
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [233, 69, 96],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50],
        },
        alternateRowStyles: { fillColor: [255, 245, 247] },
        margin: { left: 14, right: 14 },
      });
    }

    // ── Footer on every page ──
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(26, 26, 46);
      doc.rect(0, doc.internal.pageSize.getHeight() - 12, pageWidth, 12, 'F');
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `Page ${i} of ${pageCount}  |  Suppliers Management System`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 4,
        { align: 'center' }
      );
    }

    doc.save(`suppliers_report_${Date.now()}.pdf`);
  };

  return (
    <div>
      <Nav />
      <div className="suppliers-container">

        {/* Title */}
        <div className="title-section">
          <h1>Suppliers Details</h1>
        </div>

        {/* Mini Dashboard Cards */}
        <div className="dashboard-cards">
          <div className="dash-card card-total">
            <div className="dash-card-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="dash-card-info">
              <h3>{suppliers.length}</h3>
              <p>Total Suppliers</p>
            </div>
          </div>

            <div className="dash-card card-companies">
            <div className="dash-card-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div className="dash-card-info">
              <h3>{[...new Set(suppliers.map((s) => (s.supplimentCategory || "").trim()).filter(Boolean))].length}</h3>
              <p>Total Supplement Categories</p>
            </div>
          </div>

            <div className="dash-card card-brands">
            <div className="dash-card-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div className="dash-card-info">
              <h3>{[...new Set(suppliers.map((s) => (s.supplimentProduct || "").trim()).filter(Boolean))].length}</h3>
              <p>Total Supplement Products</p>
            </div>
          </div>

          <div className="dash-card card-latest">
            <div className="dash-card-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="dash-card-info">
              <h3 className="latest-supplier-name">
                {suppliers.length > 0 ? suppliers[suppliers.length - 1].name : "N/A"}
              </h3>
              <p>Latest Supplier</p>
            </div>
          </div>
        </div>

        {/* Top bar */}
        <div className="suppliers-topbar">
          <input
            type="text"
            className="search-bar"
            placeholder="Search by name, email, phone, address, category or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="topbar-buttons">
            <button className="btn-report" onClick={generatePDF}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Generate Report
            </button>
            <Link to="/addsuppliers">
              <button className="add-supplier-btn">+ Add Supplier</button>
            </Link>
          </div>
        </div>

        {/* Approved suppliers (main list) */}
        {approvedSuppliers.length === 0 ? (
          <div className="empty-msg">No approved suppliers found.</div>
        ) : (
          <div className="suppliers-catalog">
            {approvedSuppliers.map((supplier) => {
              const name = supplier?.name || "";
              const initial = (name.trim()[0] || "?").toUpperCase();

              return (
                <div
                  key={supplier._id}
                  className="supplier-card"
                  onClick={() => history(`/supplier/${supplier._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      history(`/supplier/${supplier._id}`);
                    }
                  }}
                  title="Click to view supplier details"
                >
                  <div className="supplier-card__top">
                    <div className="supplier-avatar">
                      {supplier.photoUrl ? (
                        <img src={supplier.photoUrl} alt={`${name} avatar`} />
                      ) : (
                        <span className="supplier-avatar__initial">
                          {initial}
                        </span>
                      )}
                    </div>

                    <div className="supplier-card__title">
                      <div className="supplier-card__name">{supplier.name}</div>
                      <div className="supplier-card__id">{supplier._id}</div>
                    </div>
                  </div>

                  <div className="supplier-card__meta">
                    <div className="supplier-meta__row">
                      <span className="supplier-meta__label">Email</span>
                      <span className="supplier-meta__value">
                        {supplier.email}
                      </span>
                    </div>
                    <div className="supplier-meta__row">
                      <span className="supplier-meta__label">Phone</span>
                      <span className="supplier-meta__value">
                        {supplier.phone}
                      </span>
                    </div>
                    <div className="supplier-meta__row">
                      <span className="supplier-meta__label">Category</span>
                      <span className="supplier-meta__value">
                        {supplier.supplimentCategory || "-"}
                      </span>
                    </div>
                    <div className="supplier-meta__row">
                      <span className="supplier-meta__label">Product</span>
                      <span className="supplier-meta__value">
                        {supplier.supplimentProduct || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="supplier-card__actions">
                    <Link
                      to={`/updatesuppliers/${supplier._id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn-update"
                        onClick={(e) => e.stopPropagation()}
                        type="button"
                      >
                        Update
                      </button>
                    </Link>

                    <button
                      className="btn-delete"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHandler(supplier._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending requests section */}
        <div className="pending-section">
          <div className="pending-section__header">
            <h2>Pending Requests</h2>
            <span className="pending-section__count">{pendingSuppliers.length}</span>
          </div>

          {pendingSuppliers.length === 0 ? (
            <div className="pending-section__empty">No pending requests.</div>
          ) : (
            <div className="suppliers-catalog pending-catalog">
              {pendingSuppliers.map((supplier) => {
                const name = supplier?.name || "";
                const initial = (name.trim()[0] || "?").toUpperCase();

                return (
                  <div
                    key={supplier._id}
                    className="supplier-card supplier-card--pending"
                    onClick={() => history(`/supplier/${supplier._id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        history(`/supplier/${supplier._id}`);
                      }
                    }}
                    title="Click to view supplier details"
                  >
                    <div className="supplier-card__top">
                      <div className="supplier-avatar">
                        {supplier.photoUrl ? (
                          <img src={supplier.photoUrl} alt={`${name} avatar`} />
                        ) : (
                          <span className="supplier-avatar__initial">{initial}</span>
                        )}
                      </div>

                      <div className="supplier-card__title">
                        <div className="supplier-card__name">{supplier.name}</div>
                        <div className="supplier-card__id">{supplier._id}</div>
                        <div className="pending-badge">Pending</div>
                      </div>
                    </div>

                    <div className="supplier-card__meta">
                      <div className="supplier-meta__row">
                        <span className="supplier-meta__label">Email</span>
                        <span className="supplier-meta__value">{supplier.email}</span>
                      </div>
                      <div className="supplier-meta__row">
                        <span className="supplier-meta__label">Phone</span>
                        <span className="supplier-meta__value">{supplier.phone}</span>
                      </div>
                      <div className="supplier-meta__row">
                        <span className="supplier-meta__label">Category</span>
                        <span className="supplier-meta__value">{supplier.supplimentCategory || "-"}</span>
                      </div>
                      <div className="supplier-meta__row">
                        <span className="supplier-meta__label">Product</span>
                        <span className="supplier-meta__value">{supplier.supplimentProduct || "-"}</span>
                      </div>
                    </div>

                    <div className="supplier-card__actions">
                      <button
                        className="btn-approve"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          approveHandler(supplier._id);
                        }}
                      >
                        Approve
                      </button>

                      <button
                        className="btn-reject"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rejectHandler(supplier._id);
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default SuppliersDetails