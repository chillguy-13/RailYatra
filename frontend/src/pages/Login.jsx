import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      navigate(user.role === 'ROLE_ADMIN' ? '/admin' : '/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <span className="auth-train-icon">🚂</span>
          <h1>Rail<span>Yatra</span></h1>
          <p>Your trusted companion for seamless train ticket booking across India</p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['⚡ Fast Booking', '🎫 Easy Tickets', '🛡 Secure Pay'].map((f) => (
              <div key={f} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to your RailYatra account</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-control"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-footer-link">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '0.85rem', background: '#f8fafc', borderRadius: 8, fontSize: '0.8rem', color: '#64748b', borderLeft: '3px solid #cbd5e1' }}>
            <strong>Demo credentials:</strong><br />
            Admin: <code>admin</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
