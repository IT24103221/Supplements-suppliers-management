const express = require('express');
const router = express.Router();
const upload = require("../middleware/upload");

//Insert Model
const supplierModel = require("../Models/supplierModel");
//Insert Controller
const supplierContraller = require("../Controllers/supplierContrallers");

router.get("/", supplierContraller.getAllSuppliers);
// Admin add supplier (auto Approved)
router.post("/", upload.single("photo"), supplierContraller.addSupplier);
router.post("/admin", upload.single("photo"), supplierContraller.addSupplier);
// Supplier self-registration (Pending approval)
router.post("/register", upload.single("photo"), supplierContraller.registerSupplier);
router.get("/:id", supplierContraller.getById);
router.put("/:id", upload.single("photo"), supplierContraller.updateSupplier);
router.patch("/:id/approve", supplierContraller.approveSupplier);
router.patch("/:id/reject", supplierContraller.rejectSupplier);
router.delete("/:id", supplierContraller.deleteSupplier);

//Export router
module.exports = router;