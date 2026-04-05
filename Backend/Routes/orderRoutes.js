const express = require('express');
const router = express.Router();
const orderController = require("../Controllers/orderController");

// Create Order
router.post("/", orderController.createOrder);

// Update Order Status
router.patch("/:orderId", orderController.updateOrderStatus);

// Get Order by ID
router.get("/:id", orderController.getOrderById);

// Get User's Orders by Email
router.get("/user/email", orderController.getOrdersByEmail);

// Get User's Orders
router.get("/user/:userId", orderController.getOrdersByUserId);

// Delete Order by ID
router.delete("/:id", orderController.deleteOrder);

module.exports = router;
