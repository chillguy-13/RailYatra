import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bookings/my')
      .then((res) => setBookings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div className="page-header-inner">
              <h1>🎫 My Bookings</h1>
              <button className="btn btn-primary" onClick={() => navigate('/trains')}>+ New Booking</button>
            </div>
          </div>

          {loading ? (
            <div className="spinner-page"><div className="spinner" /></div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎫</div>
              <h3>No bookings yet</h3>
              <p style={{ marginBottom: '1.5rem' }}>Start your journey by booking a train ticket!</p>
              <button className="btn btn-primary" onClick={() => navigate('/trains')}>Browse Trains</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bookings.map((b) => (
                <div key={b._id} className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy)' }}>
                      {b.train?.trainName}
                    </div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      #{b.train?.trainNo} &nbsp;·&nbsp; {b.train?.source} → {b.train?.destination}
                    </div>
                  </div>

                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>Seats</div>
                    <div style={{ fontWeight: 700, marginTop: '0.1rem' }}>{b.seatNumbers?.join(', ')}</div>
                  </div>

                  <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.3rem', color: 'var(--accent)' }}>
                      ₹{b.fare?.toFixed(2)}
                    </div>
                    <div style={{ marginTop: '0.25rem' }}>
                      <span className={`badge-${b.paid ? 'paid' : 'pending'}`}>
                        {b.paid ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.3rem' }}>
                      {new Date(b.bookingTime).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  {!b.paid && (
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => navigate('/payment', { state: { booking: b } })}
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyBookings;
