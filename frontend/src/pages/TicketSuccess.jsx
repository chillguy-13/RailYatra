import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const TicketSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId = location.state?.bookingId;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) { navigate('/trains'); return; }
    api.get(`/bookings/${bookingId}`)
      .then((res) => setBooking(res.data))
      .catch(() => navigate('/trains'))
      .finally(() => setLoading(false));
  }, [bookingId, navigate]);

  if (loading) return (
    <div className="page"><Navbar /><div className="spinner-page"><div className="spinner" /></div></div>
  );

  if (!booking) return null;

  const handlePrint = () => window.print();

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="success-page">
            <div style={{ marginBottom: '1rem' }}>
              <div className="success-icon">🎉</div>
              <h1 style={{ fontSize: '2.2rem', color: 'var(--navy)' }}>Booking Confirmed!</h1>
              <p style={{ color: 'var(--text-light)', marginTop: '0.4rem' }}>
                Your ticket has been booked successfully. Have a great journey!
              </p>
            </div>

            <div className="ticket-card">
              <div className="ticket-header">
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.15rem' }}>BOOKING ID</div>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem' }}>{booking.bookingId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.15rem' }}>STATUS</div>
                  <span className={`badge-${booking.paid ? 'paid' : 'pending'}`}>
                    {booking.paid ? '✓ PAID' : '⏳ PENDING'}
                  </span>
                </div>
              </div>

              <div className="ticket-body">
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)', fontFamily: 'Rajdhani, sans-serif' }}>
                    {booking.train?.trainName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-mid)' }}>
                    <span>{booking.train?.source}</span>
                    <span style={{ color: 'var(--accent)', fontSize: '1.4rem' }}>→</span>
                    <span>{booking.train?.destination}</span>
                  </div>
                </div>

                {[
                  ['Passenger', booking.user?.username],
                  ['Train No.', `#${booking.train?.trainNo}`],
                  ['Seats', booking.seatNumbers?.join(', ')],
                  ['Passengers', `${booking.seatsBooked} passenger(s)`],
                  ['Booking Time', new Date(booking.bookingTime).toLocaleString('en-IN')],
                ].map(([label, value]) => (
                  <div key={label} className="ticket-row">
                    <span className="tk-label">{label}</span>
                    <span className="tk-value">{value}</span>
                  </div>
                ))}
              </div>

              <div className="ticket-footer">
                <div style={{ fontSize: '1.5rem', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: 'var(--accent)' }}>
                  Total Fare: ₹{booking.fare?.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                  Powered by RailYatra 🚂
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handlePrint}>🖨 Print Ticket</button>
              <button className="btn btn-outline" onClick={() => navigate('/trains')}>Book Another</button>
              <button className="btn btn-outline" onClick={() => navigate('/my-bookings')}>My Bookings</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TicketSuccess;
