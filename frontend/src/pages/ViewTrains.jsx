import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const ViewTrains = () => {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/trains')
      .then((res) => setTrains(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = trains.filter((t) =>
    [t.trainName, t.source, t.destination, String(t.trainNo)]
      .some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div className="page-header-inner">
              <h1>🚂 Available Trains</h1>
              <input
                className="form-control"
                style={{ maxWidth: 280 }}
                placeholder="Search by name, source, dest…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="spinner-page"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No trains found</h3>
              <p>{search ? 'Try a different search term' : 'No trains have been added yet'}</p>
            </div>
          ) : (
            <div className="trains-grid">
              {filtered.map((train) => (
                <div key={train._id} className="train-card">
                  <div className="train-card-header">
                    <h3>{train.trainName}</h3>
                    <div className="train-no">Train #{train.trainNo}</div>
                  </div>
                  <div className="train-card-body">
                    <div className="route-display">
                      <span>{train.source}</span>
                      <span className="route-arrow">→</span>
                      <span>{train.destination}</span>
                    </div>
                    <div className="train-meta">
                      <div className="meta-item">
                        <span className="label">Fare</span>
                        <span className={`value fare`}>₹{train.fare}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">Available</span>
                        <span className={`value ${train.availableSeats < 10 ? 'seats-low' : ''}`}>
                          {train.availableSeats} seats
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="label">Coaches</span>
                        <span className="value">{train.numberOfCoaches}</span>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-block"
                      disabled={train.availableSeats === 0}
                      onClick={() => navigate(`/book/${train.trainNo}`)}
                    >
                      {train.availableSeats === 0 ? '✗ Fully Booked' : '🎫 Book Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewTrains;
