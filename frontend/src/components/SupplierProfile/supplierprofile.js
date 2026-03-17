import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Nav from "../Nav/Nav";
import "./supplierprofile.css";

const URL = "http://localhost:5000/suppliers";

function SupplierProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${URL}/${id}`);
        if (!alive) return;
        setSupplier(res.data?.supplier ?? null);
      } catch (e) {
        if (!alive) return;
        setError("Failed to load supplier details. Please try again.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const rows = useMemo(() => {
    if (!supplier) return [];
    return [
      { label: "Supplier ID", value: supplier._id },
      { label: "Name", value: supplier.name },
      { label: "Email", value: supplier.email },
      { label: "Phone", value: supplier.phone },
      { label: "Address", value: supplier.address },
      { label: "Company", value: supplier.company },
      { label: "Supplement Brand", value: supplier.supplimentBrand },
    ];
  }, [supplier]);

  return (
    <div>
      <Nav />
      <div className="supplier-profile">
        <div className="supplier-profile__header">
          <div className="supplier-profile__heading">
            {supplier?.photoUrl ? (
              <div className="supplier-profile__avatar" aria-hidden="true">
                <img
                  src={supplier.photoUrl}
                  alt=""
                />
              </div>
            ) : supplier?.name ? (
              <div className="supplier-profile__avatar supplier-profile__avatar--placeholder" aria-hidden="true">
                {supplier.name.trim()[0]?.toUpperCase() || "?"}
              </div>
            ) : null}

            <div>
              <h1>Supplier Details</h1>
              <p className="supplier-profile__subtitle">
                View one supplier record.
              </p>
            </div>
          </div>
          <div className="supplier-profile__actions">
            <button
              className="supplier-profile__btn supplier-profile__btn--ghost"
              onClick={() => navigate("/suppliersdetails")}
              type="button"
            >
              Back to List
            </button>
            <button
              className="supplier-profile__btn"
              onClick={() => navigate(`/updatesuppliers/${id}`)}
              type="button"
              disabled={!supplier}
            >
              Update Supplier
            </button>
          </div>
        </div>

        {loading ? (
          <div className="supplier-profile__state">Loading...</div>
        ) : error ? (
          <div className="supplier-profile__state supplier-profile__state--error">
            {error}
          </div>
        ) : !supplier ? (
          <div className="supplier-profile__state">Supplier not found.</div>
        ) : (
          <div className="supplier-profile__card">
            <div className="supplier-profile__grid">
              {rows.map((r) => (
                <div className="supplier-profile__item" key={r.label}>
                  <div className="supplier-profile__label">{r.label}</div>
                  <div className="supplier-profile__value">
                    {String(r.value ?? "")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplierProfile;

