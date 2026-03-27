import React, { useEffect, useMemo, useState } from "react";
import "./Nav.css";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";

function Nav() {
  const { pathname } = useLocation();
  const isAdmin = useMemo(() => {
    // This app doesn't have auth/roles; we treat admin pages as
    // anything except the landing pages and self-registration/add forms.
    if (pathname === "/" || pathname === "/mainhome") return false;
    if (pathname === "/supplier-register") return false;
    if (pathname === "/addsuppliers") return false;
    if (pathname === "/addsupplements") return false;
    return true;
  }, [pathname]);

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadPendingCount() {
      try {
        const res = await axios.get("http://localhost:5000/supplements/pending", {
          headers: { "x-user-role": "admin" },
        });
        const count = res.data?.supplements?.length ?? 0;
        if (alive) setPendingCount(count);
      } catch {
        // Keep navbar quiet; admin can refresh from the pending page.
      }
    }

    if (isAdmin) loadPendingCount();
    else setPendingCount(0);

    return () => {
      alive = false;
    };
  }, [isAdmin]);

  return (
    <div>
      <ul className="home-ul">
        <li className="home-1l">
          <Link to="/mainhome" className="nav-link">
            <h1>home</h1>
          </Link>
        </li>
        <li className="home-1l">
            <Link to="/addsuppliers" className="nav-link">
          <h1>ADD suppliers</h1>
          </Link>
        </li>
        <li className="home-1l">
             <Link to="/suppliersdetails" className="nav-link">
          <h1>suppliers details</h1>
          </Link>
        </li>
        <li className="home-1l">
          <Link to="/supplementsdetails" className="nav-link">
            <h1>supplements details</h1>
          </Link>
        </li>

        {isAdmin && (
          <li className="home-1l home-bell-li">
            <Link to="/pending-supplements" className="nav-bell-link" aria-label="Pending supplements">
              <svg
                className="nav-bell-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>

              {pendingCount > 0 ? (
                <span
                  className="nav-bell-badge"
                  aria-label={`${pendingCount} pending`}
                >
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

export default Nav;