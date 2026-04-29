import { Link } from 'react-router-dom';
import CartItem from '../components/CartItem';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart } = useCart();
  const items = cart.items || [];
  const subtotal = items.reduce((s, i) => s + (i.totalPrice ?? 0), 0);
  const shipping = subtotal > 500 ? 0 : 49;
  const total = subtotal + shipping;

  if (!items.length) return (
    <div style={S.empty}>
      <p style={{ fontSize:'4rem' }}>🛒</p>
      <h2>Your cart is empty</h2>
      <Link to="/products" style={S.shopBtn}>Start Shopping →</Link>
    </div>
  );

  return (
    <div style={S.wrap}>
      <h1 style={S.title}>Shopping Cart ({items.length} items)</h1>
      <div style={S.layout}>
        <div style={S.items}>{items.map(i => <CartItem key={i.id} item={i} />)}</div>
        <div style={S.summary}>
          <h3>Order Summary</h3>
          <div style={S.line}><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
          <div style={S.line}><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
          <hr />
          <div style={{...S.line, fontWeight:700, fontSize:'1.1rem'}}>
            <span>Total</span><span>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <Link to="/checkout" style={S.checkoutBtn}>Proceed to Checkout →</Link>
        </div>
      </div>
    </div>
  );
}

const S = {
  empty:      { minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' },
  shopBtn:    { background:'#ff9800', color:'#fff', padding:'12px 28px', borderRadius:'8px', fontWeight:700 },
  wrap:       { maxWidth:'1100px', margin:'32px auto', padding:'0 24px' },
  title:      { fontSize:'1.6rem', fontWeight:700, marginBottom:'24px' },
  layout:     { display:'grid', gridTemplateColumns:'1fr 320px', gap:'32px', alignItems:'start' },
  items:      { display:'flex', flexDirection:'column', gap:'16px' },
  summary:    { background:'#fff', borderRadius:'12px', padding:'24px', boxShadow:'0 2px 8px rgba(0,0,0,.08)', display:'flex', flexDirection:'column', gap:'12px' },
  line:       { display:'flex', justifyContent:'space-between' },
  checkoutBtn:{ display:'block', textAlign:'center', background:'#1a1a2e', color:'#fff', padding:'14px', borderRadius:'8px', fontWeight:700, marginTop:'8px' },
};