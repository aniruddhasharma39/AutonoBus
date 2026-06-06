import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';

const JourneyStrip = ({ journeySlice }) => {
  if (!journeySlice) return null;
  const depTime = journeySlice.departureDateISO ? new Date(journeySlice.departureDateISO).toLocaleString() : '--:--';
  return (
    <div className="sync-gradient-bg" style={{ borderRadius: '12px', padding: '16px 24px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', width: '100%' }}>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{journeySlice.source}</span>
      <span style={{ color: 'white', opacity: 0.8 }}>→</span>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>{journeySlice.destination}</span>
      <span style={{ color: 'rgba(255,255,255,0.85)', marginLeft: 'auto' }}>{depTime}</span>
    </div>
  );
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  
  // The state passed from SeatSelection
  const bookingData = location.state || { seats: [], totalAmount: 0, scheduleId: null };
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo')) || {};

  const [contactData, setContactData] = useState({
    email: userInfo.email || '',
    phone: ''
  });
  
  const [seatPassengers, setSeatPassengers] = useState(
    bookingData.seats.map(seat => ({ seatNumber: seat, passengerName: '', age: '', gender: 'Male' }))
  );
  
  const [savedPassengers, setSavedPassengers] = useState([]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (userInfo.token) {
      axios.get(`${API_BASE}/api/bookings/passengers`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      })
      .then(res => setSavedPassengers(res.data))
      .catch(err => console.error("Error fetching passengers", err));
    }
  }, [userInfo.token]);
  
  const [selectedBoarding, setSelectedBoarding] = useState('');
  const [selectedDropping, setSelectedDropping] = useState('');

  useEffect(() => {
    if (!bookingData.scheduleId) return;
    
    // Fetch the specific assignment details using the ID passed from SearchResults/SeatSelection
    const fetchAssignment = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/assignments`);
        const match = data.find(s => s._id === bookingData.scheduleId);
        setSchedule(match);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAssignment();
  }, [bookingData.scheduleId]);

  const handleContactChange = (e) => {
    setContactData({ ...contactData, [e.target.name]: e.target.value });
  };

  const handlePassengerChange = (index, field, value) => {
    const newPassengers = [...seatPassengers];
    newPassengers[index][field] = value;
    setSeatPassengers(newPassengers);
  };

  const handleSavedPassengerSelect = (index, savedName) => {
    const matched = savedPassengers.find(p => p.name === savedName);
    if (matched) {
      const newPassengers = [...seatPassengers];
      newPassengers[index].passengerName = matched.name;
      newPassengers[index].age = matched.age;
      newPassengers[index].gender = matched.gender;
      setSeatPassengers(newPassengers);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (bookingData.seats.length === 0) {
      alert("No seats selected. Please go back and select seats.");
      return navigate(-1);
    }
    if (!selectedBoarding || !selectedDropping) {
      return alert("Please select boarding and dropping points.");
    }

    try {
      const payload = {
        assignmentId: bookingData.scheduleId,
        seats: seatPassengers,
        totalAmount: appliedOffer ? appliedOffer.finalAmount : bookingData.totalAmount,
        boardingPoint: selectedBoarding,
        droppingPoint: selectedDropping,
        sourceCity: bookingData.journeySlice?.source,
        destinationCity: bookingData.journeySlice?.destination,
        offerCode: appliedOffer ? appliedOffer.code : undefined,
        discountAmount: appliedOffer ? appliedOffer.discountAmount : 0
      };

      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(`${API_BASE}/api/bookings`, payload, config);

      // Successfully booked - Auto-save passengers to profile
      try {
        await Promise.all(
          seatPassengers.map(p => 
            axios.post(`${API_BASE}/api/bookings/passengers`, {
              name: p.passengerName, 
              age: p.age, 
              gender: p.gender
            }, config)
          )
        );
      } catch (saveErr) {
        console.error("Could not save passengers", saveErr);
      }

      alert(`Payment complete for ₹${appliedOffer ? appliedOffer.finalAmount : bookingData.totalAmount}. Ticket confirmed!`);
      navigate('/profile', { state: { message: 'Booking Successful!' } });
    } catch (error) {
      alert(error.response?.data?.message || 'Booking failed');
      if (error.response?.status === 409) {
        // Seat taken concurrency error
        navigate(-1); // send back to seat selection
      }
    }
  };

  const validateCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    try {
      const { data } = await axios.post(`${API_BASE}/api/offers/validate`, {
        code: couponCode,
        routeId: schedule?.route?._id || schedule?.route,
        totalAmount: bookingData.totalAmount
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setAppliedOffer(data);
      setCouponCode(''); // clear input after applying
    } catch (err) {
      setAppliedOffer(null);
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setAppliedOffer(null);
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto', flex: 1 }}>
      <JourneyStrip journeySlice={bookingData.journeySlice} />
      <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px' }}>Checkout</h2>

      <div className="checkout-layout" style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Passenger Details Form */}
        <div className="card" style={{ flex: '1', minWidth: '300px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Passenger Details</h3>
          
          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {seatPassengers.map((passenger, index) => (
              <div key={index} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontWeight: 'bold' }}>Passenger {index + 1} | Seat: {passenger.seatNumber}</h4>
                  {savedPassengers.length > 0 && (
                    <select 
                      onChange={(e) => handleSavedPassengerSelect(index, e.target.value)} 
                      style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Select Saved Passenger</option>
                      {savedPassengers.map((sp, i) => (
                        <option key={i} value={sp.name}>{sp.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Full Name</label>
                    <input type="text" value={passenger.passengerName} onChange={(e) => handlePassengerChange(index, 'passengerName', e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Age</label>
                    <input type="number" value={passenger.age} onChange={(e) => handlePassengerChange(index, 'age', e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>Gender</label>
                    <select value={passenger.gender} onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>Contact Information</h4>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email (For e-ticket)</label>
                <input type="email" name="email" value={contactData.email} onChange={handleContactChange} required readOnly={!!userInfo.email} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: userInfo.email ? '#f8fafc' : 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Phone Number</label>
                <input type="tel" name="phone" value={contactData.phone} onChange={handleContactChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
              </div>
            </div>

            <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>Boarding & Dropping Points</h4>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Boarding Point ({bookingData.journeySlice?.source})</label>
                <select value={selectedBoarding} onChange={(e) => setSelectedBoarding(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
                  <option value="" disabled>Select Boarding Point</option>
                  {bookingData.journeySlice?.sourceCityFull?.boardingPoints?.map((bp, i) => (
                    <option key={i} value={`${bp.location} at ${bp.time}`}>{bp.location} - {bp.time}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Dropping Point ({bookingData.journeySlice?.destination})</label>
                <select value={selectedDropping} onChange={(e) => setSelectedDropping(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
                  <option value="" disabled>Select Dropping Point</option>
                  {bookingData.journeySlice?.destCityFull?.droppingPoints?.map((dp, i) => (
                    <option key={i} value={`${dp.location} at ${dp.time}`}>{dp.location} - {dp.time}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="sync-gradient-bg btn-primary" style={{ padding: '16px', fontSize: '18px', marginTop: '24px' }}>
              Pay ₹{appliedOffer ? appliedOffer.finalAmount : bookingData.totalAmount} & Book Ticket
            </button>
          </form>
        </div>

        {/* Order Summary Summary */}
        <div className="checkout-summary-col" style={{ width: '350px', position: 'sticky', top: '40px', alignSelf: 'start' }}>
          <div className="card sync-gradient-border">
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>Journey Summary</h3>
            
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px dashed #ddd' }}>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
                {schedule?.bus ? schedule.bus.name : `Garuda ${schedule?.busType || 'Premium'} Service`}
              </h4>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{schedule?.busType || 'AC Sleeper'}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: '500' }}>{bookingData.journeySlice?.source || 'Source'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {bookingData.journeySlice?.departureDateISO 
                    ? new Date(bookingData.journeySlice.departureDateISO).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : '--:--'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '500' }}>{bookingData.journeySlice?.destination || 'Destination'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {bookingData.journeySlice?.arrivalDateISO 
                    ? new Date(bookingData.journeySlice.arrivalDateISO).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : '--:--'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Seat Numbers</span>
              <span style={{ fontWeight: '600' }}>{bookingData.seats.length > 0 ? bookingData.seats.join(', ') : 'None'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Base Fare</span>
              <span style={{ fontWeight: '600' }}>₹{bookingData.totalAmount}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #ddd' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Taxes & Fees</span>
              <span style={{ fontWeight: '600' }}>₹0</span>
            </div>

            {/* Coupon Section */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #ddd' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Apply Offer / Coupon</h4>
              {!appliedOffer ? (
                <div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={couponCode} 
                      onChange={(e) => setCouponCode(e.target.value)} 
                      placeholder="Enter code" 
                      style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px', textTransform: 'uppercase' }} 
                    />
                    <button type="button" onClick={validateCoupon} className="sync-gradient-bg btn-primary" style={{ padding: '10px 16px' }}>Apply</button>
                  </div>
                  {couponError && <p style={{ color: 'red', fontSize: '13px', marginTop: '8px' }}>{couponError}</p>}
                </div>
              ) : (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px dashed #22c55e', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#166534', fontSize: '14px' }}>{appliedOffer.code} Applied!</p>
                    <p style={{ margin: 0, color: '#15803d', fontSize: '13px' }}>- ₹{appliedOffer.discountAmount} ({appliedOffer.offerTitle})</p>
                  </div>
                  <button type="button" onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Remove</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold' }}>
              <span>Total Payable</span>
              <span>₹{appliedOffer ? appliedOffer.finalAmount : bookingData.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
