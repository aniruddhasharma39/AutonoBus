import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';

const CustomerProfile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [bookings, setBookings] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newPassenger, setNewPassenger] = useState({ name: '', age: '', gender: 'Male' });

  useEffect(() => {
    const data = sessionStorage.getItem('userInfo');
    if (data) {
      const parsed = JSON.parse(data);
      setUserInfo(parsed);
      fetchBookings(parsed.token);
      fetchPassengers(parsed.token);
    }
  }, []);

  const fetchBookings = async (token) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/bookings/mybookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPassengers = async (token) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/bookings/passengers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPassengers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userInfo');
    window.location.href = '/';
  }
  const handleAddPassenger = async (e) => {
    e.preventDefault();
    if (!newPassenger.name || !newPassenger.age) return;
    try {
      await axios.post(`${API_BASE}/api/bookings/passengers`, newPassenger, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setNewPassenger({ name: '', age: '', gender: 'Male' });
      fetchPassengers(userInfo.token);
    } catch (e) {
      console.error(e);
    }
  };

  if (!userInfo) return <div style={{ padding: '40px', textAlign: 'center' }}>Please log in...</div>;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', flex: 1 }}>
      <h1 className="sync-gradient-text" style={{ fontSize: '32px', marginBottom: '32px' }}>My Account</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
        {['profile', 'bookings', 'passengers'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedBooking(null); }}
            style={{
              padding: '8px 16px',
              backgroundColor: activeTab === tab ? '#e2e8f0' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontWeight: activeTab === tab ? 'bold' : '500',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card sync-gradient-border profile-card-inner" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="sync-gradient-bg" style={{ width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '48px', fontWeight: 'bold' }}>
              {userInfo.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{userInfo.name}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Customer Account</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Email Address</label>
                <div style={{ padding: '12px', backgroundColor: '#f4f6f8', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{userInfo.email}</div>
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>Phone Number</label>
                <div style={{ padding: '12px', backgroundColor: '#f4f6f8', borderRadius: '8px', border: '1px solid #e2e8f0' }}>{userInfo.phone || 'Not Provided'}</div>
              </div>
            </div>

          </div>
          <button
            onClick={handleLogout}
            style={{ backgroundColor: 'rgba(114, 114, 114, 1)', padding: '8px 16px', color: 'white', border: '1px solid white' }}
          >
            Logout
          </button>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          {selectedBooking ? (
            <div>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ marginBottom: '16px', padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: 'white', cursor: 'pointer' }}
              >
                &larr; Back to all bookings
              </button>

              {/* Vintage Ticket CSS */}
              <div style={{
                backgroundColor: '#fffcf2',
                maxWidth: '700px',
                margin: '0 auto',
                padding: '30px',
                border: '2px dashed #8b7355',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                fontFamily: '"Courier New", Courier, monospace',
                position: 'relative',
                color: '#3e352a',
                overflowX: 'auto'
              }}>
                <div style={{ position: 'absolute', top: 0, left: '-15px', width: '30px', height: '30px', backgroundColor: 'var(--bg-primary)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', top: 0, right: '-15px', width: '30px', height: '30px', backgroundColor: 'var(--bg-primary)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: 0, left: '-15px', width: '30px', height: '30px', backgroundColor: 'var(--bg-primary)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: 0, right: '-15px', width: '30px', height: '30px', backgroundColor: 'var(--bg-primary)', borderRadius: '50%' }}></div>

                <div style={{ textAlign: 'center', borderBottom: '2px solid #8b7355', paddingBottom: '16px', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '28px', letterSpacing: '2px', textTransform: 'uppercase' }}>Garuda Urbanlines</h2>
                  <p style={{ margin: '8px 0 0 0', fontStyle: 'italic', fontSize: '14px' }}>Journey Details</p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '18px' }}><strong>PNR NO:</strong> {selectedBooking.pnr}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>STATUS:</strong> <span style={{ color: selectedBooking.status === 'confirmed' ? 'green' : 'orange' }}>{selectedBooking.status.toUpperCase()}</span></p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 8px 0' }}><strong>DATE:</strong> {selectedBooking.assignment?.journeyDate}</p>
                    <p style={{ margin: '0 0 8px 0' }}><strong>BUS:</strong> {selectedBooking.assignment?.bus ? `${selectedBooking.assignment.bus.name} (${selectedBooking.assignment.bus.busNumber})` : `Garuda ${selectedBooking.assignment?.busType || 'Premium'} (TBA)`}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', backgroundColor: '#f5deb3', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                  <div style={{ width: '45%' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#666' }}>{selectedBooking.assignment?.route?.name?.split(' - ')[0]?.toUpperCase() || 'BOARDING'}</p>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{selectedBooking.boardingPoint}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>&rarr;</div>
                  <div style={{ width: '45%', textAlign: 'left' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#666' }}>{selectedBooking.assignment?.route?.name?.split(' - ')[1]?.toUpperCase() || 'DROPPING'}</p>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{selectedBooking.droppingPoint}</p>
                  </div>
                </div>

                <div style={{ borderTop: '2px dashed #8b7355', paddingTop: '24px' }}>
                  <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>PASSENGER DETAILS</p>
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #8b7355' }}>
                        <th style={{ padding: '8px 0' }}>Seat</th>
                        <th style={{ padding: '8px 0' }}>Name</th>
                        <th style={{ padding: '8px 0' }}>Age</th>
                        <th style={{ padding: '8px 0' }}>Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBooking.seats.map((seat, i) => (
                        <tr key={i} style={{ borderBottom: '1px dashed #d2b48c' }}>
                          <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{seat.seatNumber}</td>
                          <td style={{ padding: '8px 0' }}>{seat.passengerName}</td>
                          <td style={{ padding: '8px 0' }}>{seat.age}</td>
                          <td style={{ padding: '8px 0' }}>{seat.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'right', fontSize: '20px', fontWeight: 'bold' }}>
                  TOTAL FARE: ₹{selectedBooking.totalAmount}
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              {bookings.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>You have no bookings yet.</p>
              ) : (
                <div className="responsive-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
                      <th style={{ padding: '12px' }}>PNR</th>
                      <th style={{ padding: '12px' }}>Route Details</th>
                      <th style={{ padding: '12px' }}>Journey Date</th>
                      <th style={{ padding: '12px' }}>Seats</th>
                      <th style={{ padding: '12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{b.pnr}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '14px' }}>{b.assignment?.route?.name || 'Unknown'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>{b.assignment?.journeyDate}</td>
                        <td style={{ padding: '12px' }}>{b.seats.length}</td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => setSelectedBooking(b)}
                            style={{ padding: '6px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            View Ticket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'passengers' && (
        <div className="card" style={{ width: '100%' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Saved Passengers</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
            Passengers are automatically saved and deduplicated here when you book a new ticket.
          </p>
          {passengers.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No saved passengers found.</p>
          ) : (
            <div className="responsive-table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th style={{ padding: '12px' }}>Age</th>
                  <th style={{ padding: '12px' }}>Gender</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{p.name}</td>
                    <td style={{ padding: '12px' }}>{p.age}</td>
                    <td style={{ padding: '12px' }}>{p.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CustomerProfile;
