const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    items: [
        {
            supplementId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Supplement',
                required: true
            },
            name: String,
            price: Number,
            quantity: Number,
            photoUrl: String
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        name: String,
        address: String,
        city: String,
        phone: String
    },
    paymentMethod: {
        type: String,
        enum: ['Online', 'COD'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Paid', 'Pending', 'Failed'],
        default: 'Pending'
    },
    orderStatus: {
        type: String,
        enum: ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Processing'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
