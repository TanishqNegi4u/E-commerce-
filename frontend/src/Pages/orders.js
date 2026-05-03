import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../api/client';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';

const fmt  = n  => '₹' + Number(n).toLocaleString('en-IN');
const date = ts => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function SkeletonOrder() {
  return (
    <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius)', marginBottom: '1rem' }} aria-hidden="true" />
  );
}

// BUG-8 FIX: Orders now supports pagination instead of always loading page 0.
// Adds page state and prev/next controls so users can see all their orders.
export default function Orders() {
  useDocumentTitle('My Orders');
  const [page, setPage] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => orderApi.getMyOrders(page),
  });

  const orders     = data?.content || (Array.isArray(data) ? data : []);
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.totalElements ?? orders.length;

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await orderApi.cancel(id);
      toast.success('Order cancelled');
      refetch();
    } catch (e) {
      toast.error(e.message || 'Failed to cancel order');
    }
  };

  return (
    <div className="container page-wrap">
      <div className="page-header">
        <h1>My Orders</h1>
        <p className="text-muted">{totalCount} order{totalCount !== 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon">⚠️</span>
          <span>Failed to load orders.</span>
        </div>
      )}

      {isLoading ? (
        <>{[1,2,3].map(i => <SkeletonOrder key={i} />)}</>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">📦</span>
          <h3>No orders yet</h3>
          <p>Looks like you haven't ordered anything.</p>
          <Link to="/products" className="btn btn-primary mt-2">Start Shopping</Link>
        </div>
      ) : (
        <>
          <div>
            {orders.map(order => (
              <article key={order.id} className="order-card">
                <div className="order-card__header">
                  <div>
                    <div className="order-card__number">#{order.orderNumber}</div>
                    <div className="order-card__date">{date(order.createdAt)}</div>
                  </div>
                  <span className={`order-status order-status--${order.status}`} aria-label={`Order status: ${order.status}`}>
                    {order.status}
                  </span>
                </div>

                {order.items?.length > 0 && (
                  <div className="order-card__items" aria-label="Order items">
                    {order.items.slice(0, 5).map((item, i) => (
                      <img
                        key={i}
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'}
                        alt={item.productName}
                        className="order-item-thumb"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'; }}
                      />
                    ))}
                    {order.items.length > 5 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, background: 'var(--surface2)', borderRadius: 8, fontSize: '.78rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        +{order.items.length - 5}
                      </div>
                    )}
                  </div>
                )}

                <div className="order-card__footer">
                  <div>
                    <div style={{ fontSize: '.78rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)', marginBottom: '.2rem' }}>
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </div>
                    <div className="order-card__total">{fmt(order.totalAmount)}</div>
                  </div>
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancel(order.id)}
                      aria-label={`Cancel order #${order.orderNumber}`}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* BUG-8 FIX: pagination controls */}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Orders pagination">
              <button
                disabled={page === 0}
                onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                aria-label="Previous page"
              >‹</button>
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                <button
                  key={i}
                  className={i === page ? 'active' : ''}
                  onClick={() => { setPage(i); window.scrollTo(0, 0); }}
                  aria-label={`Page ${i + 1}`}
                  aria-current={i === page ? 'page' : undefined}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page >= totalPages - 1}
                onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                aria-label="Next page"
              >›</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}