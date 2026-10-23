import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const statCards = (s) => [
  { label: 'Total Users', value: s.totalUsers, icon: '👥', cls: 'blue' },
  { label: 'Total Trains', value: s.totalTrains, icon: '🚂', cls: 'orange' },
  { label: 'Total Bookings', value: s.totalBookings, icon: '🎫', cls: 'green' },
  { label: 'Paid Bookings', value: s.paidBookings, icon: '✅', cls: 'purple' },
  { label: 'Revenue (₹)', value: `₹${(s.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', cls: 'red' },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/bookings', { params: { page: 1, limit: 6 } }),
    ]).then(([sRes, bRes]) => {
      setStats(sRes.data);
      setRecentBookings(bRes.data.bookings || []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div className="page-header-inner">
              <h1>📊 Admin Dashboard</h1>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => navigate('/admin/trains')}>Manage Trains</button>
                <button className="btn btn-outline" onClick={() => navigate('/admin/trains/add')}>+ Add Train</button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="spinner-page"><div className="spinner" /></div>
          ) : (
            <>
              <div className="stats-grid">
                {statCards(stats).map((s) => (
                  <div key={s.label} className="stat-card">
                    <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                    <div className="stat-info">
                      <div className="stat-label">{s.label}</div>
                      <div className="stat-value">{s.value ?? '—'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {recentBookings.length > 0 && (
                <div className="card">
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.3rem', color: 'var(--navy)' }}>Recent Bookings</h2>
                    <button className="btn btn-sm btn-outline" onClick={() => navigate('/admin/bookings')}>View All</button>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Train</th>
                          <th>Seats</th>
                          <th>Fare</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentBookings.map((b) => (
                          <tr key={b._id}>
                            <td><strong>{b.user?.username}</strong></td>
                            <td>{b.train?.trainName}</td>
                            <td>{b.seatNumbers?.slice(0, 3).join(', ')}{b.seatNumbers?.length > 3 ? '…' : ''}</td>
                            <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{b.fare}</td>
                            <td><span className={`badge-${b.paid ? 'paid' : 'pending'}`}>{b.paid ? 'Paid' : 'Pending'}</span></td>
                            <td style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{new Date(b.bookingTime).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
