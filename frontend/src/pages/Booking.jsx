import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const SEATS_PER_ROW = 6;
const SEATS_PER_COACH = 60;
const ROWS_PER_COACH = SEATS_PER_COACH / SEATS_PER_ROW; // 10 rows
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Helper for seat position type (Window, Middle, Aisle)
const getSeatType = (label) => {
  if (label === 'A' || label === 'F') return { type: 'Window', badge: 'W' };
  if (label === 'B' || label === 'E') return { type: 'Middle', badge: 'M' };
  return { type: 'Aisle', badge: 'A' };
};

const Booking = () => {
  const { trainNo } = useParams();
  const navigate = useNavigate();
  const [train, setTrain] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [currentCoach, setCurrentCoach] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchTrainDetails = useCallback((showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    return api.get(`/trains/${trainNo}`)
      .then((res) => {
        setTrain(res.data.train);
        setBookedSeats(res.data.bookedSeats || []);
        setLockedSeats(res.data.lockedSeats || []);
      })
      .catch((err) => {
        console.error(err);
        navigate('/trains');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [trainNo, navigate]);

  useEffect(() => {
    fetchTrainDetails();
    // Auto-refresh seat availability every 20 seconds to see live locks/bookings
    const interval = setInterval(() => {
      fetchTrainDetails(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchTrainDetails]);

  // Fast O(1) Sets for lookups
  const bookedSet = useMemo(() => new Set(bookedSeats), [bookedSeats]);
  const lockedSet = useMemo(() => new Set(lockedSeats), [lockedSeats]);
  const selectedSet = useMemo(() => new Set(selectedSeats), [selectedSeats]);

  const numCoaches = train?.numberOfCoaches || 1;

  // Coach-level seat occupancy calculation
  const coachStats = useMemo(() => {
    if (!train) return [];
    return Array.from({ length: numCoaches }, (_, i) => {
      const coachNum = i + 1;
      let coachBooked = 0;
      let coachLocked = 0;
      let coachSelected = 0;

      for (let r = 0; r < ROWS_PER_COACH; r++) {
        for (let c = 0; c < ROW_LABELS.length; c++) {
          const seatId = `${coachNum}-${r * SEATS_PER_ROW + c + 1}${ROW_LABELS[c]}`;
          if (bookedSet.has(seatId)) coachBooked++;
          else if (lockedSet.has(seatId)) coachLocked++;
          if (selectedSet.has(seatId)) coachSelected++;
        }
      }

      return {
        coachNum,
        available: SEATS_PER_COACH - coachBooked - coachLocked,
        selected: coachSelected,
        booked: coachBooked,
        locked: coachLocked,
      };
    });
  }, [train, numCoaches, bookedSet, lockedSet, selectedSet]);

  const currentCoachStat = coachStats[currentCoach - 1] || { available: 0, selected: 0 };

  const toggleSeat = (seatId) => {
    if (bookedSet.has(seatId)) return;
    if (lockedSet.has(seatId) && !selectedSet.has(seatId)) {
      setError(`Seat ${seatId} is currently held by another passenger. Please choose another seat.`);
      return;
    }

    setError('');
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((s) => s !== seatId);
      }
      if (prev.length >= 4) {
        setError('You can select a maximum of 4 seats per booking');
        return prev;
      }
      return [...prev, seatId];
    });
  };

  const handleJumpToSeatCoach = (seatId) => {
    const coachPart = seatId.split('-')[0];
    const coachNum = parseInt(coachPart, 10);
    if (!isNaN(coachNum) && coachNum >= 1 && coachNum <= numCoaches) {
      setCurrentCoach(coachNum);
    }
  };

  const handleBook = async () => {
    if (selectedSeats.length === 0) {
      return setError('Please select at least one seat to proceed');
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/bookings', {
        trainNo: Number(trainNo),
        selectedSeats,
      });
      navigate('/payment', { state: { booking: res.data } });
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Booking failed';
      setError(errorMsg);
      // Refresh seats immediately to reflect the latest lock/booking states
      fetchTrainDetails();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <div className="spinner-page"><div className="spinner" /></div>
      </div>
    );
  }

  if (!train) return null;

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          {/* Header */}
          <div className="page-header">
            <div className="page-header-inner">
              <div>
                <h1>🎫 Select Train Seats</h1>
                <p style={{ color: 'var(--text-light)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
                  <strong>{train.trainName}</strong> (#{train.trainNo}) &nbsp;•&nbsp; {train.source} → {train.destination} &nbsp;•&nbsp; <strong>₹{train.fare}</strong> / seat
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => fetchTrainDetails(true)}
                  disabled={refreshing}
                  title="Refresh live seat status"
                  style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
                >
                  {refreshing ? '⟳ Refreshing…' : '⟳ Refresh'}
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/trains')}>
                  ← Back to Trains
                </button>
              </div>
            </div>
          </div>

          <div className="booking-layout">
            {/* Seat Map View */}
            <div className="seat-map-container">
              {/* Coach Pagination & Navigation Header */}
              <div className="coach-pagination-wrapper">
                <div className="coach-pagination-header">
                  <div className="coach-nav-controls">
                    <button
                      className="coach-nav-btn"
                      disabled={currentCoach <= 1}
                      onClick={() => setCurrentCoach((prev) => Math.max(1, prev - 1))}
                    >
                      ← Prev Coach
                    </button>

                    <div className="coach-status-title">
                      <span className="coach-badge-main">Coach {currentCoach}</span>
                      <span className="coach-stats-badge">
                        {currentCoachStat.available} of {SEATS_PER_COACH} Free
                        {currentCoachStat.selected > 0 && (
                          <span className="coach-selected-pill"> • {currentCoachStat.selected} Selected</span>
                        )}
                      </span>
                    </div>

                    <button
                      className="coach-nav-btn"
                      disabled={currentCoach >= numCoaches}
                      onClick={() => setCurrentCoach((prev) => Math.min(numCoaches, prev + 1))}
                    >
                      Next Coach →
                    </button>
                  </div>

                  {/* Coach Selector Tabs / Pills */}
                  <div className="coach-pills-row">
                    {Array.from({ length: numCoaches }, (_, i) => {
                      const cNum = i + 1;
                      const stat = coachStats[i];
                      const isActive = currentCoach === cNum;
                      const hasSelected = stat && stat.selected > 0;

                      return (
                        <button
                          key={cNum}
                          className={`coach-pill-tab ${isActive ? 'active' : ''} ${hasSelected ? 'has-selection' : ''}`}
                          onClick={() => setCurrentCoach(cNum)}
                        >
                          Coach {cNum}
                          {hasSelected && <span className="pill-dot" title={`${stat.selected} seat(s) selected`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="seat-legend">
                <div className="legend-item">
                  <div className="legend-dot available" />
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot selected" />
                  <span>Selected ({selectedSeats.length}/4)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot held" />
                  <span>Held / In Progress (Redis Lock)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot booked" />
                  <span>Booked</span>
                </div>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                  ⚠ {error}
                </div>
              )}

              {/* Paginated Single Coach Seat Grid (Fits neatly on screen without scrolling) */}
              <div className="coach-viewport-card">
                <div className="coach-train-header">
                  <div className="train-direction-tag">◄ ENGINE / FRONT</div>
                  <div className="coach-name-display">COACH {currentCoach} (Seats {(currentCoach - 1) * 60 + 1} - {currentCoach * 60})</div>
                  <div className="train-direction-tag">REAR ►</div>
                </div>

                <div className="coach-interior-grid">
                  {/* Column Headers */}
                  <div className="seat-col-headers">
                    <div className="col-head left">
                      <span>Window (A)</span>
                      <span>Middle (B)</span>
                      <span>Aisle (C)</span>
                    </div>
                    <div className="aisle-spacer-head">AISLE</div>
                    <div className="col-head right">
                      <span>Aisle (D)</span>
                      <span>Middle (E)</span>
                      <span>Window (F)</span>
                    </div>
                  </div>

                  {/* 10 Rows */}
                  {Array.from({ length: ROWS_PER_COACH }, (_, ri) => {
                    const rowNum = ri + 1;
                    return (
                      <div key={ri} className="seat-row-split">
                        {/* Left 3 Seats (A, B, C) */}
                        <div className="seat-cluster left">
                          {['A', 'B', 'C'].map((col) => {
                            const seatNumberInCoach = ri * SEATS_PER_ROW + ROW_LABELS.indexOf(col) + 1;
                            const seatId = `${currentCoach}-${seatNumberInCoach}${col}`;
                            const isBooked = bookedSet.has(seatId);
                            const isLocked = lockedSet.has(seatId);
                            const isSelected = selectedSet.has(seatId);
                            const seatTypeInfo = getSeatType(col);

                            let seatClass = 'seat-btn-modern';
                            let stateTitle = `Seat ${seatId} (${seatTypeInfo.type})`;
                            if (isBooked) {
                              seatClass += ' booked';
                              stateTitle += ' - Already Booked';
                            } else if (isLocked && !isSelected) {
                              seatClass += ' held';
                              stateTitle += ' - Temporarily Locked by Another User';
                            } else if (isSelected) {
                              seatClass += ' selected';
                              stateTitle += ' - Selected';
                            }

                            return (
                              <button
                                key={seatId}
                                className={seatClass}
                                onClick={() => toggleSeat(seatId)}
                                title={stateTitle}
                                disabled={isBooked}
                              >
                                <span className="seat-num">{seatNumberInCoach}{col}</span>
                                <span className="seat-badge">{seatTypeInfo.badge}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Aisle Indicator */}
                        <div className="aisle-divider">
                          <span className="row-number-pill">R{rowNum}</span>
                        </div>

                        {/* Right 3 Seats (D, E, F) */}
                        <div className="seat-cluster right">
                          {['D', 'E', 'F'].map((col) => {
                            const seatNumberInCoach = ri * SEATS_PER_ROW + ROW_LABELS.indexOf(col) + 1;
                            const seatId = `${currentCoach}-${seatNumberInCoach}${col}`;
                            const isBooked = bookedSet.has(seatId);
                            const isLocked = lockedSet.has(seatId);
                            const isSelected = selectedSet.has(seatId);
                            const seatTypeInfo = getSeatType(col);

                            let seatClass = 'seat-btn-modern';
                            let stateTitle = `Seat ${seatId} (${seatTypeInfo.type})`;
                            if (isBooked) {
                              seatClass += ' booked';
                              stateTitle += ' - Already Booked';
                            } else if (isLocked && !isSelected) {
                              seatClass += ' held';
                              stateTitle += ' - Temporarily Locked by Another User';
                            } else if (isSelected) {
                              seatClass += ' selected';
                              stateTitle += ' - Selected';
                            }

                            return (
                              <button
                                key={seatId}
                                className={seatClass}
                                onClick={() => toggleSeat(seatId)}
                                title={stateTitle}
                                disabled={isBooked}
                              >
                                <span className="seat-num">{seatNumberInCoach}{col}</span>
                                <span className="seat-badge">{seatTypeInfo.badge}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Booking Summary */}
            <div className="booking-sidebar-card">
              <div className="booking-summary">
                <h3>📋 Trip & Seat Summary</h3>

                <div className="summary-row">
                  <span className="label">Train Name</span>
                  <span className="value">{train.trainName}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Train Number</span>
                  <span className="value">#{train.trainNo}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Route</span>
                  <span className="value">{train.source} → {train.destination}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Fare per Seat</span>
                  <span className="value">₹{train.fare}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Selected Seats</span>
                  <span className="value" style={{ color: selectedSeats.length > 0 ? 'var(--accent-light)' : 'inherit' }}>
                    {selectedSeats.length} / 4
                  </span>
                </div>

                {selectedSeats.length > 0 ? (
                  <div style={{ marginTop: '0.85rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>
                      Selected Seats (Click to Jump to Coach):
                    </div>
                    <div className="selected-seats-list">
                      {selectedSeats.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="seat-chip-interactive"
                          onClick={() => handleJumpToSeatCoach(s)}
                          title="Click to view this seat's coach"
                        >
                          Coach {s.split('-')[0]} • {s.split('-')[1]} ✕
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                    Click any available seat above to select.
                  </p>
                )}

                <div className="summary-row total" style={{ marginTop: '1rem', paddingTop: '0.75rem' }}>
                  <span className="label">Total Amount</span>
                  <span className="value">₹{(train.fare * selectedSeats.length).toFixed(2)}</span>
                </div>

                <button
                  className="btn btn-accent btn-block"
                  style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', fontSize: '1rem' }}
                  disabled={selectedSeats.length === 0 || submitting}
                  onClick={handleBook}
                >
                  {submitting ? '🔒 Reserving with Redis Lock…' : `Proceed to Payment (₹${(train.fare * selectedSeats.length).toFixed(2)}) →`}
                </button>

                <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  🔒 Protected by Redis Concurrency Lock
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;
