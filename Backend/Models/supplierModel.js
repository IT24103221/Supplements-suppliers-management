const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    supplimentCategory: {
        type: String,
        required: true
    },
    supplimentProduct: {
        type: String,
        required: true
    },
    // Tracks which supplier created this supplement request.
    // In this app, each request is stored as a Supplier document,
    // so we default supplierId to the document id.
    supplierId: {
        type: String,
        default: function () {
            return this._id?.toString();
        }
    },
    status: {
        type: String,
        enum: ["Pending", "Approved"],
        default: "Pending"
    },
    photoUrl: {
        type: String,
        default: ""
    },
    photoPublicId: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Supplier', supplierSchema);
