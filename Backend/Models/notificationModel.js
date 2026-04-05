const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
  senderId: {
    type: String, // Flexibility if admin model is not present or uses simple IDs
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["restock_request", "order_notification", "low_stock_alert", "general"],
    default: "general",
  },
  status: {
    type: String,
    enum: ["unread", "read"],
    default: "unread",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  shipmentStatus: {
    type: String,
    enum: ["Pending Dispatch", "Shipped", "Delivered"],
    default: "Pending Dispatch",
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  quantity: {
    type: Number,
  },
  buyerName: {
    type: String,
  },
  buyerAddress: {
    type: String,
  },
  relatedSupplementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplement",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
