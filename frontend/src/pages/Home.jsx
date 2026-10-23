import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const features = [
  { icon: '🎯', title: 'Choose Your Seat', desc: 'Pick any seat from the interactive visual seat map.' },
  { icon: '⚡', title: 'Instant Booking', desc: 'Book up to 4 seats in seconds with real-time availability.' },
  { icon: '💳', title: 'Secure Payment', desc: 'Pay safely via Razorpay — UPI, cards, netbanking.' },
  { icon: '🎫', title: 'Digital Ticket', desc: 'Download your PDF ticket immediately after booking.' },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page">
      <Navbar />

      <div className="hero">
        <div className="hero-content">
          <h1>Hello, <span>{user?.username}</span>! 👋</h1>
          <p>Ready to plan your next journey? Browse available trains and book your seats instantly.</p>
          <div className="hero-actions">
            <button className="btn btn-accent btn-lg" onClick={() => navigate('/trains')}>🔍 Browse Trains</button>
            <button className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }} onClick={() => navigate('/my-bookings')}>
              🎫 My Bookings
            </button>
          </div>
        </div>
      </div>

      <main className="main-content">
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--navy)', marginBottom: '2rem' }}>
            Why RailYatra?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            {features.map((f) => (
              <div key={f.title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <h3 style={{ color: 'var(--navy)', marginBottom: '0.4rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-mid))', color: 'white', textAlign: 'center', padding: '2.5rem' }}>
            <h2 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '1.8rem' }}>Ready to travel?</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>Check seat availability and book your ticket now.</p>
            <button className="btn btn-accent btn-lg" onClick={() => navigate('/trains')}>
              View All Trains →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
