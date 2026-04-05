const Notification = require("../Models/notificationModel");
const Order = require("../Models/orderModel");
const mongoose = require("mongoose");

// Create a new notification (Admin to Supplier)
const createNotification = async (req, res) => {
  const { recipientId, senderId, message, type, relatedSupplementId, orderId, quantity, buyerName, buyerAddress } = req.body;

  // Basic validation
  if (!recipientId || !senderId || !message || !type) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    const newNotification = new Notification({
      recipientId,
      senderId,
      message,
      type,
      relatedSupplementId,
      orderId,
      quantity,
      buyerName,
      buyerAddress
    });

    await newNotification.save();
    res.status(201).json({ notification: newNotification });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all notifications for a specific supplier
const getNotificationsForSupplier = async (req, res) => {
  const { supplierId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    return res.status(400).json({ message: "Invalid supplier ID." });
  }

  try {
    const notifications = await Notification.find({ recipientId: supplierId })
      .sort({ createdAt: -1 })
      .populate("relatedSupplementId", "supplementName supplementBrand availableStock");
      
    res.status(200).json({ notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid notification ID." });
  }

  try {
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    notification.status = "read";
    notification.isRead = true;
    await notification.save();

    res.status(200).json({ notification });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Mark all notifications as read for a supplier
const markAllAsRead = async (req, res) => {
  const { supplierId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    return res.status(400).json({ message: "Invalid supplier ID." });
  }

  try {
    await Notification.updateMany(
      { recipientId: supplierId, status: "unread" },
      { $set: { status: "read", isRead: true } }
    );
    res.status(200).json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update shipment status (Supplier marks as shipped)
const updateShipmentStatus = async (req, res) => {
  const { id } = req.params;
  const { shipmentStatus } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid notification ID." });
  }

  try {
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    notification.shipmentStatus = shipmentStatus;
    await notification.save();

    // If marked as Shipped or Confirmed, also update the Order status
    if (notification.orderId) {
      if (shipmentStatus === "Shipped") {
        await Order.findByIdAndUpdate(notification.orderId, {
          $set: { orderStatus: "Shipped" }
        });
      } else if (shipmentStatus === "Confirmed") {
        await Order.findByIdAndUpdate(notification.orderId, {
          $set: { orderStatus: "Confirmed" }
        });
      }
    }

    res.status(200).json({ notification });
  } catch (err) {
    console.error("Error updating shipment status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete a notification permanently
const deleteNotification = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid notification ID." });
  }

  try {
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Notification not found." });
    }
    res.status(200).json({ message: "Notification deleted successfully." });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createNotification,
  getNotificationsForSupplier,
  markAsRead,
  markAllAsRead,
  updateShipmentStatus,
  deleteNotification,
};
