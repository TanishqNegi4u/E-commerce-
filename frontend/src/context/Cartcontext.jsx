import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../config/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { token } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });

  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch (e) { /* cart not yet created */ }
  }, [token]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    await api.post('/cart/items', { productId, quantity });
    fetchCart();
  };

  const removeFromCart = async (cartItemId) => {
    await api.delete(`/cart/items/${cartItemId}`);
    fetchCart();
  };

  const updateQuantity = async (cartItemId, quantity) => {
    await api.put(`/cart/items/${cartItemId}`, { quantity });
    fetchCart();
  };

  const cartCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, cartCount, addToCart, removeFromCart, updateQuantity, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);