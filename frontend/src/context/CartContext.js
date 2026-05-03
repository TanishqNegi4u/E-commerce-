// src/context/CartContext.js
// FIX (BUG-10): Cart now re-fetches when user logs in and clears on logout.
// The useEffect previously fired unconditionally on mount regardless of auth state,
// causing unauthenticated 401 requests on every page load.
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartApi } from '../api/client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isLoggedIn, registerAuthChangeCallback } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!localStorage.getItem('sw_token')) return;
    try {
      setLoading(true);
      const data = await cartApi.get();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => setCart(null), []);

  // Register callback so AuthContext can trigger fetchCart on login / clearCart on logout
  useEffect(() => {
    registerAuthChangeCallback((event) => {
      if (event === 'login') fetchCart();
      if (event === 'logout') clearCart();
    });
  }, [registerAuthChangeCallback, fetchCart, clearCart]);

  // Fetch cart on mount only if already logged in (page refresh with existing session)
  useEffect(() => {
    if (isLoggedIn) fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount — auth change is handled via callback above

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!localStorage.getItem('sw_token')) {
      toast.error('Please login to add items to cart');
      return;
    }
    try {
      const data = await cartApi.add(productId, quantity);
      setCart(data);
      toast.success('Added to cart!');
    } catch (e) {
      toast.error(e.message || 'Failed to add to cart');
    }
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      const data = await cartApi.update(productId, quantity);
      setCart(data);
    } catch (e) {
      toast.error(e.message || 'Failed to update quantity');
    }
  }, []);

  const removeItem = useCallback(async (productId) => {
    try {
      const data = await cartApi.remove(productId);
      setCart(data);
      toast.success('Removed from cart');
    } catch (e) {
      toast.error(e.message || 'Failed to remove item');
    }
  }, []);

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addToCart, updateQuantity, removeItem, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);