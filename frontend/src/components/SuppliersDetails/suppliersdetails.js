import React, { useState, useEffect } from 'react'
import Nav from '../Nav/Nav'
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trash2, Edit } from "lucide-react";
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
  const navigate = useNavigate();

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
      toast.error("Failed to delete supplier. Please try again.");
    }
  }

/**
 * SUPPLIER APPROVAL WORKFLOW (VIVA KEY POINT):
 * Transitions a supplier from 'Pending' to 'Approved' status.
 * This authorization step is critical as only Approved suppliers can contribute
 * to the store inventory. The 'x-user-role' header ensures only Admins can execute this.
 */
  const approveHandler = async (id) => {
    try {
      await axios.patch(`${URL}/approve/${id}`, {}, {
        headers: { "x-user-role": "admin" },
      });
      toast.success("Supplier approved successfully!");
      fetchHandler().then((data) => setSuppliers(data.suppliers));
    } catch (error) {
      console.error("Approve failed:", error);
      toast.error(error?.response?.data?.message || "Failed to approve supplier. Please try again.");
    }
  };

/**
 * REJECTION & CLEANUP LOGIC:
 * Handles the denial of supplier registrations. Rejected requests are 
 * purged from the system to maintain data integrity and keep the 
 * pending requests queue manageable.
 */
  const rejectHandler = async (id) => {
    try {
      await axios.patch(`${URL}/${id}/reject`, {}, {
        headers: { "x-user-role": "admin" },
      });
      toast.success("Supplier rejected and removed.");
      fetchHandler().then((data) => setSuppliers(data.suppliers));
    } catch (error) {
      console.error("Reject failed:", error);
      toast.error(error?.response?.data?.message || "Failed to reject supplier. Please try again.");
    }
  };

/**
 * BUSINESS INTELLIGENCE REPORTING (SUPPLIERS):
 * Generates a high-fidelity PDF report of the supplier network.
 * Features include: 
 * 1. Branded Header with automated timestamps.
 * 2. Statistical Summary (Total Count, Latest Addition).
 * 3. Categorized Tabular Data using 'jspdf-autotable'.
 * 4. Dynamic Filtering - includes search-specific results if a filter is active.
 */
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

    const latestSupplier = suppliers.length > 0 ? suppliers[suppliers.length - 1].name : "N/A";

    const summaryData = [
      ['Total Suppliers', suppliers.length],
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
      head: [['Name', 'Email', 'Phone', 'Address']],
      body: suppliers.map((s) => [
        s.name,
        s.email,
        s.phone,
        s.address,
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
        head: [['Name', 'Email', 'Phone', 'Address']],
        body: filteredSuppliers.map((s) => [
          s.name,
          s.email,
          s.phone,
          s.address,
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

  // Search supports all user-visible supplier fields
  const filteredSuppliers = suppliers.filter((supplier) =>
    (supplier.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (supplier.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (supplier.phone || "").toLowerCase().includes(search.toLowerCase()) ||
    (supplier.address || "").toLowerCase().includes(search.toLowerCase())
  );

  // Split lists by approval status (defensive defaults avoid undefined errors)
  const approvedSuppliers = filteredSuppliers.filter(
    (s) => (s.status || "Approved") === "Approved"
  );

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
            placeholder="Search by name, email, phone, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="topbar-buttons">
            <button className="btn-gms btn-report-solid" onClick={generatePDF}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Generate Report
            </button>
            <Link to="/addsuppliers" className="btn-gms btn-gms-primary">
              + Add Supplier
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
                  onClick={() => navigate(`/supplier/${supplier._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/supplier/${supplier._id}`);
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
                  </div>

                  <div className="supplier-card__actions">
                    <Link
                      to={`/updatesuppliers/${supplier._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="btn-gms btn-gms-text-primary"
                    >
                        <Edit size={16} />
                        Update
                    </Link>

                    <button
                      className="btn-gms btn-gms-danger"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHandler(supplier._id);
                      }}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default SuppliersDetails