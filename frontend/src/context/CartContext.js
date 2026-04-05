import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, quantity = 1, silent = false) => {
    let success = false;
    let errorMsg = "";

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === product._id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.availableStock) {
          errorMsg = `Only ${product.availableStock} items available in stock.`;
          return prevItems;
        }
        success = true;
        return prevItems.map((item) =>
          item._id === product._id ? { ...item, quantity: newQuantity } : item
        );
      } else {
        if (quantity > product.availableStock) {
          errorMsg = `Only ${product.availableStock} items available in stock.`;
          return prevItems;
        }
        success = true;
        return [...prevItems, { ...product, quantity }];
      }
    });

    // Handle notifications outside the state update
    if (errorMsg) {
      toast.error(errorMsg, { id: `cart-error-${product._id}` });
    } else if (success && !silent) {
      toast.success(`${product.supplementName} added to cart!`, { id: `cart-success-${product._id}` });
    }
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== productId));
    toast.success("Item removed from cart.", { id: `cart-remove-${productId}` });
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    let errorMsg = "";

    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id === productId) {
          // Check stock before updating
          if (newQuantity > item.availableStock) {
             errorMsg = `Only ${item.availableStock} items available in stock.`;
             return item;
          }
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      })
    );

    if (errorMsg) {
      toast.error(errorMsg, { id: `qty-error-${productId}` });
    }
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem("cart");
  }, []);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
