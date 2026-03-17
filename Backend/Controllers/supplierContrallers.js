const supplier = require("../Models/supplierModel");

//data display

const getAllSuppliers = async (req, res) => {
    //get all suppliers
    try {
        const suppliers = await supplier.find();
        //not found
        if (!suppliers || suppliers.length === 0) {
            return res.status(404).json({ message: "No suppliers found" });
        }
        //display all suppliers
        return res.status(200).json({ suppliers });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
};


//data Insert
const addSupplier = async (req, res) => {

    const { name, email, phone, address, company, supplimentBrand } = req.body;

    try {
        const newSupplier = new supplier({ name, email, phone, address, company, supplimentBrand });
        await newSupplier.save();
        return res.status(200).json({ supplier: newSupplier });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to add supplier", error: err.message });
    }
};

//Get by ID
const getById = async (req, res, next) => {
    const id = req.params.id;

    let foundSupplier; 
    try {
        foundSupplier = await supplier.findById(id); 
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
    //not found

    if (!foundSupplier) {
        return res.status(404).json({ message: "No supplier found" });
    }

    return res.status(200).json({ supplier: foundSupplier });
};

//Update supplier details
const updateSupplier = async (req, res) => {
    const id = req.params.id;
    const { name, email, phone, address, company, supplimentBrand } = req.body;

    let updatedSupplier;
    try {
        updatedSupplier = await supplier.findByIdAndUpdate(id,
            {name: name, email: email, phone: phone, address: address, company: company, supplimentBrand: supplimentBrand});
            updatedSupplier = await updatedSupplier.save();
    } catch (err) {
        console.log(err);
    }
    //not updated
    if (!updatedSupplier) {
        return res.status(404).json({ message: "Unable to update supplier details" });
    }
    return res.status(200).json({ supplier: updatedSupplier });
}

//Delete supplier details
const deleteSupplier = async (req, res) => {
    const id = req.params.id;
    let deletedSupplier;
    
    try {
        deletedSupplier = await supplier.findByIdAndDelete(id);
    }catch (err) {
        console.log(err);
    }
    //not deleted
    if (!deletedSupplier) {
        return res.status(404).json({ message: "Unable to delete supplier details" });
    }
    return res.status(200).json({ message: "Supplier deleted successfully", supplier: deletedSupplier });
}

exports.getAllSuppliers = getAllSuppliers;
exports.addSupplier = addSupplier;
exports.getById = getById;
exports.updateSupplier = updateSupplier;
exports.deleteSupplier = deleteSupplier;
 