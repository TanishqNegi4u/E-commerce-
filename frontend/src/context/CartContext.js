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