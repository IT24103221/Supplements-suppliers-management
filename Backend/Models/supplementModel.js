const mongoose = require("mongoose");

const supplementSchema = new mongoose.Schema({
  supplementName: { type: String, required: true },
  supplementBrand: { type: String, required: true },

  category: { type: String, required: true },

  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  weight: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  description: { type: String, default: "" },

  // Tracks which supplier created this supplement request.
  // (Since this app has no auth, we store a string identifier from the request body.)
  supplierId: {
    type: String,
    default: "",
  },

  status: {
    type: String,
    enum: ["Pending", "Approved"],
    default: "Pending",
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

