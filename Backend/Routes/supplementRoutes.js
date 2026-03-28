const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const supplementModel = require("../Models/supplementModel");
const supplementContraller = require("../Controllers/supplementContrallers");

// Main supplement store (Approved only)
router.get("/", supplementContraller.getAllSupplements);

// Admin: pending supplements
router.get("/pending", supplementContraller.getPendingSupplements);

// Supplier Dashboard: get owned supplements
router.get("/supplier/:supplierId", supplementContraller.getSupplementsBySupplier);

// Supplier submits a new supplement request (stored as Pending)
router.post("/", upload.single("photo"), supplementContraller.addSupplement);

// Get one supplement (used for edit page)
router.get("/:id", supplementContraller.getSupplementById);

// Update supplement (with optional photo replace)
router.put("/:id", upload.single("photo"), supplementContraller.updateSupplement);

// Admin approves Pending -> Approved
router.patch("/approve/:id", supplementContraller.approveSupplement);

// Admin rejects Pending -> Rejected
router.patch("/reject/:id", supplementContraller.rejectSupplement);

// Delete supplement (also removes Cloudinary photo)
router.delete("/:id", supplementContraller.deleteSupplement);

module.exports = router;

