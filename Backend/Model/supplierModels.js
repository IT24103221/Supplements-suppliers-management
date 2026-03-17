const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const supplierSchema = new Schema({
    name: {
        type: String,//data type
        required: true,//validation
    },
    email: {
        type: String,  //data type
        required: true,//validation
    },
    phone: {
        type: Number,//data type
        required: true,//validation
    },
    address: {
        type: String,//data type
        required: true,//validation
    },
    company: {
        type: String,//data type
        required: true,//validation
    },
    supplimentBrand:{
        type: String,//data type
        required: true,//validation
    },
});

module.exports = mongoose.model(
    "supplierModel",//file name
    supplierSchema //schema name
);