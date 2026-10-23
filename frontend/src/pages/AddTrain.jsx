import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const AddTrain = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ trainNo: '', trainName: '', source: '', destination: '', numberOfCoaches: '', fare: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/trains', {
        trainNo: Number(form.trainNo),
        trainName: form.trainName,
        source: form.source,
        destination: form.destination,
        numberOfCoaches: Number(form.numberOfCoaches),
        fare: Number(form.fare),
      });
      navigate('/admin/trains');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add train');
    } finally {
      setLoading(false);
    }
  };

  const totalSeats = form.numberOfCoaches ? Number(form.numberOfCoaches) * 60 : 0;

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div className="page-header-inner">
              <h1>➕ Add New Train</h1>
              <button className="btn btn-outline" onClick={() => navigate('/admin/trains')}>← Back</button>
            </div>
          </div>

          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="card">
              {error && <div className="alert alert-error">⚠ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Train Number</label>
                    <input className="form-control" name="trainNo" type="number" value={form.trainNo} onChange={handleChange} placeholder="e.g. 12301" required min={1} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fare per Seat (₹)</label>
                    <input className="form-control" name="fare" type="number" value={form.fare} onChange={handleChange} placeholder="e.g. 500" required min={1} step="0.01" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Train Name</label>
                  <input className="form-control" name="trainName" value={form.trainName} onChange={handleChange} placeholder="e.g. Rajdhani Express" required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Source Station</label>
                    <input className="form-control" name="source" value={form.source} onChange={handleChange} placeholder="e.g. Mumbai" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination Station</label>
                    <input className="form-control" name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Delhi" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Number of Coaches</label>
                  <input className="form-control" name="numberOfCoaches" type="number" value={form.numberOfCoaches} onChange={handleChange} placeholder="e.g. 12" required min={1} max={30} />
                  {totalSeats > 0 && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600 }}>
                      → Total seats: {totalSeats} ({form.numberOfCoaches} coaches × 60)
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Adding…' : '✓ Add Train'}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => navigate('/admin/trains')} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddTrain;
