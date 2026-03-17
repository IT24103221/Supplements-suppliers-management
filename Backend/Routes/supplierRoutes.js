const express = require('express');
const router = express.Router();

//Insert Model
const supplierModel = require("../Models/supplierModel");
//Insert Controller
const supplierContraller = require("../Controllers/supplierContrallers");

router.get("/", supplierContraller.getAllSuppliers);
router.post("/", supplierContraller.addSupplier);
router.get("/:id", supplierContraller.getById);
router.put("/:id", supplierContraller.updateSupplier);
router.delete("/:id", supplierContraller.deleteSupplier);

//Export router
module.exports = router;