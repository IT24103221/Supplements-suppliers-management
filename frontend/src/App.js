import "./App.css";
import Home from "./components/Home/Home";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AddSuppliers from "./components/AddSuppliers/addsuppliers.js";
import SuppliersDetails from "./components/SuppliersDetails/suppliersdetails.js";
import UpdateSuppliers from "./components/UpdateSuppliers/updatesuppliers.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mainhome" element={<Home />} />
        <Route path="/addsuppliers" element={<AddSuppliers />} />
        <Route path="/suppliersdetails" element={<SuppliersDetails />} />
        <Route path="/updatesuppliers/:id" element={<UpdateSuppliers />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;