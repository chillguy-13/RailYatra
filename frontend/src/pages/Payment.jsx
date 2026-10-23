import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Calculate remaining seconds from booking expiration
  const initialSeconds = booking?.holdExpiresAt
    ? Math.max(0, Math.floor((new Date(booking.holdExpiresAt).getTime() - Date.now()) / 1000))
    : 60;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [expired, setExpired] = useState(initialSeconds <= 0);

  useEffect(() => {
    if (!booking) {
      navigate('/trains');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [booking, navigate]);

  if (!booking) {
    return null;
  }

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    if (expired) {
      setError('Seat hold expired. Please reselect your seats.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay failed to load');

      const orderRes = await api.post('/payment/create-order', { amount: booking.fare });
      const order = orderRes.data;

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'RailYatra',
        description: `Booking: ${booking.bookingId}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Mark booking as paid
            await api.patch(`/bookings/${booking.bookingId}/pay`, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            });

            navigate('/ticket-success', { state: { bookingId: booking.bookingId } });
          } catch (e) {
            setError(e.response?.data?.error || 'Payment verification failed. Contact support.');
          }
        },
        prefill: { name: booking.user?.username },
        theme: { color: '#1565c0' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Payment failed');
      setLoading(false);
    }
  };

  // Demo: simulate payment without real Razorpay
  const handleDemoPayment = async () => {
    if (expired) {
      setError('Seat hold expired. Please reselect your seats.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.patch(`/bookings/${booking.bookingId}/pay`, {
        razorpayPaymentId: `demo_pay_${Date.now()}`,
        razorpayOrderId: `demo_order_${Date.now()}`,
      });
      navigate('/ticket-success', { state: { bookingId: booking.bookingId } });
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
      setLoading(false);
    }
  };

  const handleCancelAndBack = async () => {
    setLoading(true);
    try {
      // Explicitly release Redis hold lock
      await api.post(`/bookings/${booking.bookingId}/cancel`);
    } catch (e) {
      // Continue navigation even on error
    } finally {
      navigate(booking.train?.trainNo ? `/book/${booking.train.trainNo}` : '/trains');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="payment-page">
            <div className="page-header">
              <h1>💳 Payment & Confirmation</h1>
            </div>

            <div className="card payment-card">
              {/* Hold Timer Banner */}
              <div
                style={{
                  background: expired ? '#fee2e2' : timeLeft <= 15 ? '#fef3c7' : '#eff6ff',
                  border: `1.5px solid ${expired ? '#ef4444' : timeLeft <= 15 ? '#f59e0b' : '#3b82f6'}`,
                  borderRadius: '10px',
                  padding: '0.85rem 1.25rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{expired ? '⚠️' : '⏱'}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: expired ? '#991b1b' : '#1e3a8a' }}>
                    {expired
                      ? 'Seat Hold Expired (60s). Seats have been released.'
                      : 'Seats Held in Redis (Protected for 60s)'}
                  </span>
                </div>
                {!expired && (
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: timeLeft <= 15 ? '#b45309' : '#1d4ed8',
                      background: 'white',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                  >
                    {formattedTime}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🎫</div>
              <h2 style={{ color: 'var(--navy)' }}>Complete Your Ticket Booking</h2>

              <div className="payment-amount">
                <span>₹</span>{booking.fare?.toFixed(2)}
              </div>

              <div className="payment-details">
                {[
                  ['Booking ID', booking.bookingId?.slice(0, 12) + '…'],
                  ['Train', `${booking.train?.trainName} (#${booking.train?.trainNo})`],
                  ['Route', `${booking.train?.source} → ${booking.train?.destination}`],
                  ['Seats', booking.seatNumbers?.join(', ')],
                  ['Passengers', `${booking.seatsBooked} seat(s)`],
                ].map(([label, value]) => (
                  <div key={label} className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0', borderBottom: '1px solid var(--gray-200)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>

              {error && <div className="alert alert-error">⚠ {error}</div>}

              {expired ? (
                <div style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary btn-block btn-lg" onClick={handleCancelAndBack}>
                    ← Reselect Seats on Train #{booking.train?.trainNo}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  <button className="btn btn-primary btn-block btn-lg" onClick={handlePayment} disabled={loading}>
                    {loading ? 'Processing Payment…' : '💳 Pay with Razorpay'}
                  </button>
                  <button className="btn btn-success btn-block" onClick={handleDemoPayment} disabled={loading}>
                    ✅ Demo Pay (Instant Test)
                  </button>
                  <button className="btn btn-outline btn-block" onClick={handleCancelAndBack} disabled={loading}>
                    ← Cancel Hold & Change Seats
                  </button>
                </div>
              )}

              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '1rem', textAlign: 'center' }}>
                🔒 Redis TTL lock guarantees your seats are held exclusively for 60 seconds.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
