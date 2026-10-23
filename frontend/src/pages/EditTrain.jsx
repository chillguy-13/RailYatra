import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const EditTrain = () => {
  const { trainNo } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ trainName: '', source: '', destination: '', numberOfCoaches: '', fare: '' });
  const [original, setOriginal] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.get(`/trains/${trainNo}`)
      .then((res) => {
        const t = res.data.train;
        setOriginal(t);
        setForm({ trainName: t.trainName, source: t.source, destination: t.destination, numberOfCoaches: t.numberOfCoaches, fare: t.fare });
      })
      .catch(() => navigate('/admin/trains'))
      .finally(() => setFetching(false));
  }, [trainNo, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put(`/trains/${trainNo}`, {
        trainName: form.trainName,
        source: form.source,
        destination: form.destination,
        numberOfCoaches: Number(form.numberOfCoaches),
        fare: Number(form.fare),
      });
      navigate('/admin/trains');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="page"><Navbar /><div className="spinner-page"><div className="spinner" /></div></div>;

  const newTotal = form.numberOfCoaches ? Number(form.numberOfCoaches) * 60 : 0;

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div className="page-header-inner">
              <h1>✏ Edit Train #{trainNo}</h1>
              <button className="btn btn-outline" onClick={() => navigate('/admin/trains')}>← Back</button>
            </div>
          </div>

          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div className="card">
              {original && (
                <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
                  ℹ Editing: <strong>{original.trainName}</strong> (#{original.trainNo})
                </div>
              )}

              {error && <div className="alert alert-error">⚠ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Train Name</label>
                  <input className="form-control" name="trainName" value={form.trainName} onChange={handleChange} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Source</label>
                    <input className="form-control" name="source" value={form.source} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination</label>
                    <input className="form-control" name="destination" value={form.destination} onChange={handleChange} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Number of Coaches</label>
                    <input className="form-control" name="numberOfCoaches" type="number" value={form.numberOfCoaches} onChange={handleChange} required min={1} max={30} />
                    {newTotal > 0 && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--blue)', fontWeight: 600 }}>
                        → {newTotal} total seats
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fare per Seat (₹)</label>
                    <input className="form-control" name="fare" type="number" value={form.fare} onChange={handleChange} required min={1} step="0.01" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Saving…' : '✓ Save Changes'}
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

export default EditTrain;
