import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [expandedBusId, setExpandedBusId] = useState(null);

  const reqSource = searchParams.get('source');
  const reqDest = searchParams.get('destination');
  const reqDate = searchParams.get('date');

  // Helper to generate the 5 days array
  const getNext5Days = (startDateStr) => {
    const dates = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let targetDate = startDateStr ? new Date(startDateStr) : new Date(today);
    targetDate.setHours(0,0,0,0);
    
    let startDay = new Date(targetDate);
    startDay.setDate(startDay.getDate() - 2);
    
    if (startDay < today) {
      startDay = new Date(today);
    }
    
    for (let i = 0; i < 5; i++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const getAvailabilityColor = (seats) => {
    if (seats >= 15) return '#16a34a'; // Green
    if (seats >= 5) return '#f59e0b';  // Yellow/Orange
    return '#dc2626'; // Red
  };

  // Helper to safely format local date as YYYY-MM-DD
  const formatDateLocal = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper to add days to a YYYY-MM-DD string
  const addDays = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0]; // Return YYYY-MM-DD
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/assignments`);
        // wait, the backend getAssignments only populates route and bus! Let's just fetch all pricings too.
        const pricingsRes = await axios.get(`${API_BASE}/api/pricing`);
        const pricings = pricingsRes.data;

        // Filter assignments matching our search criteria on the route cities array
        const matched = data.filter(assignment => {
          if (!assignment.route || !assignment.route.cities || assignment.route.cities.length === 0) return false;
          
          let startIndex = 0;
          let endIndex = assignment.route.cities.length - 1;

          // If source/dest provided, ensure they exist and in correct order
          if (reqSource) {
            startIndex = assignment.route.cities.findIndex(s => s.cityName.toLowerCase() === reqSource.toLowerCase());
          }
          if (reqDest) {
            endIndex = assignment.route.cities.findIndex(s => s.cityName.toLowerCase() === reqDest.toLowerCase());
          }

          if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
            return false;
          }

          // Simple Date Match check against the journeyDate string + city offset
          if (reqDate) {
             const startCity = assignment.route.cities[startIndex];
             const effectiveStartDate = addDays(assignment.journeyDate, startCity.dayOffset || 0);
             if (effectiveStartDate !== reqDate) return false;
          }

          return true;
        }).map(assignment => {
           let startIndex = reqSource ? assignment.route.cities.findIndex(s => s.cityName.toLowerCase() === reqSource.toLowerCase()) : 0;
           let endIndex = reqDest ? assignment.route.cities.findIndex(s => s.cityName.toLowerCase() === reqDest.toLowerCase()) : assignment.route.cities.length - 1;

           const startCity = assignment.route.cities[startIndex];
           const endCity = assignment.route.cities[endIndex];

           // Find pricing from Pricing module
           const linkedPricing = pricings.find(p => p._id === assignment.pricing || (p.route && p.route._id === assignment.route._id));
           let priceObj = null;
           let dynamicPricingData = [];
           if (linkedPricing) {
             dynamicPricingData = linkedPricing.dynamicPricing || [];
             if (linkedPricing.priceMatrix) {
               priceObj = linkedPricing.priceMatrix.find(p => p.source.toLowerCase() === startCity.cityName.toLowerCase() && p.destination.toLowerCase() === endCity.cityName.toLowerCase());
             }
           }

           const basePrice = {
             sleeper: priceObj ? priceObj.priceSleeper : 1000,
             seater: priceObj ? priceObj.priceSeater : 500,
             dynamicPricing: dynamicPricingData
           };

           const depTimeStr = (startCity.boardingPoints && startCity.boardingPoints[0]) ? startCity.boardingPoints[0].time : '10:00';
           const arrTimeStr = (endCity.droppingPoints && endCity.droppingPoints[0]) ? endCity.droppingPoints[0].time : '18:00';

           const depMins = parseInt(depTimeStr.split(':')[0] || 0) * 60 + parseInt(depTimeStr.split(':')[1] || 0);
           const arrMins = parseInt(arrTimeStr.split(':')[0] || 0) * 60 + parseInt(arrTimeStr.split(':')[1] || 0);
           
           // Calculate duration (including overnight offets difference)
           const dayDiff = (endCity.dayOffset || 0) - (startCity.dayOffset || 0);
           let diff = (arrMins + (dayDiff * 24 * 60)) - depMins;
           if (diff < 0) diff += 24 * 60; // Failsafe
           const durationStr = `${Math.floor(diff / 60).toString().padStart(2, '0')} Hrs ${(diff % 60).toString().padStart(2, '0')} Mins`;

           // Create absolute ISO date strings for Checkout matching Date + Time
           const absoluteDepDate = addDays(assignment.journeyDate, startCity.dayOffset || 0);
           const absoluteArrDate = addDays(assignment.journeyDate, endCity.dayOffset || 0);
           
           // Handle Edge Cases where Time might be just "10:00" not full ISO. 
           // In Safari/Firefox, "YYYY-MM-DD HH:MM" is invalid, need "YYYY-MM-DDTHH:MM:SS"
           const depISO = `${absoluteDepDate}T${depTimeStr.padStart(5, '0')}:00`;
           const arrISO = `${absoluteArrDate}T${arrTimeStr.padStart(5, '0')}:00`;

           return {
             ...assignment,
             basePrice,
             journeySlice: {
                source: startCity.cityName,
                destination: endCity.cityName,
                departureDateISO: depISO,
                arrivalDateISO: arrISO,
                departureTime: depTimeStr,
                arrivalTime: arrTimeStr,
                duration: durationStr,
                sourceCityFull: startCity,
                destCityFull: endCity
             }
           };
        });

        setBuses(matched);
      } catch (error) {
        console.error('Failed to fetch buses', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [reqSource, reqDest, reqDate]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Searching for buses...</div>;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>
            {reqSource && reqDest ? `Buses from ${reqSource} to ${reqDest}` : 'All Scheduled Assignments'}
          </h1>
          {reqDate && <p style={{ color: 'var(--text-secondary)' }}>On {new Date(reqDate).toLocaleDateString()} • {buses.length} Buses Found</p>}
        </div>
        <button 
          onClick={() => navigate('/')} 
          style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid #ddd', borderRadius: '8px' }}
        >
          Modify Search
        </button>
      </div>

      {/* Date Scroller */}
      {reqSource && reqDest && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {getNext5Days(reqDate).map((d, index) => {
              const dateStr = formatDateLocal(d);
              const isSelected = dateStr === reqDate;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setSearchParams(prev => {
                      prev.set('date', dateStr);
                      return prev;
                    });
                    setToastMessage(`Showing buses for ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
                    setTimeout(() => setToastMessage(''), 3000);
                  }}
                  style={{
                    minWidth: '100px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isSelected ? 'none' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? 'transparent' : 'white',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: isSelected ? '0 4px 6px rgba(139, 92, 246, 0.3)' : 'none'
                  }}
                  className={isSelected ? 'sync-gradient-bg' : ''}
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {d.getDate()} {d.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Inline Toast Notification */}
          <div style={{
            height: '20px', 
            marginTop: '8px',
            opacity: toastMessage ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500'
          }}>
            {toastMessage && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                {toastMessage}
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {buses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            No buses found matching your criteria. Try different dates or routes.
          </div>
        ) : null}
        
        {buses.map(bus => {
          const availableSeats = (bus.route?.busCapacity || 30) - (bus.bookedSeats?.length || 0);
          return (
          <div key={bus._id} className="card sync-gradient-border" style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', padding: '20px', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Bus Info */}
              <div style={{ flex: '1 1 auto', minWidth: '150px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>{bus.route?.serviceName || 'UrbanLines by Garuda'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>
                  {bus.route?.busType || bus.busType} • <span style={{ color: getAvailabilityColor(availableSeats), fontWeight: 'bold' }}>{availableSeats} Seats Available</span>
                </p>
              </div>

              {/* Timings and Price grouped together to minimize gap on mobile */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', flex: '2 1 auto', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>{bus.journeySlice.departureTime}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{bus.journeySlice.source}</p>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', fontWeight: '500' }}>{bus.journeySlice.duration}</p>
                    <p style={{ fontSize: '10px', color: '#cbd5e1' }}>──────</p>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>{bus.journeySlice.arrivalTime}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{bus.journeySlice.destination}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '2px' }}>Starts from</p>
                    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>₹{bus.basePrice?.sleeper}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/seat-selection/${bus._id}`, { state: { journeySlice: bus.journeySlice, basePrice: bus.basePrice } })} 
                    className="sync-gradient-bg btn-primary"
                    style={{ padding: '8px 16px', fontSize: '14px', whiteSpace: 'nowrap' }}
                  >
                    View Seats
                  </button>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
              <button 
                onClick={() => setExpandedBusId(expandedBusId === bus._id ? null : bus._id)}
                style={{ fontSize: '14px', fontWeight: '500', cursor: 'pointer', color: 'var(--grad-2)', outline: 'none', background: 'transparent', border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                View Boarding & Dropping Points
                <span style={{ transform: expandedBusId === bus._id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block', fontSize: '10px' }}>▼</span>
              </button>
              
              {expandedBusId === bus._id && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', marginTop: '16px', animation: 'fadeIn 0.3s ease-in-out' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-primary)' }}>Boarding Points in {bus.journeySlice.source}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(bus.journeySlice.sourceCityFull?.boardingPoints || []).map((bp, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <span style={{ paddingRight: '16px' }}>{bp.location}</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{bp.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-primary)' }}>Dropping Points in {bus.journeySlice.destination}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(bus.journeySlice.destCityFull?.droppingPoints || []).map((dp, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <span style={{ paddingRight: '16px' }}>{dp.location}</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{dp.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default SearchResults;
