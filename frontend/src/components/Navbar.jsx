import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const go = (path) => { navigate(path); setMenuOpen(false); };
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => go(isAdmin ? '/admin' : '/home')} style={{ cursor: 'pointer' }}>
          <span className="brand-icon">🚂</span>
          <span>Rail<span className="brand-accent">Yatra</span></span>
        </div>

        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {user && !isAdmin && (
            <>
              <button className={isActive('/home')} onClick={() => go('/home')}>Home</button>
              <button className={isActive('/trains')} onClick={() => go('/trains')}>Trains</button>
              <button className={isActive('/my-bookings')} onClick={() => go('/my-bookings')}>My Bookings</button>
            </>
          )}
          {isAdmin && (
            <>
              <button className={isActive('/admin')} onClick={() => go('/admin')}>Dashboard</button>
              <button className={isActive('/admin/trains')} onClick={() => go('/admin/trains')}>Manage Trains</button>
              <button className={isActive('/admin/bookings')} onClick={() => go('/admin/bookings')}>All Bookings</button>
            </>
          )}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
              <span className="navbar-user">
                👤 <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{user.username}</strong>
                {isAdmin && <span className="badge">Admin</span>}
              </span>
              <button className="nav-link logout" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
