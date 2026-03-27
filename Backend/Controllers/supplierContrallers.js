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

function requireAdmin(req, res) {
  // This project currently has no auth/roles.
  // For this workflow we use a lightweight header check.
  // Frontend admin pages will send: x-user-role: "admin".
  return req.headers["x-user-role"] === "admin";
}

//data display

const getAllSuppliers = async (req, res) => {
    //get all suppliers
    try {
        // TEMP FIX (pre-status suppliers): prevent old suppliers from disappearing
        // Any supplier that has no status set will be treated as already Approved.
        await supplier.updateMany(
            { $or: [{ status: { $exists: false } }, { status: null }, { status: "" }] },
            { $set: { status: "Approved" } }
        );

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
const createSupplierWithStatus = async (req, res, status) => {
    const { name, email, phone, address, supplimentCategory, supplimentProduct, supplierId } = req.body;

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

        const newSupplier = new supplier({
            name,
            email,
            phone,
            address,
            supplimentCategory,
            supplimentProduct,
            status,
            // If provided, store supplierId explicitly; otherwise the schema default is used.
            supplierId: supplierId || undefined,
            photoUrl,
            photoPublicId
        });

        await newSupplier.save();
        return res.status(200).json({ supplier: newSupplier });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Unable to add supplier", error: err.message });
    }
};

// Admin creates supplier: immediately Approved
const addSupplier = async (req, res) => {
    return await createSupplierWithStatus(req, res, "Approved");
};

// Supplier self-register: Pending until admin approval
const registerSupplier = async (req, res) => {
    return await createSupplierWithStatus(req, res, "Pending");
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

    // TEMP FIX: if a single supplier is missing status, assume it was Approved
    if (!foundSupplier.status) {
        foundSupplier.status = "Approved";
        await foundSupplier.save();
    }

    return res.status(200).json({ supplier: foundSupplier });
};

//Update supplier details
const updateSupplier = async (req, res) => {
    const id = req.params.id;
    const { name, email, phone, address, supplimentCategory, supplimentProduct } = req.body;

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
        existing.supplimentCategory = supplimentCategory;
        existing.supplimentProduct = supplimentProduct;
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

// Approve a pending supplier request (status -> Approved)
const approveSupplier = async (req, res) => {
    const id = req.params.id;

    try {
        if (!requireAdmin(req, res)) {
            return res.status(403).json({ message: "Admin access required" });
        }

        const existing = await supplier.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        if (existing.status !== "Pending") {
            return res.status(400).json({ message: "Only pending suppliers can be approved" });
        }

        existing.status = "Approved";
        const updated = await existing.save();

        if (!updated) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        return res.status(200).json({ supplier: updated });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Reject a pending supplier request:
// - only allowed for Pending suppliers
// - deletes the DB record
// - deletes Cloudinary image if present
const rejectSupplier = async (req, res) => {
    const id = req.params.id;

    try {
        if (!requireAdmin(req, res)) {
            return res.status(403).json({ message: "Admin access required" });
        }

        const existing = await supplier.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        if (existing.status !== "Pending") {
            return res.status(400).json({ message: "Only pending suppliers can be rejected" });
        }

        if (existing.photoPublicId) {
            try {
                await cloudinary.uploader.destroy(existing.photoPublicId, { resource_type: "image" });
            } catch (e) {
                console.log("Cloudinary delete failed:", e?.message || e);
            }
        }

        await supplier.findByIdAndDelete(id);
        return res.status(200).json({ message: "Supplier rejected and removed" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Admin: fetch all Pending supplements
const getPendingSuppliers = async (req, res) => {
    try {
        if (!requireAdmin(req, res)) {
            return res.status(403).json({ message: "Admin access required" });
        }

        const pending = await supplier.find({ status: "Pending" });

        return res.status(200).json({ suppliers: pending });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getAllSuppliers = getAllSuppliers;
exports.addSupplier = addSupplier;
exports.registerSupplier = registerSupplier;
exports.getById = getById;
exports.updateSupplier = updateSupplier;
exports.deleteSupplier = deleteSupplier;
exports.getPendingSuppliers = getPendingSuppliers;
exports.approveSupplier = approveSupplier;
exports.rejectSupplier = rejectSupplier;
  