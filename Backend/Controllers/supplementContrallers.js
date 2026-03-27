const supplement = require("../Models/supplementModel");
const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");

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
  // Lightweight admin check: frontend must send x-user-role: "admin"
  // (This repo currently has no auth/role middleware.)
  return req.headers["x-user-role"] === "admin";
}

const getSupplementById = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid supplement id" });
  }
  try {
    const found = await supplement.findById(id);
    if (!found) return res.status(404).json({ message: "Supplement not found" });
    return res.status(200).json({ supplement: found });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Supplier adds a supplement request: always stored as Pending
const addSupplement = async (req, res) => {
  try {
    const {
      supplementName,
      supplementBrand,
      category,
      price,
      quantity,
      weight,
      expiryDate,
      description,
      supplierId,
    } = req.body;

    let photoUrl = "";
    let photoPublicId = "";

    if (req.file && req.file.buffer) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "gym-management/supplements",
        resource_type: "image",
      });
      photoUrl = uploaded.secure_url || "";
      photoPublicId = uploaded.public_id || "";
    }

    const newSupplement = new supplement({
      supplementName,
      supplementBrand,
      category,
      price: Number(price),
      quantity: Number(quantity),
      weight,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      description: description || "",

      // Track which supplier added the item.
      supplierId: supplierId || "",

      // Enforce workflow requirement:
      // Every new supplement is automatically saved with status "Pending".
      status: "Pending",

      photoUrl,
      photoPublicId,
    });

    await newSupplement.save();
    return res.status(200).json({ supplement: newSupplement });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Unable to add supplement", error: err.message });
  }
};

const updateSupplement = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid supplement id" });
  }

  try {
    const existing = await supplement.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Supplement not found" });
    }

    const {
      supplementName,
      supplementBrand,
      category,
      price,
      quantity,
      weight,
      expiryDate,
      description,
    } = req.body;

    let photoUrl = existing.photoUrl || "";
    let photoPublicId = existing.photoPublicId || "";

    if (req.file && req.file.buffer) {
      const uploaded = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "gym-management/supplements",
        resource_type: "image",
      });

      const newUrl = uploaded.secure_url || "";
      const newPublicId = uploaded.public_id || "";

      if (photoPublicId) {
        try {
          await cloudinary.uploader.destroy(photoPublicId, { resource_type: "image" });
        } catch (e) {
          console.log("Cloudinary delete failed:", e?.message || e);
        }
      }

      photoUrl = newUrl;
      photoPublicId = newPublicId;
    }

    existing.supplementName = supplementName ?? existing.supplementName;
    existing.supplementBrand = supplementBrand ?? existing.supplementBrand;
    existing.category = category ?? existing.category;
    if (price !== undefined) existing.price = Number(price);
    if (quantity !== undefined) existing.quantity = Number(quantity);
    existing.weight = weight ?? existing.weight;
    if (expiryDate) existing.expiryDate = new Date(expiryDate);
    if (description !== undefined) existing.description = description;
    existing.photoUrl = photoUrl;
    existing.photoPublicId = photoPublicId;

    const updated = await existing.save();
    return res.status(200).json({ supplement: updated });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteSupplement = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid supplement id" });
  }
  try {
    const existing = await supplement.findById(id);
    if (!existing) return res.status(404).json({ message: "Supplement not found" });

    if (existing.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(existing.photoPublicId, { resource_type: "image" });
      } catch (e) {
        console.log("Cloudinary delete failed:", e?.message || e);
      }
    }

    await supplement.findByIdAndDelete(id);
    return res.status(200).json({ message: "Supplement deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Main supplement store: Approved only
const getAllSupplements = async (req, res) => {
  try {
    // TEMP FIX (if older docs lack status): treat as Approved.
    await supplement.updateMany(
      { $or: [{ status: { $exists: false } }, { status: null }, { status: "" }] },
      { $set: { status: "Approved" } }
    );

    const approved = await supplement.find({ status: "Approved" });
    return res.status(200).json({ supplements: approved });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin: Pending supplements only
const getPendingSupplements = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const pending = await supplement.find({ status: "Pending" });
    return res.status(200).json({ supplements: pending });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Admin: approve pending supplement (Pending -> Approved)
const approveSupplement = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid supplement id" });
  }

  try {
    if (!requireAdmin(req, res)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const existing = await supplement.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Supplement not found" });
    }

    if (existing.status !== "Pending") {
      return res.status(400).json({ message: "Only pending supplements can be approved" });
    }

    existing.status = "Approved";
    const updated = await existing.save();
    return res.status(200).json({ supplement: updated });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllSupplements = getAllSupplements;
exports.addSupplement = addSupplement;
exports.getSupplementById = getSupplementById;
exports.updateSupplement = updateSupplement;
exports.deleteSupplement = deleteSupplement;
exports.getPendingSupplements = getPendingSupplements;
exports.approveSupplement = approveSupplement;

