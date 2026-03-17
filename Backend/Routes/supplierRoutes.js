const express = require('express');
const router = express.Router();
const upload = require("../middleware/upload");

//Insert Model
const supplierModel = require("../Models/supplierModel");
//Insert Controller
const supplierContraller = require("../Controllers/supplierContrallers");

router.get("/", supplierContraller.getAllSuppliers);
router.post("/", upload.single("photo"), supplierContraller.addSupplier);
router.get("/:id", supplierContraller.getById);
router.put("/:id", upload.single("photo"), supplierContraller.updateSupplier);
router.delete("/:id", supplierContraller.deleteSupplier);

//Export router
module.exports = router;