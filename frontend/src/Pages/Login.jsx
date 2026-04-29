import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login }         = useAuth();
  const navigate          = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div style={styles.wrap}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        {error && <p style={styles.error}>{error}</p>}
        <input style={styles.input} type="email"    placeholder="Email"    value={form.email}
               onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
        <input style={styles.input} type="password" placeholder="Password" value={form.password}
               onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
        <button type="submit" style={styles.btn}>Login</button>
        <p style={styles.foot}>Don't have an account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
}

const styles = {
  wrap:  { minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center' },
  card:  { background:'#fff', padding:'40px', borderRadius:'12px', boxShadow:'0 4px 20px rgba(0,0,0,.1)', width:'100%', maxWidth:'400px', display:'flex', flexDirection:'column', gap:'14px' },
  title: { textAlign:'center', fontSize:'1.6rem', fontWeight:700 },
  error: { color:'#e53935', fontSize:'0.9rem', background:'#ffebee', padding:'8px', borderRadius:'6px' },
  input: { padding:'12px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem' },
  btn:   { background:'#1a1a2e', color:'#fff', padding:'12px', borderRadius:'8px', fontSize:'1rem', fontWeight:600, border:'none' },
  foot:  { textAlign:'center', fontSize:'0.9rem' },
};