const supplier = require("../Models/supplierModel");
const cloudinary = require("../config/cloudinary");

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

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
        let photoUrl = "";
        let photoPublicId = "";

        if (req.file && req.file.buffer) {
            const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
                folder: "gym-management/suppliers",
                resource_type: "image",
            });
            photoUrl = uploaded.secure_url || "";
            photoPublicId = uploaded.public_id || "";
        }

        const newSupplier = new supplier({ name, email, phone, address, company, supplimentBrand, photoUrl, photoPublicId });
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
        const existing = await supplier.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Unable to update supplier details" });
        }

        let photoUrl = existing.photoUrl || "";
        let photoPublicId = existing.photoPublicId || "";

        if (req.file && req.file.buffer) {
            const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
                folder: "gym-management/suppliers",
                resource_type: "image",
            });

            const newUrl = uploaded.secure_url || "";
            const newPublicId = uploaded.public_id || "";

            // delete old image after new upload succeeds
            if (photoPublicId) {
                try {
                    await cloudinary.uploader.destroy(photoPublicId, { resource_type: "image" });
                } catch (e) {
                    // keep going even if delete fails
                    console.log("Cloudinary delete failed:", e?.message || e);
                }
            }

            photoUrl = newUrl;
            photoPublicId = newPublicId;
        }

        existing.name = name;
        existing.email = email;
        existing.phone = phone;
        existing.address = address;
        existing.company = company;
        existing.supplimentBrand = supplimentBrand;
        existing.photoUrl = photoUrl;
        existing.photoPublicId = photoPublicId;

        updatedSupplier = await existing.save();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error", error: err.message });
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
 