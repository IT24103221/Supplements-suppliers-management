import "./App.css";
import "./global.css";
import Home from "./components/Home/Home";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddSuppliers from "./components/AddSuppliers/addsuppliers.js";
import SuppliersDetails from "./components/SuppliersDetails/suppliersdetails.js";
import UpdateSuppliers from "./components/UpdateSuppliers/updatesuppliers.js";
import SupplierProfile from "./components/SupplierProfile/supplierprofile.js";
import SupplierRegister from "./components/SupplierRegister/supplierregister.js";
import PendingRequests from "./components/AdminDashboard/PendingRequests.jsx";
import AddSupplements from "./components/AddSupplements/addsupplements.js";
import SupplementsDetails from "./components/SupplementsDetails/supplementsdetails.js";
import UpdateSupplements from "./components/UpdateSupplements/updatesupplements.js";
import SupplementDetails from "./components/SupplementDetails/SupplementDetails.jsx";
import SupplierDashboard from "./components/SupplierDashboard/SupplierDashboard.jsx";
import SupplierLogin from "./components/SupplierDashboard/SupplierLogin.jsx";
import Login from "./components/SupplierDashboard/Login.jsx";
import Cart from "./components/Cart/Cart.jsx";
import Checkout from "./components/Checkout/Checkout.jsx";
import WebXpayMock from "./components/Checkout/WebXpayMock.jsx";
import PaymentSuccess from "./components/Checkout/PaymentSuccess.jsx";
import CustomerOrders from "./components/Checkout/CustomerOrders.jsx";
import NotificationsPage from "./components/Notifications/NotificationsPage.jsx";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mainhome" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/checkout" element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/webxpay-checkout/:orderId" element={
              <ProtectedRoute allowedRoles={["user"]}>
                <WebXpayMock />
              </ProtectedRoute>
            } />
            <Route path="/payment-success" element={
              <ProtectedRoute allowedRoles={["user"]}>
                <PaymentSuccess />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute 
                allowedRoles={["supplier"]} 
                redirectTo="/pending-requests"
              >
                <NotificationsPage />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route 
              path="/pending-requests" 
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PendingRequests />
                </ProtectedRoute>
              } 
            />
          <Route path="/suppliersdetails" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SuppliersDetails />
            </ProtectedRoute>
          } />

          {/* User/Store Routes (Protected: login required) */}
          <Route path="/supplementsdetails" element={
              <ProtectedRoute>
                <SupplementsDetails />
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute allowedRoles={["user"]}>
                <Cart />
              </ProtectedRoute>
            } />
            <Route path="/my-orders" element={
              <ProtectedRoute allowedRoles={["user"]}>
                <CustomerOrders />
              </ProtectedRoute>
            } />
            <Route path="/supplement/:id" element={
            <ProtectedRoute>
              <SupplementDetails />
            </ProtectedRoute>
          } />
          
          {/* Supplier Routes */}
          <Route path="/supplier-register" element={<SupplierRegister />} />
          <Route path="/supplier-login" element={<SupplierLogin />} />
          <Route path="/supplier-dashboard/:id" element={
            <ProtectedRoute allowedRoles={["supplier", "admin"]}>
              <SupplierDashboard />
            </ProtectedRoute>
          } />
          
          {/* Management Routes */}
          <Route path="/addsuppliers" element={<AddSuppliers />} />
          <Route path="/addsupplements" element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <AddSupplements />
            </ProtectedRoute>
          } />
          <Route path="/updatesupplements/:id" element={<UpdateSupplements />} />
          <Route path="/supplier/:id" element={<SupplierProfile />} />
          <Route path="/updatesuppliers/:id" element={<UpdateSuppliers />} />
        </Routes>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;