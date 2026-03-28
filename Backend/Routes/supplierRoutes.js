const express = require('express');
const router = express.Router();
const upload = require("../middleware/upload");

//Insert Model
const supplierModel = require("../Models/supplierModel");
//Insert Controller
const supplierContraller = require("../Controllers/supplierContrallers");

router.get("/", supplierContraller.getAllSuppliers);
// Admin: fetch all Pending supplements
router.get("/pending", supplierContraller.getPendingSuppliers);
// Admin add supplier (auto Approved)
router.post("/", upload.single("photo"), supplierContraller.addSupplier);
router.post("/admin", upload.single("photo"), supplierContraller.addSupplier);
// Supplier self-registration (Pending approval)
router.post("/register", upload.single("photo"), supplierContraller.registerSupplier);

// Supplier Login
router.post("/login", supplierContraller.supplierLogin);
router.get("/:id", supplierContraller.getById);
router.put("/:id", upload.single("photo"), supplierContraller.updateSupplier);
router.patch("/:id/approve", supplierContraller.approveSupplier);
// Admin: approve a pending request (Pending -> Approved)
router.patch("/approve/:id", supplierContraller.approveSupplier);
router.patch("/reject/:id", supplierContraller.rejectSupplier);
router.delete("/:id", supplierContraller.deleteSupplier);

//Export router
module.exports = router;