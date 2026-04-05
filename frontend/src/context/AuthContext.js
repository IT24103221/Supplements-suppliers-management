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
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        // Restore missing helper keys for old sessions
        if (parsed.role) {
          if (!localStorage.getItem("userRole")) localStorage.setItem("userRole", parsed.role);
          
          if (parsed.role === "admin") {
            if (!localStorage.getItem("isAdmin")) localStorage.setItem("isAdmin", "true");
            if (!localStorage.getItem("adminId")) localStorage.setItem("adminId", parsed.id || parsed._id);
          } else if (parsed.role === "supplier") {
            if (!localStorage.getItem("supplierId")) localStorage.setItem("supplierId", parsed.id || parsed._id);
          } else if (parsed.role === "user") {
            if (!localStorage.getItem("userId")) localStorage.setItem("userId", parsed.id || parsed._id);
          }
        }
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
      localStorage.setItem("adminId", userData.id || userData._id);
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
