import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';

const SeatSelection = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [activeDeck, setActiveDeck] = useState('Lower');
  const [lowerLayout, setLowerLayout] = useState([]);
  const [upperLayout, setUpperLayout] = useState([]);
  const [buses, setBuses] = useState([]);
  
  // State passed from SearchResults
  const { journeySlice, basePrice } = location.state || { journeySlice: {}, basePrice: { sleeper: 1000 } };

  useEffect(() => {
    if (schedule) {
      let layout = [];
      if (schedule.bus && schedule.bus.layout && schedule.bus.layout.length > 0) {
        layout = schedule.bus.layout;
      } else {
        // Find template layout based on busType
        const templateBus = buses.find(b => b.type === schedule.busType && b.layout && b.layout.length > 0);
        if (templateBus) {
          layout = templateBus.layout;
        } else {
          // Generate fallback robust 2x1 sleeper layout
          const capacity = schedule.totalSeats || 30;
          const rows = capacity / 6;
          for (let i = 1; i <= rows; i++) {
            layout.push({ seatNumber: `L${i}A`, type: 'sleeper' });
            layout.push({ seatNumber: `L${i}B`, type: 'sleeper' });
            layout.push({ seatNumber: `L${i}C`, type: 'sleeper' });
            layout.push({ seatNumber: `U${i}A`, type: 'sleeper' });
            layout.push({ seatNumber: `U${i}B`, type: 'sleeper' });
            layout.push({ seatNumber: `U${i}C`, type: 'sleeper' });
          }
        }
      }

      if (layout.length > 0) {
        const bookedMap = {};
        (schedule.bookedSeats || []).forEach(bs => {
          bookedMap[bs.seatNumber] = bs.status;
        });

        const lower = layout.filter(s => s.seatNumber.startsWith('L') || (!s.seatNumber.startsWith('U') && !s.seatNumber.startsWith('L')));
        const upper = layout.filter(s => s.seatNumber.startsWith('U'));
        setLowerLayout(lower.map(s => ({ id: s.seatNumber, status: bookedMap[s.seatNumber] || 'available' })));
        setUpperLayout(upper.map(s => ({ id: s.seatNumber, status: bookedMap[s.seatNumber] || 'available' })));
      }
    }
  }, [schedule, buses]);

  useEffect(() => {
    // Fetch assignment data and buses to fallback layout
    const fetchAssignmentAndBuses = async () => {
      try {
        const [assignmentsRes, busesRes] = await Promise.all([
           axios.get(`${API_BASE}/api/assignments`),
           axios.get(`${API_BASE}/api/buses`)
        ]);
        const match = assignmentsRes.data.find(s => s._id === id);
        setSchedule(match);
        setBuses(busesRes.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAssignmentAndBuses();
  }, [id]);

  const handleSeatClick = (seatId, status) => {
    if (status === 'booked' || status === 'locked') return;
    
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      if (selectedSeats.length >= 6) {
        return alert('You can only select up to 6 seats.');
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const dp = basePrice?.dynamicPricing || [];
  const getSeatPrice = (seatId) => {
    const base = basePrice?.sleeper || 1000;
    const dpObj = dp.find(d => d.seatId === seatId);
    return base + (dpObj ? dpObj.offset : 0);
  };

  const handleCheckout = () => {
    if (selectedSeats.length === 0) return alert('Select at least one seat.');
    
    const totalAmount = selectedSeats.reduce((sum, id) => sum + getSeatPrice(id), 0);

    // Store selection in location state for checkout
    navigate('/checkout', { state: { 
      scheduleId: id, 
      seats: selectedSeats,
      totalAmount: totalAmount,
      journeySlice: journeySlice
    }});
  };

  return (
    <div className="seat-selection-layout" style={{ padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '32px' }}>
      
      {/* Seat Layout Section */}
      <div style={{ flex: 2 }}>
        <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>Select Your Seats</h1>
        
        <div className="card sync-gradient-border-vertical" style={{ padding: '40px', width: 'fit-content', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
            <button
              onClick={() => setActiveDeck('Lower')}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: activeDeck === 'Lower' ? 'none' : '1px solid #ddd',
                backgroundColor: activeDeck === 'Lower' ? 'transparent' : 'white',
                color: activeDeck === 'Lower' ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
              className={activeDeck === 'Lower' ? 'sync-gradient-bg' : ''}
            >
              Lower Deck
            </button>
            {upperLayout.length > 0 && (
              <button
                onClick={() => setActiveDeck('Upper')}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: activeDeck === 'Upper' ? 'none' : '1px solid #ddd',
                  backgroundColor: activeDeck === 'Upper' ? 'transparent' : 'white',
                  color: activeDeck === 'Upper' ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
                className={activeDeck === 'Upper' ? 'sync-gradient-bg' : ''}
              >
                Upper Deck
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', width: '100%' }}>
            Front of Bus (Driver)
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 2fr', gap: '20px' }}>
            
            {/* Left Column (Single Sleepers) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {(activeDeck === 'Lower' ? lowerLayout : upperLayout).map((seat, i) => {
                if (i % 3 !== 0) return null; // Only the first seat of every group of 3 goes here (left side)
                const isSelected = selectedSeats.includes(seat.id);
                const seatPrice = getSeatPrice(seat.id);
                return (
                  <div 
                    key={seat.id}
                    onClick={() => handleSeatClick(seat.id, seat.status)}
                    style={{
                      height: '80px',
                      width: '40px',
                      border: isSelected ? 'none' : '2px solid #cbd5e1',
                      backgroundColor: seat.status === 'booked' ? '#e2e8f0' : (isSelected ? '#22c55e' : 'white'),
                      borderRadius: '4px',
                      cursor: seat.status === 'booked' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      fontFamily: '"Courier New", Courier, monospace',
                      opacity: seat.status === 'booked' ? 0.5 : 1,
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 6px rgba(34, 197, 94, 0.3)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{seat.id}</span>
                    <span style={{ fontSize: '9px', marginTop: '4px' }}>₹{seatPrice}</span>
                  </div>
                )
              })}
            </div>

            {/* Aisle */}
            <div style={{ width: '60px', height: '100%', borderLeft: '1px dashed #e2e8f0', borderRight: '1px dashed #e2e8f0' }}></div>

            {/* Right Column (Double Sleepers) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {(activeDeck === 'Lower' ? lowerLayout : upperLayout).map((seat, i) => {
                if (i % 3 === 0) return null; // The other two seats go here (right side)
                const isSelected = selectedSeats.includes(seat.id);
                const seatPrice = getSeatPrice(seat.id);
                return (
                  <div 
                    key={seat.id}
                    onClick={() => handleSeatClick(seat.id, seat.status)}
                    style={{
                      height: '80px',
                      width: '40px',
                      border: isSelected ? 'none' : '2px solid #cbd5e1',
                      backgroundColor: seat.status === 'booked' ? '#e2e8f0' : (isSelected ? '#22c55e' : 'white'),
                      borderRadius: '4px',
                      cursor: seat.status === 'booked' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      fontFamily: '"Courier New", Courier, monospace',
                      opacity: seat.status === 'booked' ? 0.5 : 1,
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 6px rgba(34, 197, 94, 0.3)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{seat.id}</span>
                    <span style={{ fontSize: '9px', marginTop: '4px' }}>₹{seatPrice}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div className="card" style={{ position: 'sticky', top: '40px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Booking Summary</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Selected Seats:</span>
            <span style={{ fontWeight: '600' }}>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #ddd' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Base Fare per seat:</span>
            <span style={{ fontWeight: '600' }}>₹{basePrice?.sleeper || 1000}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Amount:</span>
            <span className="sync-gradient-text" style={{ fontSize: '24px', fontWeight: 'bold' }}>
              ₹{selectedSeats.reduce((sum, id) => sum + getSeatPrice(id), 0)}
            </span>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={selectedSeats.length === 0}
            className={selectedSeats.length > 0 ? "sync-gradient-bg btn-primary" : ""}
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: '16px',
              backgroundColor: selectedSeats.length === 0 ? '#e2e8f0' : 'transparent',
              color: selectedSeats.length === 0 ? '#94a3b8' : 'white',
              cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
