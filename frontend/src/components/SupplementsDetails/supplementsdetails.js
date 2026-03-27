import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Nav from "../Nav/Nav";
import "./supplementsdetails.css";
import { Link } from "react-router-dom";

import "../SuppliersDetails/suppliersdetails.css";

const SUPPLEMENTS_URL = "http://localhost:5000/supplements";

function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toLocaleString();
}

function SupplementsDetails() {
  const [supplements, setSupplements] = useState([]);
  const [search, setSearch] = useState("");

  const fetchSupplements = async () => {
    const res = await axios.get(SUPPLEMENTS_URL);
    setSupplements(res.data?.supplements ?? []);
  };

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const res = await axios.get(SUPPLEMENTS_URL);
        if (!alive) return;
        setSupplements(res.data?.supplements ?? []);
      } catch (e) {
        if (!alive) return;
        toast.error(
          e?.response?.data?.message || "Failed to load supplements."
        );
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

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
        <div className="title-section">
          <h1>Supplements Store</h1>
          <p style={{ color: "var(--gms-muted)", marginTop: 8 }}>
            {supplements.length} approved supplement(s)
          </p>
        </div>

        <div className="suppliers-topbar">
          <input
            type="text"
            className="search-bar"
            placeholder="Search by name, brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-msg">No approved supplements found.</div>
        ) : (
          <div className="store">
            {grouped.map(([category, items]) => (
              <section key={category} className="store-section">
                <div className="store-section__header">
                  <h2 className="store-section__title">{category}</h2>
                  <span className="store-section__count">{items.length}</span>
                </div>

                <div className="store-grid">
                  {items.map((s) => (
                    <article className="store-card" key={s._id}>
                      <div className="store-card__media">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.supplementName} />
                        ) : (
                          <div className="store-card__placeholder" aria-hidden="true">
                            {String(s.supplementName || "?").trim()[0]?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>

                      <div className="store-card__body">
                        <div className="store-card__name" title={s.supplementName}>
                          {s.supplementName}
                        </div>
                        <div className="store-card__brand" title={s.supplementBrand}>
                          {s.supplementBrand}
                        </div>
                        <div className="store-card__price">
                          Rs. {formatPrice(s.price)}
                        </div>

                        <div className="store-card__actions">
                          <Link className="store-card__btn store-card__btn--edit" to={`/updatesupplements/${s._id}`}>
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="store-card__btn store-card__btn--delete"
                            onClick={() => deleteSupplement(s._id)}
                          >
                            Delete
                          </button>
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

