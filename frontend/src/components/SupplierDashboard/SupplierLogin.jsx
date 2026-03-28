import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Nav from "../Nav/Nav";
import "./SupplierLogin.css";
import toast from "react-hot-toast";

function SupplierLogin() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/suppliers/login", { email });
      
      const { supplierId, name } = res.data;
      
      // Fetch full profile to get current status
      const profileRes = await axios.get(`http://localhost:5000/suppliers/${supplierId}`);
      const status = profileRes.data?.supplier?.status || "Pending";

      // Store in LocalStorage for session persistence
      localStorage.setItem("supplierId", supplierId);
      localStorage.setItem("supplierName", name);
      localStorage.setItem("supplierStatus", status);
      localStorage.setItem("userRole", "supplier");

      toast.success(`Welcome back, ${name}!`);
      navigate(`/supplier-dashboard/${supplierId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Login failed. Check your email or approval status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="supplier-login-page">
      <Nav />
      <div className="login-container">
        <div className="login-card">
          <h1>Supplier Login</h1>
          <p>Access your dashboard and manage your supplements.</p>
          
          <form onSubmit={handleLogin}>
            <label htmlFor="email">Registered Email</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. supplier@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <button type="submit" disabled={loading}>
              {loading ? "Checking Status..." : "Login to Dashboard"}
            </button>
          </form>

          <div className="login-footer">
            <p>Not registered yet? <span onClick={() => navigate("/supplier-register")}>Supplier Registration</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplierLogin;
