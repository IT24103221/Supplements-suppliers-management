const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const supplierSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,      // ✅ Number / String - phone numbers leading zeros support
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    supplimentCategory: {   // ✅ New
        type: String,
        required: true,
    },
    supplimentProduct: {    // ✅ New
        type: String,
        required: true,
    },
    photoUrl: {             // ✅ New
        type: String,
        default: "",
    },
    photoPublicId: {        // ✅ New
        type: String,
        default: "",
    },
});

module.exports = mongoose.model("supplierModel", supplierSchema);