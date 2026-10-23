import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const ManageTrains = () => {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const fetchTrains = () => {
    api.get('/trains')
      .then((res) => setTrains(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchTrains, []);

  const handleDelete = async (trainNo, trainName) => {
    if (!window.confirm(`Delete train "${trainName}" (#${trainNo})? All its bookings will also be deleted.`)) return;
    setDeletingId(trainNo);
    try {
      await api.delete(`/trains/${trainNo}`);
      setTrains((prev) => prev.filter((t) => t.trainNo !== trainNo));
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div className="page-header-inner">
              <h1>🚂 Manage Trains</h1>
              <button className="btn btn-primary" onClick={() => navigate('/admin/trains/add')}>+ Add Train</button>
            </div>
          </div>

          {loading ? (
            <div className="spinner-page"><div className="spinner" /></div>
          ) : trains.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚂</div>
              <h3>No trains yet</h3>
              <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/admin/trains/add')}>Add First Train</button>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Train No.</th>
                      <th>Name</th>
                      <th>Route</th>
                      <th>Coaches</th>
                      <th>Total Seats</th>
                      <th>Available</th>
                      <th>Fare</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trains.map((t) => (
                      <tr key={t._id}>
                        <td><strong>#{t.trainNo}</strong></td>
                        <td>{t.trainName}</td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{t.source}</span>
                          <span style={{ color: 'var(--accent)', margin: '0 0.3rem' }}>→</span>
                          <span style={{ fontWeight: 600 }}>{t.destination}</span>
                        </td>
                        <td>{t.numberOfCoaches}</td>
                        <td>{t.totalSeats}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: t.availableSeats < 10 ? 'var(--red)' : 'var(--green)' }}>
                            {t.availableSeats}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{t.fare}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-sm btn-outline" onClick={() => navigate(`/admin/trains/edit/${t.trainNo}`)}>✏ Edit</button>
                            <button
                              className="btn btn-sm btn-danger"
                              disabled={deletingId === t.trainNo}
                              onClick={() => handleDelete(t.trainNo, t.trainName)}
                            >
                              {deletingId === t.trainNo ? '…' : '🗑'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageTrains;
