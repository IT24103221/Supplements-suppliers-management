import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Nav from "../Nav/Nav";
import { useCart } from "../../context/CartContext";
import axios from "axios";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { orderId: stateOrderId, paymentMethod: statePaymentMethod } = location.state || {};

  useEffect(() => {
    // Clear the cart when payment is successful
    clearCart();

    const fetchOrder = async () => {
      const orderId = stateOrderId;
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/orders/${orderId}`);
        setOrder(response.data.order);
      } catch (error) {
        console.error("Error fetching order in PaymentSuccess:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [clearCart, stateOrderId]);

  if (loading) {
    return (
      <div className="payment-success-page">
        <Nav />
        <div className="success-content-wrapper">
          <div className="loading-spinner">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (!stateOrderId && !order) {
    return (
      <div className="payment-error-page">
        <Nav />
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Oops! Something went wrong.</h2>
          <p>No order details found. If you just placed an order, please check your email or contact support.</p>
          <button className="btn-primary" onClick={() => navigate("/")}>Go to Home</button>
        </div>
      </div>
    );
  }

  // Display variables for the JSX
  const displayOrderId = order?._id || stateOrderId || "N/A";
  const displayPaymentMethod = order?.paymentMethod || statePaymentMethod || "COD";

  return (
    <div className="payment-success-page">
      <Nav />
      <div className="success-content-wrapper">
        <div className="success-card">
          <div className="checkmark-circle">
            <div className="checkmark draw"></div>
          </div>
          <h1>Order Placed Successfully!</h1>
          <p className="thank-you-msg">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>

          <div className="order-details-box">
            <div className="detail-row">
              <span>Order Reference ID:</span>
              <span className="order-id">#{displayOrderId}</span>
            </div>
            <div className="detail-row">
              <span>Payment Method:</span>
              <span className="payment-method">
                {displayPaymentMethod === "Online" ? "Online Payment (WebXpay)" : "Cash on Delivery (COD)"}
              </span>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="btn-primary" 
              onClick={() => navigate("/supplementsdetails")}
            >
              Continue Shopping
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => navigate("/")}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
