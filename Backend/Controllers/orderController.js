const Order = require("../Models/orderModel");
const Supplement = require("../Models/supplementModel");
const Notification = require("../Models/notificationModel");

// Helper function to update stock and notify suppliers
const updateStockAndNotify = async (order) => {
  const { items, _id, shippingAddress } = order;
  
  for (const item of items) {
    // Deduct stock
    const supplement = await Supplement.findByIdAndUpdate(item.supplementId, {
      $inc: { availableStock: -item.quantity },
    }, { new: true });

    if (supplement && supplement.supplierId) {
      // Create notification for supplier
      await Notification.create({
        recipientId: supplement.supplierId,
        senderId: "System",
        message: `New order received for ${item.name}.`,
        type: "order_notification",
        orderId: _id,
        relatedSupplementId: item.supplementId,
        quantity: item.quantity,
        buyerName: shippingAddress.name,
        buyerAddress: `${shippingAddress.address}, ${shippingAddress.city}`,
        shipmentStatus: "Pending Dispatch"
      });
    }
  }
};

// Create a new order
const createOrder = async (req, res) => {
    try {
        const { userId, customerEmail, items, totalAmount, shippingAddress, paymentMethod, paymentStatus } = req.body;
        
        // Stock validation before creating order
        for (const item of items) {
            const supplement = await Supplement.findById(item.supplementId);
            if (!supplement || supplement.availableStock < item.quantity) {
                return res.status(400).json({ message: `Not enough stock for ${item.name}` });
            }
        }

        const newOrder = new Order({
            userId,
            customerEmail,
            items,
            totalAmount,
            shippingAddress,
            paymentMethod,
            paymentStatus: paymentStatus || 'Pending',
            orderStatus: 'Processing'
        });

        const savedOrder = await newOrder.save();

        // If COD, deduct stock and notify suppliers immediately
        if (paymentMethod === "COD") {
            await updateStockAndNotify(savedOrder);
        }

        return res.status(201).json({ order: savedOrder });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error creating order", error: err.message });
    }
};

// Update order status (for payment confirmation)
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentStatus, orderStatus } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // If payment is successful, deduct stock and notify suppliers
        if (paymentStatus === "Paid" && order.paymentStatus !== "Paid") {
            await updateStockAndNotify(order);
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { 
                $set: { 
                    ...(paymentStatus && { paymentStatus }),
                    ...(orderStatus && { orderStatus })
                } 
            },
            { new: true }
        );

        return res.status(200).json({ order: updatedOrder });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error updating order", error: err.message });
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        return res.status(200).json({ order });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error fetching order", error: err.message });
    }
};

// Get orders for a specific user
const getOrdersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        return res.status(200).json({ orders });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error fetching user orders", error: err.message });
    }
};

// Get orders for a specific user by email
const getOrdersByEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: "Email parameter is required" });
        }
        const orders = await Order.find({ customerEmail: email }).sort({ createdAt: -1 });
        return res.status(200).json({ orders });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error fetching user orders by email", error: err.message });
    }
};

// Delete an order by ID
const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        return res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error deleting order", error: err.message });
    }
};

// Get all orders (for admin report)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        return res.status(200).json({ orders });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error fetching all orders", error: err.message });
    }
};

module.exports = {
    createOrder,
    updateOrderStatus,
    getOrderById,
    getOrdersByUserId,
    getOrdersByEmail,
    deleteOrder,
    getAllOrders
};
