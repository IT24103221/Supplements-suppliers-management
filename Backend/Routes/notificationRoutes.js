const express = require("express");
const router = express.Router();
const notificationController = require("../Controllers/notificationController");

// Create a new notification
router.post("/", notificationController.createNotification);

// Get notifications for a supplier
router.get("/supplier/:supplierId", notificationController.getNotificationsForSupplier);

// Mark a notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all notifications as read for a supplier
router.patch("/supplier/:supplierId/read-all", notificationController.markAllAsRead);

// Update shipment status
router.patch("/:id/shipment", notificationController.updateShipmentStatus);

// Delete notification
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
