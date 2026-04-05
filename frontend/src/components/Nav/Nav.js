import React, { useEffect, useState } from "react";
import "./Nav.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

function Nav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const isSupplier = user?.role === "supplier";
  const isApprovedSupplier = isSupplier && user?.status === "Approved";

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
    <div>
      <ul className="home-ul">
        <li className="home-1l">
          <Link to="/mainhome" className="nav-link">
            <h1>home</h1>
          </Link>
        </li>
        
        {/* Auth Specific Links */}
        {user ? (
          <>
            {/* Store link only after login */}
            <li className="home-1l">
              <Link to="/supplementsdetails" className="nav-link">
                <h1>supplements store</h1>
              </Link>
            </li>

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
            
            {isAdmin && (
              <>
                <li className="home-1l">
                  <Link to="/suppliersdetails" className="nav-link">
                    <h1>Manage Suppliers</h1>
                  </Link>
                </li>
                <li className="home-1l">
                  <Link to="/pending-requests" className="nav-link">
                    <h1>
                      Pending Requests
                      {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
                    </h1>
                  </Link>
                </li>
              </>
            )}

            {isUser && (
              <>
                <li className="home-1l">
                  <Link to="/cart" className="nav-link">
                    <h1>
                      Cart
                      {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                    </h1>
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
        ) : (
          <li className="home-1l">
            <Link to="/login" className="nav-link">
              <h1>Login</h1>
            </Link>
          </li>
        )}

        {/* Global/Public Links (Removed Store from here as it's now in Auth section) */}

        {/* Only Approved Suppliers can see Add Supplement */}
        {isApprovedSupplier && (
          <li className="home-1l">
            <Link to="/addsupplements" className="nav-link">
              <h1>ADD supplements</h1>
            </Link>
          </li>
        )}

        {/* Public Supplier Actions (Hide if already logged in) */}
        {!user && (
          <>
            <li className="home-1l">
              <Link to="/supplier-register" className="nav-link">
                <h1>Supplier Registration</h1>
              </Link>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}

export default Nav;
