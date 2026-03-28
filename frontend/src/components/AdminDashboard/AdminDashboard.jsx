import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import Nav from "../Nav/Nav";
import "../SuppliersDetails/suppliersdetails.css";

const SUPPLEMENTS_URL = "http://localhost:5000/supplements";

function AdminDashboard() {
  const navigate = useNavigate();
  const [pendingSupplements, setPendingSupplements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SUPPLEMENTS_URL}/pending`, {
        headers: { "x-user-role": "admin" },
      });
      setPendingSupplements(res.data?.supplements ?? []);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Failed to load pending supplements."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="title-section">
          <h1>Pending Supplements</h1>
          <p style={{ color: "var(--gms-muted)", marginTop: 8 }}>
            {pendingSupplements.length} pending request(s)
          </p>
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

