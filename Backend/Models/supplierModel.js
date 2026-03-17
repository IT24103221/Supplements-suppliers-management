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
    company: {
        type: String
    },
    supplimentBrand: {
        type: String
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
