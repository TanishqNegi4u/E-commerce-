import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', flexDirection: 'column', gap: '1rem', padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem' }}>Something went wrong</h2>
        <p style={{ color: 'var(--text2)', maxWidth: 400, fontSize: '.9rem' }}>
          An unexpected error occurred. Please refresh the page or try again.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    );
  }
}