import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../config/api';

// Replace with your pk_test_... key from https://dashboard.stripe.com/test/apikeys
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_REPLACE_ME');

function CheckoutForm() {
  const stripe   = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [method,  setMethod]  = useState('CARD');
  const [notes,   setNotes]   = useState('');

  const items    = cart.items || [];
  const subtotal = items.reduce((s, i) => s + (i.totalPrice || 0), 0);
  const shipping = subtotal > 500 ? 0 : 49;
  const total    = subtotal + shipping;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      if (method === 'CARD') {
        const { data } = await api.post('/payments/create-intent', { amount: total * 100, currency: 'inr' });
        const result = await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: { card: elements.getElement(CardElement) },
        });
        if (result.error) { setMessage('Payment failed: ' + result.error.message); setLoading(false); return; }
        if (result.paymentIntent.status !== 'succeeded') { setMessage('Payment incomplete.'); setLoading(false); return; }
      }
      const { data: order } = await api.post('/orders', { paymentMethod: method, notes });
      await fetchCart();
      navigate('/orders?success=' + order.orderNumber);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  if (!items.length) return <p style={{padding:'40px',textAlign:'center'}}>Cart is empty. <a href="/products">Shop</a></p>;

  return (
    <form onSubmit={handleSubmit} style={{background:'#fff',borderRadius:'12px',padding:'32px',boxShadow:'0 4px 20px rgba(0,0,0,.1)',display:'flex',flexDirection:'column',gap:'14px'}}>
      <h2>Order Summary</h2>
      {items.map(i => (
        <div key={i.id} style={{display:'flex',justifyContent:'space-between'}}>
          <span>{i.product?.name} x{i.quantity}</span>
          <span>Rs.{(i.totalPrice||0).toLocaleString('en-IN')}</span>
        </div>
      ))}
      <hr />
      <div style={{display:'flex',justifyContent:'space-between'}}><span>Shipping</span><span>{shipping===0?'FREE':'Rs.'+shipping}</span></div>
      <div style={{display:'flex',justifyContent:'space-between',fontWeight:700}}><span>Total</span><span>Rs.{total.toLocaleString('en-IN')}</span></div>

      <h3>Payment Method</h3>
      <div style={{display:'flex',gap:'20px'}}>
        {['CARD','COD'].map(m => (
          <label key={m} style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
            <input type="radio" value={m} checked={method===m} onChange={()=>setMethod(m)} />
            {m==='CARD' ? 'Card (Stripe)' : 'Cash on Delivery'}
          </label>
        ))}
      </div>

      {method==='CARD' && (
        <div style={{border:'1px solid #ddd',borderRadius:'8px',padding:'16px',background:'#fafafa'}}>
          <CardElement options={{style:{base:{fontSize:'16px'}}}} />
          <p style={{marginTop:'10px',fontSize:'0.8rem',color:'#666'}}>
            Test card: 4242 4242 4242 4242 | any future expiry | any CVC
          </p>
        </div>
      )}

      <textarea style={{border:'1px solid #ddd',borderRadius:'8px',padding:'12px',resize:'vertical'}}
        placeholder="Order notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} rows={3} />

      {message && <p style={{color:'#e53935',background:'#ffebee',padding:'10px',borderRadius:'6px'}}>{message}</p>}

      <button type="submit" disabled={loading||!stripe}
        style={{background:'#1a1a2e',color:'#fff',padding:'14px',borderRadius:'8px',fontSize:'1rem',fontWeight:700,border:'none'}}>
        {loading ? 'Processing...' : 'Pay Rs.' + total.toLocaleString('en-IN')}
      </button>
    </form>
  );
}

export default function Checkout() {
  return (
    <div style={{maxWidth:'560px',margin:'40px auto',padding:'0 24px'}}>
      <h1 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'24px'}}>Checkout</h1>
      <Elements stripe={stripePromise}><CheckoutForm /></Elements>
    </div>
  );
}