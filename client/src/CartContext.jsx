import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './services/api';
import { isAuthenticated, getCurrentUser } from './auth';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const navigate = typeof window !== 'undefined' && window.location ? null : useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart from backend or localStorage on mount/login
  const loadCart = useCallback(async () => {
    setLoading(true);
    if (isAuthenticated()) {
      try {
        const res = await API.get('/cart');
        // Handle { cart: { items: [...] } }, { items: [...] }, and direct array response
        const items = res.data?.cart?.items || res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setCart(items);
      } catch (err) {
        console.error('Failed to load cart:', err);
        setCart([]);
      }
    } else {
      const stored = localStorage.getItem('cart');
      setCart(stored ? JSON.parse(stored) : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCart();
    // Listen for login/logout events (optional: use a custom event or context)
    window.addEventListener('storage', loadCart);
    return () => window.removeEventListener('storage', loadCart);
  }, [loadCart]);

  // Sync cart to backend/localStorage
  const syncCart = async (newCart) => {
    if (isAuthenticated()) {
      try {
        const items = newCart.map(({ product, quantity, size }) => {
          // Ensure product has _id or id
          if (!product) {
            console.error('Invalid product in cart: product is null/undefined', product);
            return null;
          }
          const productId = product._id || product.id;
          if (!productId) {
            console.error('Invalid product in cart: missing _id or id', {
              product,
              has_id: !!product._id,
              hasId: !!product.id
            });
            return null;
          }
          return {
            product: productId,
            quantity,
            size: size === null || size === undefined ? '' : size
          };
        }).filter(item => item !== null); // Remove invalid items
        
        await API.post('/cart', { items });
        // Don't update state here - it's already updated by the calling function
      } catch (err) {
        console.error('Failed to sync cart to server:', err);
        // Still update local state even if server sync fails
      }
    } else {
      try {
        localStorage.setItem('cart', JSON.stringify(newCart));
      } catch (err) {
        console.error('Failed to save cart to localStorage:', err);
      }
    }
  };

  // Add to cart: support size/variation
  const addToCart = (product, quantity = 1, size = null, variationName = null) => {
    if (!isAuthenticated()) {
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login';
      } else if (navigate) {
        navigate('/login');
      }
      return;
    }
    // Validate product - support both _id (MongoDB) and id
    if (!product) {
      console.error('Cannot add to cart: product is null/undefined', product);
      alert('Cannot add product to cart. Product information is missing.');
      return;
    }
    
    // Fix: Unwrap product if it's nested (e.g., { product: { _id: ... } })
    if (product.product && typeof product.product === 'object') {
      product = product.product;
    }
    
    const productId = product._id || product.id;
    if (!productId) {
      console.error('Cannot add to cart: product missing _id or id', {
        product,
        has_id: !!product._id,
        hasId: !!product.id,
        keys: Object.keys(product)
      });
      alert('Cannot add product to cart. Product ID is missing.');
      return;
    }
    
    // Normalize product to always have _id
    const normalizedProduct = { ...product, _id: productId };
    
    setCart(prev => {
      const existing = prev.find(item => 
        item.product && 
        (item.product._id || item.product.id) === productId && 
        (item.size || null) === (size || null) && 
        (item.variationName || null) === (variationName || null)
      );
      let newCart;
      if (existing) {
        newCart = prev.map(item =>
          item.product && (item.product._id || item.product.id) === productId && 
          (item.size || null) === (size || null) && 
          (item.variationName || null) === (variationName || null)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prev, { product: normalizedProduct, quantity, size: size || null, variationName: variationName || null }];
      }
      syncCart(newCart);
      return newCart;
    });
  };

  // Update quantity: support size/variation
  const updateQuantity = (productId, quantity, size = null, variationName = null) => {
    setCart(prev => {
      const newCart = prev.map(item =>
        item.product._id === productId && item.size === size && item.variationName === variationName ? { ...item, quantity } : item
      );
      syncCart(newCart);
      return newCart;
    });
  };

  // Remove: support size/variation
  const removeFromCart = (productId, size = null, variationName = null) => {
    setCart(prev => {
      const newCart = prev.filter(item => !(item.product._id === productId && item.size === size && item.variationName === variationName));
      syncCart(newCart);
      return newCart;
    });
  };

  const clearCart = async () => {
    if (isAuthenticated()) {
      try {
        await API.delete('/cart');
      } catch (err) {
        console.error('Failed to clear cart on server:', err);
      }
    } else {
      localStorage.removeItem('cart');
    }
    setCart([]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart, loading }}>
      {children}
    </CartContext.Provider>
  );
}
