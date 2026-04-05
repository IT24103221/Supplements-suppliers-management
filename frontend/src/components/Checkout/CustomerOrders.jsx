import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Nav from "../Nav/Nav";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import "./CustomerOrders.css";

const CustomerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      const userEmail = user.email;
      const res = await axios.get(`http://localhost:5000/orders/user/email?email=${userEmail}`);
      const fetchedOrders = res.data?.orders ?? [];
      
      // Check for newly confirmed orders to show toast
      const previousOrders = JSON.parse(localStorage.getItem(`orders_${userEmail}`) || "[]");
      fetchedOrders.forEach(order => {
        const prevOrder = previousOrders.find(p => p._id === order._id);
        if (order.orderStatus === "Confirmed" && (!prevOrder || prevOrder.orderStatus !== "Confirmed")) {
          toast.success("Great news! Your order has been confirmed by the supplier.", {
            duration: 5000,
            icon: '🎉',
          });
        }
      });
      localStorage.setItem(`orders_${userEmail}`, JSON.stringify(fetchedOrders));
      
      setOrders(fetchedOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to remove this order from your view?")) return;
    try {
      await axios.delete(`http://localhost:5000/orders/${orderId}`);
      setOrders(prev => prev.filter(o => o._id !== orderId));
      toast.success("Order record cleared from your view.");
    } catch (err) {
      toast.error("Failed to clear order.");
    }
  };

  useEffect(() => {
    fetchOrders();
    // Refresh on focus for better sync
    window.addEventListener('focus', fetchOrders);
    return () => window.removeEventListener('focus', fetchOrders);
  }, [user]);

  return (
    <div className="customer-orders-page">
      <Nav />
      <div className="orders-container section-spacing">
        <header className="orders-header">
          <h1 className="page-title">My Orders</h1>
          <p>Track your supplement deliveries and order history</p>
        </header>

        {loading ? (
          <div className="orders-loading">
            <div className="spinner"></div>
            <p>Fetching your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">📦</div>
            <h2>No orders yet</h2>
            <p>You haven't placed any orders yet. Start shopping to see them here!</p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Date</th>
                  <th>Total Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div className="item-name-cell">
                        {order.items?.[0]?.name || order.items?.[0]?.supplementName || order.items?.[0]?.supplementProduct || 'N/A'}
                        {(order.items?.length || 0) > 1 && <span className="item-count">+{order.items.length - 1} more</span>}
                      </div>
                    </td>
                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>LKR {order.totalAmount?.toLocaleString() || '0'}</td>
                    <td className="text-center">
                      <span className={`badge status-pill ${order.orderStatus.toLowerCase()}`}>
                        {order.orderStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="action-cell">
                        <button className="btn btn-secondary" onClick={() => setSelectedOrder(order)}>
                          View Details
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDeleteOrder(order._id)} title="Clear order from view">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Details Modal */}
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="order-details-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Order Details</h2>
                <button className="close-btn" onClick={() => setSelectedOrder(null)}>&times;</button>
              </div>
              
              <div className="modal-body">
                <div className="order-info-grid">
                  <div className="info-item">
                    <label>Order ID</label>
                    <p>#{selectedOrder._id?.slice(-8).toUpperCase() || 'UNKNOWN'}</p>
                  </div>
                  <div className="info-item">
                    <label>Order Date</label>
                    <p>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="info-item">
                    <label>Payment Method</label>
                    <p>{selectedOrder.paymentMethod}</p>
                  </div>
                  <div className="info-item">
                    <label>Payment Status</label>
                    <p className={`pay-status ${selectedOrder.paymentStatus.toLowerCase()}`}>{selectedOrder.paymentStatus}</p>
                  </div>
                </div>

                <div className="shipping-info">
                  <h3>Shipping Address</h3>
                  <p><strong>{selectedOrder.shippingAddress?.name || 'N/A'}</strong></p>
                  <p>{selectedOrder.shippingAddress?.address || 'N/A'}</p>
                  <p>{selectedOrder.shippingAddress?.city || 'N/A'}</p>
                  <p>Phone: {selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                </div>

                <div className="items-list">
                  <h3>Items Purchased</h3>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="detail-item">
                      <div className="item-img-sm">
                        {item.photoUrl ? <img src={item.photoUrl} alt={item.name} /> : <span>💊</span>}
                      </div>
                      <div className="item-info">
                        <p className="item-name">{item.name || item.supplementName || item.supplementProduct || 'N/A'}</p>
                        <p className="item-qty-price">Qty: {item.quantity} × LKR {item.price?.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-footer">
                  <div className="total-row">
                    <span>Total Amount</span>
                    <span className="total-price">LKR {selectedOrder.totalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;
