const mongoose = require("mongoose");

const supplementSchema = new mongoose.Schema({
  supplementName: { type: String, required: true },
  supplementBrand: { type: String, required: true },

  category: { type: String, required: true },
  supplementProduct: { type: String, required: true },

  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  weight: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  description: { type: String, default: "" },

  // Tracks which supplier created this supplement request.
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: false,
  },

  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  rejectionReason: {
    type: String,
    default: "",
  },

  photoUrl: {
    type: String,
    default: "",
  },
  photoPublicId: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Supplement", supplementSchema);

