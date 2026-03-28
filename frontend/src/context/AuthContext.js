import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Compatibility for different roles
    localStorage.setItem("userRole", userData.role);
    
    if (userData.role === "supplier") {
      localStorage.setItem("supplierId", userData.id || userData._id);
      localStorage.setItem("supplierName", userData.name);
      localStorage.setItem("supplierStatus", userData.status);
    } else if (userData.role === "admin") {
      localStorage.setItem("isAdmin", "true");
    } else if (userData.role === "user") {
      localStorage.setItem("userId", userData.id || userData._id);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    window.location.href = "/mainhome"; // Force redirect on logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
