import React, { useEffect, useState } from "react";
import "./Nav.css";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Nav() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const [pendingCount, setPendingCount] = useState(0);

/**
 * AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC):
 * Determines the current user's role (admin, user, or supplier) and status.
 * These flags are used throughout the component to conditionally render 
 * navigation links and administrative features.
 */
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const isSupplier = user?.role === "supplier";

  // Check if current route is the Home Page (either "/" or "/mainhome")
  const isHomePage = location.pathname === "/mainhome" || location.pathname === "/";

/**
 * PENDING REQUEST MONITOR (ADMIN ONLY):
 * For Admin users, this effect polls the backend to count pending supplement 
 * and supplier requests. The result is displayed as a real-time notification 
 * badge on the 'Pending Requests' link.
 */
  useEffect(() => {
    let alive = true;

    async function loadPendingCount() {
      try {
        const [suppRes, suppliRes] = await Promise.all([
          axios.get("http://localhost:5000/supplements/pending", {
            headers: { "x-user-role": "admin" },
          }),
          axios.get("http://localhost:5000/suppliers/pending", {
            headers: { "x-user-role": "admin" },
          })
        ]);
        const count = (suppRes.data?.supplements?.length ?? 0) + (suppliRes.data?.suppliers?.length ?? 0);
        if (alive) setPendingCount(count);
      } catch {
        // Keep navbar quiet
      }
    }

    if (isAdmin) loadPendingCount();
    else setPendingCount(0);

    return () => {
      alive = false;
    };
  }, [isAdmin]);

  return (
    <nav style={{ margin: 0, padding: 0, width: '100%' }}>
      <ul className="home-ul">
        <li className="home-1l">
          <Link to="/mainhome" className="nav-link">
            <h1>home</h1>
          </Link>
        </li>
        
        {/* CONDITIONAL NAVIGATION: Supplements Store link is visible only after login and NOT on the Home Page */}
        {user && !isHomePage && (
          <li className="home-1l">
            <Link to="/supplementsdetails" className="nav-link">
              <h1>Supplements Store</h1>
            </Link>
          </li>
        )}

        {/* ROLE-SPECIFIC NAVIGATION LINKS */}
        {user && (
          <>
            {/* Supplier Dashboard & Notifications */}
            {isSupplier && (
              <>
                <li className="home-1l">
                  <Link to={`/supplier-dashboard/${user.id}`} className="nav-link">
                    <h1>Dashboard</h1>
                  </Link>
                </li>
                <li className="home-1l">
                  <Link to="/notifications" className="nav-link">
                    <h1>Notifications</h1>
                  </Link>
                </li>
              </>
            )}
            
            {/* Admin Management Links */}
            {isAdmin && (
              <>
                <li className="home-1l">
                  <Link to="/suppliersdetails" className="nav-link">
                    <h1>Manage Suppliers</h1>
                  </Link>
                </li>
                <li className="home-1l">
                  <Link to="/pending-requests" className="nav-link nav-pending-link">
                    <h1>Pending Requests</h1>
                    {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
                  </Link>
                </li>
              </>
            )}

            {/* Regular User (Customer) Links */}
            {isUser && (
              <>
                <li className="home-1l">
                  <Link to="/cart" className="nav-link">
                    <h1>Cart</h1>
                  </Link>
                </li>
                <li className="home-1l">
                  <Link to="/my-orders" className="nav-link">
                    <h1>My Orders</h1>
                  </Link>
                </li>
              </>
            )}

            <li className="home-1l">
              <button onClick={logout} className="nav-logout-btn">
                Logout ({user.name})
              </button>
            </li>
          </>
        )}

        {!user && (
          <>
            <li className="home-1l">
              <Link to="/login" className="nav-link">
                <h1>Login</h1>
              </Link>
            </li>
            <li className="home-1l">
              <Link to="/supplier-register" className="nav-link">
                <h1>Supplier Registration</h1>
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Nav;
