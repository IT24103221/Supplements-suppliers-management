import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Nav from "../Nav/Nav";
import "./Login.css";
import toast from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      // In a real app, this would be a unified login endpoint
      // For this implementation, we'll simulate the backend logic or use existing ones
      
      let res;
      let userData;

      // Check if it's a supplier first (using existing logic)
      try {
        res = await axios.post("http://localhost:5000/suppliers/login", { email });
        const { supplierId, name } = res.data;
        const profileRes = await axios.get(`http://localhost:5000/suppliers/${supplierId}`);
        const status = profileRes.data?.supplier?.status || "Pending";
        
        userData = {
          id: supplierId,
          name: name,
          email: email,
          role: "supplier",
          status: status,
          token: "simulated-jwt-token" // In real app, backend returns this
        };
      } catch (supplierErr) {
        // If not a supplier, check for admin/user (Simulated for now as per requirements)
        // In a real backend, you'd have a /login endpoint that returns the role
        if (email === "admin@example.com" && password === "admin123") {
          userData = {
            id: "admin-id",
            name: "System Admin",
            email: email,
            role: "admin",
            token: "admin-jwt-token"
          };
        } else if (email.includes("user") && password === "user123") {
          userData = {
            id: "user-id",
            name: "Regular User",
            email: email,
            role: "user",
            token: "user-jwt-token"
          };
        } else {
          throw new Error("Invalid credentials or user not found.");
        }
      }

      if (userData) {
        login(userData);
        toast.success(`Welcome back, ${userData.name}!`);

        // Role-Based Redirection
        if (userData.role === "admin") {
          navigate("/supplementsdetails"); // Admin Default View: Supplement Store
        } else if (userData.role === "user") {
          navigate("/supplementsdetails"); // User Store
        } else if (userData.role === "supplier") {
          navigate(`/supplier-dashboard/${userData.id}`);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Nav />
      <div className="login-container">
        <div className="login-card">
          <h1>Login</h1>
          <p>Enter your credentials to access your account.</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-footer">
            <p>Admin: admin@example.com / admin123</p>
            <p>User: user@example.com / user123</p>
            <p>Suppliers: Use your registered email</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
