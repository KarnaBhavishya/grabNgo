// client/src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('gng_cart_items');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [cartShop, setCartShop] = useState(() => {
    const saved = localStorage.getItem('gng_cart_shop');
    return saved ? JSON.parse(saved) : null;
  });

  const [manualList, setManualList] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMode, setPaymentMode] = useState('online'); // 'online' or 'cash'

  useEffect(() => {
    localStorage.setItem('gng_cart_items', JSON.stringify(cartItems));
    localStorage.setItem('gng_cart_shop', JSON.stringify(cartShop));
  }, [cartItems, cartShop]);

  const addToCart = (item, shopInfo) => {
    // If shop is different, check first (handled in UI via warning before action)
    if (cartShop && cartShop.id !== shopInfo.id) {
      if (window.confirm(`Your cart contains items from "${cartShop.name}". Clear cart to add items from "${shopInfo.name}"?`)) {
        setCartItems([{ ...item, quantity: 1 }]);
        setCartShop(shopInfo);
      }
      return;
    }

    if (!cartShop) {
      setCartShop(shopInfo);
    }

    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, amount) => {
    setCartItems(prev => {
      return prev.map(i => {
        if (i.id === itemId) {
          const newQty = i.quantity + amount;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
    setCartShop(null);
    setManualList('');
    setUploadedImage(null);
    setSpecialInstructions('');
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const platformFee = subtotal > 0 ? 5.00 : 0.00;
  const totalAmount = subtotal + platformFee;

  return (
    <CartContext.Provider value={{
      cartItems,
      cartShop,
      manualList,
      uploadedImage,
      specialInstructions,
      paymentMode,
      setManualList,
      setUploadedImage,
      setSpecialInstructions,
      setPaymentMode,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      subtotal,
      platformFee,
      totalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
