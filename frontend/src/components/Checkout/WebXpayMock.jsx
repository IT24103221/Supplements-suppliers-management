import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Nav from "../Nav/Nav";
import axios from "axios";
import toast from "react-hot-toast";
import "./WebXpayMock.css";

const WebXpayMock = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardName: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/orders/${orderId}`);
        setOrder(response.data.order);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Order not found");
        navigate("/cart");
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    let error = "";

    // Card Number: Automatically add spaces every 4 digits, max 16 digits (19 chars total)
    if (name === "cardNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 16);
      formattedValue = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
      if (value && !/^\d[\d\s]*$/.test(value)) error = "Only numbers allowed";
    }

    // Expiry: MM/YY format, max 5 chars
    if (name === "expiry") {
      const digits = value.replace(/\D/g, "").slice(0, 4);
      if (digits.length >= 2) {
        formattedValue = digits.slice(0, 2) + "/" + digits.slice(2, 4);
      } else {
        formattedValue = digits;
      }
      if (value && !/^\d[\d/]*$/.test(value)) error = "Only numbers allowed";
    }

    // CVV: 3 digits only
    if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 3);
      if (value && !/^\d*$/.test(value)) error = "Only numbers allowed";
    }

    // Cardholder Name: Text only check (Strict filtering)
    if (name === "cardName") {
      formattedValue = value.replace(/[^a-zA-Z\s]/g, ""); // Remove non-letters
      if (value !== formattedValue) error = "Only letters allowed";
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const isFormValid = 
    formData.cardNumber.replace(/\s/g, "").length === 16 && 
    formData.expiry.length === 5 && 
    formData.cvv.length === 3 && 
    formData.cardName.trim().length >= 3 &&
    /^[a-zA-Z\s]+$/.test(formData.cardName) &&
    Object.values(errors).every(x => !x);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      // Simulate payment processing
      toast.loading("Processing payment...", { id: "payment" });
      
      // Update order status in backend
      await axios.patch(`http://localhost:5000/orders/${orderId}`, {
        paymentStatus: "Paid",
        orderStatus: "Processing"
      });

      setTimeout(() => {
        toast.success("Payment Successful!", { id: "payment" });
        navigate("/payment-success", { state: { orderId, paymentMethod: "Online" } });
      }, 2000);
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Payment failed. Please try again.", { id: "payment" });
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="webxpay-page">
      <Nav />
      <div className="webxpay-container">
        <div className="webxpay-card">
          <div className="webxpay-header">
            <div className="webxpay-logo">WebXpay</div>
            <div className="order-total">
              <span className="label">Amount to Pay</span>
              <span className="value">Rs. {order?.totalAmount?.toLocaleString()}</span>
            </div>
          </div>

          <div className="payment-form-section">
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  name="cardName"
                  placeholder="JOHN DOE"
                  className={errors.cardName ? "input-error" : ""}
                  value={formData.cardName}
                  onChange={handleInputChange}
                  required
                />
                {errors.cardName && <span className="error-msg">{errors.cardName}</span>}
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <div className="card-input-wrapper">
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    className={errors.cardNumber ? "input-error" : ""}
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    required
                  />
                  <div className="card-icons-group">
                    <img src="/visa.png.png" alt="Visa" className="gateway-logo" />
                    <img src="/mastercard.webp.webp" alt="Mastercard" className="gateway-logo" />
                  </div>
                </div>
                {errors.cardNumber && <span className="error-msg">{errors.cardNumber}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    name="expiry"
                    placeholder="MM/YY"
                    className={errors.expiry ? "input-error" : ""}
                    value={formData.expiry}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.expiry && <span className="error-msg">{errors.expiry}</span>}
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    placeholder="123"
                    className={errors.cvv ? "input-error" : ""}
                    value={formData.cvv}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.cvv && <span className="error-msg">{errors.cvv}</span>}
                </div>
              </div>

              <button 
                type="submit" 
                className={`pay-now-btn ${!isFormValid ? 'disabled' : ''}`}
                disabled={!isFormValid}
              >
                Pay Now
              </button>
            </form>
          </div>

          <div className="webxpay-footer">
            <p>Secure payment powered by WebXpay</p>
            <div className="secure-icons">
              <span>🔒 SSL Secured</span>
              <span>PCI-DSS Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebXpayMock;
