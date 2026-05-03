// ══════════════════════════════════════════════════════════════
// FIX 1 — frontend/src/pages/Cart.js
// The "Place Order" button currently places the order silently
// with no address or payment selection. Replace the handlePlaceOrder
// function AND the checkout button to redirect to the new Checkout page.
//
// FIND this block (around line 60-71):
// ══════════════════════════════════════════════════════════════

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const order = await orderApi.place({
        couponCode: couponResult?.valid ? coupon.trim() : null,
        paymentMethod: 'COD',
        notes: '',
      });
      setOrderPlaced(order.orderNumber);
      toast.success('Order placed successfully! 🎉');
    } catch (e) {
      toast.error(e.message || 'Failed to place order');
    } finally { setPlacing(false); }
  };

// ══════════════════════════════════════════════════════════════
// REPLACE IT WITH:
// ══════════════════════════════════════════════════════════════

  const handlePlaceOrder = () => {
    // Pass coupon state to checkout via sessionStorage so it survives navigation
    if (couponResult?.valid) {
      sessionStorage.setItem('sw_pending_coupon', JSON.stringify({ code: coupon, result: couponResult }));
    }
    navigate('/checkout');
  };

// ══════════════════════════════════════════════════════════════
// FIX 2 — Same file, Cart.js
// FIND the checkout button label (around line 213-228):
// ══════════════════════════════════════════════════════════════

              {placing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center' }}>
                    <span style={{ width: 16, height: 16, border: '2px solid #00000040', borderTopColor: '#000', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                    Placing Order…
                  </span>
                ) : (
                  `🛒 Place Order · ${fmt(total)}`
                )}

// ══════════════════════════════════════════════════════════════
// REPLACE IT WITH:
// ══════════════════════════════════════════════════════════════

                `🛒 Proceed to Checkout · ${fmt(total)}`

// (also remove the `placing` state and its useState since it's no longer needed in Cart.js)


// ══════════════════════════════════════════════════════════════
// FIX 3 — frontend/src/App.js
// ADD these 2 lines:
// ══════════════════════════════════════════════════════════════

// At the top with other lazy imports, ADD:
const Checkout = React.lazy(() => import('./pages/Checkout'));

// Inside <Routes>, AFTER the /cart route, ADD:
<Route path="/checkout" element={<ProtectedRoute><ErrorBoundary key="/checkout"><Checkout /></ErrorBoundary></ProtectedRoute>} />


// ══════════════════════════════════════════════════════════════
// ROOT CAUSE of items NOT adding to cart:
// ══════════════════════════════════════════════════════════════
//
// The backend CartController.java already has the fix (line marked BUG-2 FIX):
//   CartItem.unitPrice was missing → caused DataIntegrityViolationException
//   because CartItem.unitPrice is @Column(nullable = false)
//
// The fix is already in your CartController.java:
//   .unitPrice(product.getPrice())   ← this line is the fix
//
// BUT if items STILL don't add, check these on the frontend:
//
// 1. Are you logged in? CartContext.addToCart() redirects to /login if not.
//    Open browser DevTools → Application → localStorage → check for 'sw_token'
//
// 2. Is the backend running on port 8080?
//    Check frontend/.env or use REACT_APP_API_URL=http://localhost:8080/api
//
// 3. CORS: If you get a CORS error in the console, check SecurityConfig.java
//    and ensure your frontend origin is allowed.
//
// FRONTEND FIX — CartContext.js addToCart race condition:
// The isLoggedInRef.current check is correct but the redirect uses
// window.location.href which loses React state. Change to navigate():
// ══════════════════════════════════════════════════════════════

// In frontend/src/context/CartContext.js
// FIND:
  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!isLoggedInRef.current) {
      toast.error('Please login to add items to cart');
      setTimeout(() => { window.location.href = '/login'; }, 1200);
      return;
    }

// REPLACE WITH (import useNavigate at the top of the component won't work in context,
// so use the window approach but fix the URL to preserve the return path):
  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!isLoggedInRef.current) {
      toast.error('Please login to add items to cart');
      setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }, 1200);
      return;
    }
