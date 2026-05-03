import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer__inner">
        <div className="footer__brand">⬡ ShopWave</div>
        <div className="footer__links">
          <Link to="/products">Products</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">Orders</Link>
        </div>
        <div className="footer__copy">© 2026 ShopWave · Built with Spring Boot 3 + React 18</div>
      </div>
    </footer>
  );
}