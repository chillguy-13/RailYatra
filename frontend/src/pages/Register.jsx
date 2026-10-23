import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <span className="auth-train-icon">🚂</span>
          <h1>Join Rail<span>Yatra</span></h1>
          <p>Create your account and start booking train tickets in minutes</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-box">
          <h2>Create account</h2>
          <p className="subtitle">Join thousands of happy travellers</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-control" name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required minLength={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-control" type="password" name="confirm" value={form.confirm} onChange={handleChange} placeholder="Repeat your password" required />
            </div>
            <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <div className="auth-footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
