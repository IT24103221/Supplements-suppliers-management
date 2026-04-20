import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import Nav from "../Nav/Nav";
import axios from "axios";
import toast from "react-hot-toast";
import "./Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const { user } = useAuth();
  
  // Selective Checkout: Get items from state (Path A, B, or C)
  const itemsToCheckout = location.state?.items || [];

  const [paymentMethod, setPaymentMethod] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});

  // Redirect if no items are selected for checkout
  useEffect(() => {
    if (itemsToCheckout.length === 0) {
      toast.error("No items selected for checkout.");
      navigate("/cart");
    }
  }, [itemsToCheckout, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let error = "";
    let filteredValue = value;

    // Full Name validation: Letters and spaces only (Strict filtering)
    if (name === "name") {
      filteredValue = value.replace(/[^a-zA-Z\s]/g, ""); // Remove non-letters
      if (value !== filteredValue) error = "Only letters allowed";
    }

    // City validation: Letters and spaces only (Strict filtering)
    if (name === "city") {
      filteredValue = value.replace(/[^a-zA-Z\s]/g, ""); // Remove non-letters
      if (value !== filteredValue) error = "Only letters allowed";
    }

    // Address validation: Check for non-empty (optional: min length)
    if (name === "address") {
      if (value.trim().length > 0 && value.trim().length < 5) error = "Address too short";
    }

    // Phone validation: numbers only, exactly 10
    if (name === "phone") {
      filteredValue = value.replace(/\D/g, ""); // Remove non-numbers
      if (value !== filteredValue) error = "Only numbers allowed";
      if (filteredValue.length > 10) return;
    }

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const isFormValid = 
    formData.name.trim().length >= 3 && 
    /^[a-zA-Z\s]+$/.test(formData.name) &&
    formData.address.trim().length >= 5 && 
    formData.city.trim().length >= 2 &&
    /^[a-zA-Z\s]+$/.test(formData.city) &&
    formData.phone.length === 10 &&
    paymentMethod !== "" &&
    !Object.values(errors).some(x => x);

  const subtotal = itemsToCheckout.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  let shippingFee = 0;

  if (subtotal <= 5000) {
    shippingFee = 400;
  } else if (subtotal <= 50000) {
    shippingFee = 350;
  } else {
    shippingFee = 0;
  }

  const isFreeShipping = shippingFee === 0;
  const totalWithShipping = subtotal + shippingFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Please fill in all details correctly");
      return;
    }

    try {
      // Final stock check before payment
      const stockChecks = await Promise.all(
        itemsToCheckout.map(item => axios.get(`http://localhost:5000/supplements/${item._id}`))
      );

      for (let i = 0; i < stockChecks.length; i++) {
        const dbItem = stockChecks[i].data.supplement;
        const cartItem = itemsToCheckout[i];
        if (dbItem.availableStock < cartItem.quantity) {
          toast.error(`Stock updated! Only ${dbItem.availableStock} units available for ${cartItem.supplementName}. Please adjust your cart.`);
          return;
        }
      }

      const orderData = {
        userId: user?.id || user?._id || "guest",
        customerEmail: user?.email || "guest@example.com",
        items: itemsToCheckout.map((item) => ({
          supplementId: item._id,
          name: item.supplementName || item.name || item.supplementProduct || "Unnamed Item",
          price: item.price,
          quantity: item.quantity,
          photoUrl: item.photoUrl,
        })),
        totalAmount: totalWithShipping,
        shippingAddress: formData,
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending",
      };

      const response = await axios.post("http://localhost:5000/orders", orderData);
      const orderId = response.data.order._id;

      if (paymentMethod === "Online") {
        navigate(`/webxpay-checkout/${orderId}`);
      } else {
        toast.success("Order placed successfully with Cash on Delivery!");
        clearCart();
        navigate("/payment-success", { state: { orderId, paymentMethod: "COD" } });
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <div className="checkout-page">
      <Nav />
      <div className="checkout-container">
        <h1>Checkout</h1>
        <div className="checkout-grid">
          <div className="shipping-info">
            <h2>Shipping Details</h2>
            <form onSubmit={handlePlaceOrder}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  className={errors.name ? "input-error" : ""}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                {errors.name && <span className="error-msg">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  className={errors.address ? "input-error" : ""}
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
                {errors.address && <span className="error-msg">{errors.address}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    className={errors.city ? "input-error" : ""}
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.city && <span className="error-msg">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    className={errors.phone ? "input-error" : ""}
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.phone && <span className="error-msg">{errors.phone}</span>}
                </div>
              </div>

              <div className="payment-method-section">
                <h2>Payment Method</h2>
                <div className="payment-options">
                  <div
                    className={`payment-option-card ${paymentMethod === "Online" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("Online")}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "Online"}
                      readOnly
                    />
                    <div className="payment-option-content">
                      <div className="payment-logos-group">
                        <img src="/visa.png.png" alt="Visa" className="gateway-logo" />
                        <img src="/mastercard.webp.webp" alt="Mastercard" className="gateway-logo" />
                        <img src="/lankaqr.png.png" alt="LankaQR" className="gateway-logo" />
                      </div>
                      <span className="method-label">Online Payment (WebXpay)</span>
                    </div>
                  </div>

                  <div
                    className={`payment-option-card ${paymentMethod === "COD" ? "active" : ""}`}
                    onClick={() => setPaymentMethod("COD")}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "COD"}
                      readOnly
                    />
                    <div className="payment-option-content">
                      <span className="method-label">Cash on Delivery (COD)</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className={`btn-gms btn-gms-primary place-order-btn ${!isFormValid ? 'disabled' : ''}`}
                disabled={!isFormValid}
              >
                {!paymentMethod ? "Select Payment Method" : (paymentMethod === "Online" ? "Proceed to Online Payment" : "Place Order")}
              </button>
            </form>
          </div>

          <div className="order-summary-sidebar">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {itemsToCheckout.map((item) => (
                <div key={item._id} className="summary-item-wrapper">
                  <div className="summary-item">
                    <span>{item.supplementName} x {item.quantity}</span>
                    <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className={isFreeShipping ? "free-shipping-text" : ""}>
                {isFreeShipping ? "FREE" : `Rs. ${shippingFee.toLocaleString()}`}
              </span>
            </div>
            <div className="summary-total">
              <span>Total Amount</span>
              <span>Rs. {totalWithShipping.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
