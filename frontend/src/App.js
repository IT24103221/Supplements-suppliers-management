import "./App.css";
import Home from "./components/Home/Home";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddSuppliers from "./components/AddSuppliers/addsuppliers.js";
import SuppliersDetails from "./components/SuppliersDetails/suppliersdetails.js";
import UpdateSuppliers from "./components/UpdateSuppliers/updatesuppliers.js";
import SupplierProfile from "./components/SupplierProfile/supplierprofile.js";
import SupplierRegister from "./components/SupplierRegister/supplierregister.js";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard.jsx";
import AddSupplements from "./components/AddSupplements/addsupplements.js";
import SupplementsDetails from "./components/SupplementsDetails/supplementsdetails.js";
import UpdateSupplements from "./components/UpdateSupplements/updatesupplements.js";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mainhome" element={<Home />} />
        <Route path="/addsuppliers" element={<AddSuppliers />} />
        <Route path="/addsupplements" element={<AddSupplements />} />
        <Route path="/supplier-register" element={<SupplierRegister />} />
        <Route path="/pending-supplements" element={<AdminDashboard />} />
        <Route path="/suppliersdetails" element={<SuppliersDetails />} />
        <Route path="/supplementsdetails" element={<SupplementsDetails />} />
        <Route path="/updatesupplements/:id" element={<UpdateSupplements />} />
        <Route path="/supplier/:id" element={<SupplierProfile />} />
        <Route path="/updatesuppliers/:id" element={<UpdateSuppliers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;