import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../config/api';

export default function Orders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const successOrder = params.get('success');

  useEffect(() => {
    api.get('/orders')
       .then(r => setOrders(r.data.content || []))
       .catch(console.error)
       .finally(() => setLoading(false));
  }, []);

  const badgeColor = s => ({'PENDING':'#f59e0b','CONFIRMED':'#3b82f6','SHIPPED':'#06b6d4','DELIVERED':'#10b981','CANCELLED':'#ef4444'}[s]||'#6b7280');

  return (
    <div style={{maxWidth:'800px',margin:'32px auto',padding:'0 24px'}}>
      <h1 style={{fontSize:'1.8rem',fontWeight:700,marginBottom:'24px'}}>My Orders</h1>
      {successOrder && (
        <div style={{background:'#e8f5e9',border:'1px solid #a5d6a7',padding:'14px',borderRadius:'8px',marginBottom:'20px',color:'#1b5e20'}}>
          Order <strong>{successOrder}</strong> placed successfully!
        </div>
      )}
      {loading ? <p>Loading...</p> : orders.length===0 ? (
        <p>No orders yet. <a href="/products">Shop now</a></p>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {orders.map(order => (
            <div key={order.id} style={{background:'#fff',borderRadius:'12px',padding:'20px',boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <span style={{fontWeight:700,fontSize:'1.05rem'}}>#{order.orderNumber}</span>
                <span style={{color:'#fff',padding:'4px 12px',borderRadius:'20px',fontSize:'0.8rem',fontWeight:600,background:badgeColor(order.status)}}>
                  {order.status}
                </span>
              </div>
              <div style={{display:'flex',gap:'20px',color:'#555',fontSize:'0.9rem',marginBottom:'8px',flexWrap:'wrap'}}>
                <span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                <span>{order.paymentMethod}</span>
                <span style={{fontWeight:700}}>Rs.{order.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                {order.items?.map(i => (
                  <span key={i.id} style={{background:'#f5f5f5',padding:'4px 10px',borderRadius:'20px',fontSize:'0.82rem'}}>
                    {i.productName} x{i.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}