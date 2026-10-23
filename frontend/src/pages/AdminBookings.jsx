import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = (nextPage = page) => {
    setLoading(true);
    api.get('/admin/bookings', { params: { page: nextPage, limit: 20 } })
      .then((res) => {
        const data = res.data.bookings || [];
        setBookings(data);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings(page);
  }, [page]);

  const filtered = filter === 'paid' ? bookings.filter((b) => b.paid)
    : filter === 'pending' ? bookings.filter((b) => !b.paid)
    : bookings;

  const totalRevenue = bookings.filter((b) => b.paid).reduce((s, b) => s + b.fare, 0);

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div className="page-header-inner">
              <h1>📋 All Bookings</h1>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>
                  Revenue: <strong style={{ color: 'var(--accent)' }}>₹{totalRevenue.toLocaleString('en-IN')}</strong>
                </span>
                {['all', 'paid', 'pending'].map((f) => (
                  <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="spinner-page"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No bookings found</h3>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>User</th>
                      <th>Train</th>
                      <th>Route</th>
                      <th>Seats</th>
                      <th>Fare</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b._id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-light)' }}>{b.bookingId?.slice(0, 10)}…</td>
                        <td><strong>{b.user?.username}</strong></td>
                        <td>{b.train?.trainName}<br /><span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>#{b.train?.trainNo}</span></td>
                        <td style={{ fontSize: '0.85rem' }}>{b.train?.source} → {b.train?.destination}</td>
                        <td style={{ fontSize: '0.82rem' }}>{b.seatNumbers?.slice(0, 3).join(', ')}{b.seatNumbers?.length > 3 ? `+${b.seatNumbers.length - 3}` : ''}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{b.fare}</td>
                        <td><span className={`badge-${b.paid ? 'paid' : 'pending'}`}>{b.paid ? '✓ Paid' : '⏳ Pending'}</span></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{new Date(b.bookingTime).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #e6edf7' }}>
                <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </button>
                <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Page {page} / {totalPages}</span>
                <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminBookings;
