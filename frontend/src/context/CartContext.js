// src/context/CartContext.js
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { cartApi } from '../api/client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

function normalizeCart(raw) {
  if (!raw) return null;
  return {
    ...raw,
    items: (raw.items || []).map(item => {
      const p = item.product || {};
      return {
        ...item,
        productId:   item.productId   ?? p.id,
        productName: item.productName ?? p.name,
        imageUrl:    item.imageUrl    ?? p.imageUrl ?? p.images?.[0],
        unitPrice:   item.unitPrice   ?? p.price,
        totalPrice:  item.totalPrice  ?? (p.price * item.quantity),
      };
    }),
  };
}

export function CartProvider({ children }) {
  const { isLoggedIn, registerAuthChangeCallback } = useAuth();
  const isLoggedInRef = useRef(isLoggedIn);
  useEffect(() => { isLoggedInRef.current = isLoggedIn; }, [isLoggedIn]);

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!localStorage.getItem('sw_token')) return;
    try {
      setLoading(true);
      const data = await cartApi.get();
      setCart(normalizeCart(data));
    } catch (e) {
      if (e?.message?.includes('Session expired')) setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => setCart(null), []);

  useEffect(() => {
    registerAuthChangeCallback((event) => {
      if (event === 'login') fetchCart();
      if (event === 'logout') clearCart();
    });
  }, [registerAuthChangeCallback, fetchCart, clearCart]);

  useEffect(() => {
    if (isLoggedIn) fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const hasToken = !!localStorage.getItem('sw_token');
    if (!isLoggedInRef.current && !hasToken) {
      toast.error('Please login to add items to cart');
      setTimeout(() => { window.location.href = '/login'; }, 1200);
      return;
    }
    const toastId = toast.loading('Adding to cart…');
    try {
      const data = await cartApi.add(productId, quantity);
      // FIX: validate response before showing success. If backend threw a 500,
      // data will be null/empty — don't show "Added to cart!" in that case.
      if (!data || !data.id) {
        toast.error('Could not update cart. Please try again.', { id: toastId });
        return;
      }
      setCart(normalizeCart(data));
      toast.success('Added to cart!', { id: toastId });
    } catch (e) {
      const msg = e?.message || 'Failed to add to cart';
      if (msg.includes('Session expired') || msg.includes('401')) {
        toast.error('Session expired. Please log in again.', { id: toastId });
        setTimeout(() => { window.location.href = '/login'; }, 1400);
      } else {
        toast.error(msg, { id: toastId });
      }
    }
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity <= 0) {
      try {
        const data = await cartApi.remove(productId);
        setCart(normalizeCart(data));
        toast.success('Removed from cart');
      } catch (e) {
        toast.error(e?.message || 'Failed to remove item');
      }
      return;
    }
    try {
      const data = await cartApi.update(productId, quantity);
      setCart(normalizeCart(data));
    } catch (e) {
      toast.error(e?.message || 'Failed to update quantity');
    }
  }, []);

  const removeItem = useCallback(async (productId) => {
    try {
      const data = await cartApi.remove(productId);
      setCart(normalizeCart(data));
      toast.success('Removed from cart');
    } catch (e) {
      toast.error(e?.message || 'Failed to remove item');
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