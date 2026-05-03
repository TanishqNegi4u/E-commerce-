// frontend/src/context/CartContext.js  — FULL REPLACEMENT
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

  const [cart, setCart]       = useState(null);
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
      if (event === 'login')  fetchCart();
      if (event === 'logout') clearCart();
    });
  }, [registerAuthChangeCallback, fetchCart, clearCart]);

  useEffect(() => {
    if (isLoggedIn) fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!isLoggedInRef.current) {
      toast.error('Please login to add items to cart');
      // ── FIX: preserve current page so user is returned after login ──
      setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }, 1200);
      return;
    }
    const toastId = toast.loading('Adding to cart…');
    try {
      const data = await cartApi.add(productId, quantity);
      setCart(normalizeCart(data));
      // ── FIX: show actionable toast with "View Cart" link ──
      toast(
        (t) => (
          <span>
            Added to cart!{' '}
            <button
              onClick={() => { toast.dismiss(t.id); window.location.href = '/cart'; }}
              style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
            >
              View Cart →
            </button>
          </span>
        ),
        { id: toastId, duration: 3500 }
      );
    } catch (e) {
      const msg = e?.message || 'Failed to add to cart';
      if (msg.includes('Session expired') || msg.includes('401')) {
        toast.error('Session expired. Please log in again.', { id: toastId });
        setTimeout(() => {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }, 1400);
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
