import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';

const AdminAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Expansion Row States
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [reassignMode, setReassignMode] = useState(null);
  const [selectedBusIds, setSelectedBusIds] = useState({}); // tracking dropdown locally before assign
  const [activeDeck, setActiveDeck] = useState('Lower');

  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, busesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/assignments?date=${selectedDate}`),
        axios.get(`${API_BASE}/api/buses`)
      ]);
      setAssignments(assignmentsRes.data);
      setBuses(busesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAssignBus = async (assignmentId) => {
    const busId = selectedBusIds[assignmentId];
    if (!busId) return alert('Please select a bus first');
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.patch(`${API_BASE}/api/assignments/${assignmentId}/assign-bus`, { busId }, config);
      alert('Bus explicitly assigned successfully');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error assigning bus');
    }
  };

  const handleToggleExpand = (assignmentId) => {
    if (expandedAssignmentId === assignmentId) {
      setExpandedAssignmentId(null);
    } else {
      setExpandedAssignmentId(assignmentId);
      setSelectedSeat(null);
      setReassignMode(null);
    }
  };

  const handleBlockUnblock = async (seatNumber, action) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.patch(`${API_BASE}/api/assignments/${expandedAssignmentId}/seat`, { seatNumber, action }, config);
      fetchData();
      setSelectedSeat(null);
      alert(`Seat ${action}ed successfully`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating seat');
    }
  };

  const handleReassignSubmit = async (newSeatNumber) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(`${API_BASE}/api/assignments/${expandedAssignmentId}/seat/reassign`, {
        oldSeatNumber: reassignMode,
        newSeatNumber
      }, config);
      fetchData();
      setReassignMode(null);
      setSelectedSeat(null);
      alert(`Seat reassigned successfully to ${newSeatNumber}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error reassigning seat');
    }
  };

  const handleCancelSeat = async (seatNumber) => {
    if (!window.confirm(`Are you sure you want to cancel booking for seat ${seatNumber}?`)) return;
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(`${API_BASE}/api/assignments/${expandedAssignmentId}/seat/cancel`, { seatNumber }, config);
      fetchData();
      setSelectedSeat(null);
      alert('Seat cancelled successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error canceling seat');
    }
  };

  const getSeatLayout = (assignment) => {
    if (assignment.bus && assignment.bus.layout && assignment.bus.layout.length > 0) return assignment.bus.layout;
    // Fallback template
    const templateBus = buses.find(b => b.type === assignment.busType && b.layout && b.layout.length > 0);
    if (templateBus) return templateBus.layout;
    
    // Generate fallback robust 2x1 sleeper layout
    let layout = [];
    const capacity = assignment.totalSeats || 30;
    const rows = capacity / 6;
    for (let i = 1; i <= rows; i++) {
      layout.push({ seatNumber: `L${i}A`, type: 'sleeper' });
      layout.push({ seatNumber: `L${i}B`, type: 'sleeper' });
      layout.push({ seatNumber: `L${i}C`, type: 'sleeper' });
      layout.push({ seatNumber: `U${i}A`, type: 'sleeper' });
      layout.push({ seatNumber: `U${i}B`, type: 'sleeper' });
      layout.push({ seatNumber: `U${i}C`, type: 'sleeper' });
    }
    return layout;
  };

  const renderSeatChartPanel = (assignment) => {
    const layout = getSeatLayout(assignment);
    if (!layout || layout.length === 0) return <p>No layout template available for {assignment.busType}</p>;

    const lowerLayout = layout.filter(s => s.seatNumber.startsWith('L') || (!s.seatNumber.startsWith('U') && !s.seatNumber.startsWith('L')));
    const upperLayout = layout.filter(s => s.seatNumber.startsWith('U'));

    const renderSeatNode = (seatTemplate) => {
      const bookedSeat = assignment.bookedSeats.find(s => s.seatNumber === seatTemplate.seatNumber);
      let bgColor = '#e2e8f0'; // available
      let statusText = 'Available';
      
      const isSelected = selectedSeat?.seatNumber === seatTemplate.seatNumber;
      
      if (bookedSeat) {
        if (bookedSeat.status === 'booked') {
          bgColor = '#fca5a5'; // booked (red)
          statusText = 'Booked';
        } else if (bookedSeat.status === 'locked') {
          bgColor = '#9e9e9e'; // locked / blocked
          statusText = 'Blocked';
        }
      }

      // Reassign Mode Highlight
      if (reassignMode && statusText === 'Available') {
         bgColor = '#bbf7d0'; // Highlight available seats in green when swapping
      }

      const handleClick = () => {
        if (reassignMode) {
          if (statusText !== 'Available') return alert('Please select an empty seat to reassign to.');
          handleReassignSubmit(seatTemplate.seatNumber);
        } else {
          if (bookedSeat) {
            setSelectedSeat({ ...seatTemplate, ...bookedSeat, isEmpty: false });
          } else {
            setSelectedSeat({ ...seatTemplate, isEmpty: true });
          }
        }
      };

      return (
        <div 
          key={seatTemplate.seatNumber}
          style={{
            height: '80px', width: '40px', backgroundColor: bgColor, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: '4px', cursor: 'pointer', fontSize: '10px',
            border: isSelected ? '3px solid #3b82f6' : '1px solid #cbd5e1',
            boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none',
            opacity: (!reassignMode && isSelected) || !isSelected ? 1 : (statusText === 'Available' ? 1 : 0.4)
          }}
          onClick={handleClick}
        >
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{seatTemplate.seatNumber}</span>
          <span>{statusText === 'Available' ? '✓' : '×'}</span>
        </div>
      )
    };

    return (
      <div style={{ width: 'fit-content', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveDeck('Lower')}
            style={{ padding: '8px 16px', borderRadius: '4px', border: activeDeck === 'Lower' ? 'none' : '1px solid #ddd', backgroundColor: activeDeck === 'Lower' ? '#e2e8f0' : 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Lower Deck
          </button>
          <button
            onClick={() => setActiveDeck('Upper')}
            style={{ padding: '8px 16px', borderRadius: '4px', border: activeDeck === 'Upper' ? 'none' : '1px solid #ddd', backgroundColor: activeDeck === 'Upper' ? '#e2e8f0' : 'white', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Upper Deck
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', borderBottom: '2px solid #e2e8f0', width: '100%', paddingBottom: '8px' }}>
          Front of Bus (Driver)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 2fr', gap: '20px' }}>
          {/* Left Column Single Sleepers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
            {(activeDeck === 'Lower' ? lowerLayout : upperLayout).map((seat, i) => {
              if (i % 3 !== 0) return null;
              return renderSeatNode(seat);
            })}
          </div>

          <div style={{ width: '60px', height: '100%', borderLeft: '1px dashed #e2e8f0', borderRight: '1px dashed #e2e8f0' }}></div>

          {/* Right Column Double Sleepers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {(activeDeck === 'Lower' ? lowerLayout : upperLayout).map((seat, i) => {
              if (i % 3 === 0) return null;
              return renderSeatNode(seat);
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="sync-gradient-text" style={{ fontSize: '32px' }}>Daily Assignments</h1>
        
        <div>
          <label style={{ marginRight: '16px', fontWeight: 'bold' }}>Select Date:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
          />
        </div>
      </div>

      <div className="card">
        {loading ? <p>Loading assignments...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
                <th style={{ padding: '12px' }}>Route</th>
                <th style={{ padding: '12px' }}>Required Bus Type</th>
                <th style={{ padding: '12px' }}>Occupancy</th>
                <th style={{ padding: '12px' }}>Assigned Bus</th>
                <th style={{ padding: '12px' }}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>No active assignments found for {selectedDate}.</td></tr>
              ) : null}
              {assignments.map(assignment => {
                // Filter buses strictly by BOTH busType and totalSeats
                const compatibleBuses = buses.filter(b => b.type === assignment.busType && Number(b.totalSeats) === assignment.totalSeats);
                
                const isExpanded = expandedAssignmentId === assignment._id;
                return (
                  <React.Fragment key={assignment._id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--bg-secondary)', backgroundColor: isExpanded ? '#f8fafc' : 'white' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {assignment.route?.name || 'Unknown Route'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {assignment.busType} ({assignment.totalSeats} seats)
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {assignment.bookedSeats.length} seats booked
                    </td>
                    <td style={{ padding: '12px' }}>
                      {assignment.bus ? (
                        <div style={{ color: 'green', fontWeight: 'bold' }}>✓ {assignment.bus.name} ({assignment.bus.busNumber})</div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select 
                            value={selectedBusIds[assignment._id] || ''} 
                            onChange={(e) => setSelectedBusIds({ ...selectedBusIds, [assignment._id]: e.target.value })}
                            style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          >
                            <option value="">-- Choose Bus --</option>
                            {compatibleBuses.map(b => <option key={b._id} value={b._id}>{b.name} ({b.busNumber})</option>)}
                          </select>
                          <button onClick={() => handleAssignBus(assignment._id)} style={{ padding: '6px 12px', border: 'none', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Assign</button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => handleToggleExpand(assignment._id)}
                        style={{ padding: '6px 12px', backgroundColor: isExpanded ? '#cbd5e1' : '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        {isExpanded ? 'Close Chart' : 'Seat Chart'}
                      </button>
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr key={`${assignment._id}-expanded`} style={{ borderBottom: '1px solid var(--bg-secondary)', backgroundColor: '#f8fafc' }}>
                      <td colSpan="5" style={{ padding: '24px' }}>
                        
                        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                          {/* Left Side: Seat Layout Grid */}
                          <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            {renderSeatChartPanel(assignment)}
                          </div>
                          
                          {/* Right Side: Seat Action Context Panel */}
                          <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '300px' }}>
                            <h3 style={{ marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>Seat Context Panel</h3>
                            
                            {reassignMode ? (
                              <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                                <h4 style={{ color: '#166534', marginBottom: '8px' }}>Reassigning Seat {reassignMode}</h4>
                                <p style={{ fontSize: '14px', color: '#15803d' }}>Please click on an Available seat in the chart to swap the passenger over.</p>
                                <button 
                                  onClick={() => setReassignMode(null)}
                                  style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  Cancel Reassignment
                                </button>
                              </div>
                            ) : !selectedSeat ? (
                              <p style={{ color: 'var(--text-secondary)' }}>Select a seat from the chart to view details and manage it.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                  Seat: {selectedSeat.seatNumber}
                                </div>

                                {selectedSeat.isEmpty ? (
                                  <div>
                                    <div style={{ padding: '8px 12px', backgroundColor: '#e2e8f0', display: 'inline-block', borderRadius: '4px', fontWeight: 'bold', marginBottom: '16px' }}>Status: Available</div>
                                    <button 
                                      onClick={() => handleBlockUnblock(selectedSeat.seatNumber, 'block')}
                                      style={{ width: '100%', padding: '12px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                      Block Seat
                                    </button>
                                  </div>
                                ) : selectedSeat.status === 'locked' ? (
                                  <div>
                                    <div style={{ padding: '8px 12px', backgroundColor: '#9e9e9e', color: 'white', display: 'inline-block', borderRadius: '4px', fontWeight: 'bold', marginBottom: '16px' }}>Status: Blocked</div>
                                    <button 
                                      onClick={() => handleBlockUnblock(selectedSeat.seatNumber, 'unblock')}
                                      style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                      Unblock Seat
                                    </button>
                                  </div>
                                ) : (
                                  <div>
                                    <div style={{ padding: '8px 12px', backgroundColor: '#fca5a5', display: 'inline-block', borderRadius: '4px', fontWeight: 'bold', marginBottom: '16px' }}>Status: Booked</div>
                                    
                                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
                                      <p><strong>Passenger:</strong> {selectedSeat.passengerName || 'N/A'}</p>
                                      <p><strong>Demographics:</strong> {selectedSeat.age || 'N/A'} yrs, {selectedSeat.gender || 'N/A'}</p>
                                      <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
                                      <p><strong>Pick Up:</strong> {selectedSeat.boardingPoint || 'N/A'}</p>
                                      <p><strong>Drop Off:</strong> {selectedSeat.droppingPoint || 'N/A'}</p>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                      <button 
                                        onClick={() => setReassignMode(selectedSeat.seatNumber)}
                                        style={{ flex: 1, padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                      >
                                        Change Seat
                                      </button>
                                      <button 
                                        onClick={() => handleCancelSeat(selectedSeat.seatNumber)}
                                        style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                      >
                                        Cancel Booking
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </div>

                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
            })}
          </tbody>
        </table>
      )}
      </div>
    </div>
  );
};

export default AdminAssignments;
