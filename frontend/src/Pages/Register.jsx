import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm]   = useState({ email:'', password:'', firstName:'', lastName:'', phone:'' });
  const [error, setError] = useState('');
  const { register }      = useAuth();
  const navigate          = useNavigate();

  const set = key => e => setForm(f => ({...f, [key]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div style={styles.wrap}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.row}>
          <input style={styles.input} placeholder="First Name" value={form.firstName} onChange={set('firstName')} required />
          <input style={styles.input} placeholder="Last Name"  value={form.lastName}  onChange={set('lastName')} />
        </div>
        <input style={styles.input} type="email"    placeholder="Email"    value={form.email}    onChange={set('email')}    required />
        <input style={styles.input} type="password" placeholder="Password (min 6)" value={form.password} onChange={set('password')} required minLength={6} />
        <input style={styles.input} type="tel"      placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} />
        <button type="submit" style={styles.btn}>Register</button>
        <p style={styles.foot}>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}

const styles = {
  wrap:  { minHeight:'80vh', display:'flex', alignItems:'center', justifyContent:'center' },
  card:  { background:'#fff', padding:'40px', borderRadius:'12px', boxShadow:'0 4px 20px rgba(0,0,0,.1)', width:'100%', maxWidth:'440px', display:'flex', flexDirection:'column', gap:'14px' },
  title: { textAlign:'center', fontSize:'1.6rem', fontWeight:700 },
  error: { color:'#e53935', fontSize:'0.9rem', background:'#ffebee', padding:'8px', borderRadius:'6px' },
  row:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' },
  input: { padding:'12px', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem' },
  btn:   { background:'#1a1a2e', color:'#fff', padding:'12px', borderRadius:'8px', fontSize:'1rem', fontWeight:600, border:'none' },
  foot:  { textAlign:'center', fontSize:'0.9rem' },
};