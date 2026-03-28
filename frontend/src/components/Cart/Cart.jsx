import React from "react";
import Nav from "../Nav/Nav";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartCount } = useCart();
  const navigate = useNavigate();

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="cart-page">
      <Nav />
      <div className="cart-container">
        <h1>Your Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <button className="continue-shopping" onClick={() => navigate("/supplementsdetails")}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cart-content">
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <div key={item._id} className="cart-item-card">
                  <div className="cart-item-image">
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt={item.supplementName} />
                    ) : (
                      <div className="item-placeholder">{item.supplementName[0]}</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <h3>{item.supplementName}</h3>
                    <p className="item-brand">{item.supplementBrand}</p>
                    <p className="item-price">Rs. {item.price.toLocaleString()}</p>
                  </div>
                  <div className="cart-item-quantity">
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="cart-item-total">
                    Rs. {(item.price * item.quantity).toLocaleString()}
                  </div>
                  <button className="remove-item" onClick={() => removeFromCart(item._id)}>
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary-card">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Items ({cartCount})</span>
                <span>Rs. {totalPrice.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-shipping">FREE</span>
              </div>
              <div className="summary-total">
                <span>Total Amount</span>
                <span>Rs. {totalPrice.toLocaleString()}</span>
              </div>
              <button className="checkout-btn" onClick={() => navigate("/checkout")}>
                Proceed to Checkout
              </button>
              <button className="clear-cart-btn" onClick={clearCart}>
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
