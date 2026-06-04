import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';

const AdminPricing = () => {
  const [pricings, setPricings] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

  const [showForm, setShowForm] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedRouteBase, setSelectedRouteBase] = useState(null);
  
  // Array of sub-routes and their prices
  const [priceMatrix, setPriceMatrix] = useState([]);
  const [globalPrice, setGlobalPrice] = useState('');

  // Dynamic Pricing Layout states
  const [dynamicPricing, setDynamicPricing] = useState([]); // { seatId, offset }
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeDeck, setActiveDeck] = useState('Lower');
  const [dynamicOffsetInput, setDynamicOffsetInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pricingRes, routesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/pricing`),
        axios.get(`${API_BASE}/api/routes`)
      ]);
      setPricings(pricingRes.data);
      setRoutes(routesRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setLoading(false);
    }
  };

  const handleRouteSelect = (e) => {
    const routeId = e.target.value;
    setSelectedRouteId(routeId);
    setDynamicPricing([]);
    setSelectedSeats([]);
    setGlobalPrice('');
    setDynamicOffsetInput('');
    
    if (routeId) {
      const route = routes.find(r => r._id === routeId);
      setSelectedRouteBase(route);
      
      if (route && route.cities && route.cities.length > 1) {
        // Generate all possible A->B sub-routes where A comes before B
        const matrix = [];
        for (let i = 0; i < route.cities.length; i++) {
          for (let j = i + 1; j < route.cities.length; j++) {
            matrix.push({
              id: `${i}-${j}`,
              source: route.cities[i].cityName,
              destination: route.cities[j].cityName,
              priceSleeper: ''
            });
          }
        }
        setPriceMatrix(matrix);
      } else {
        setPriceMatrix([]);
      }
    } else {
      setSelectedRouteBase(null);
      setPriceMatrix([]);
    }
  };

  const handleApplyGlobalPrice = () => {
    if (!globalPrice) return;
    const newMatrix = priceMatrix.map(p => ({ ...p, priceSleeper: globalPrice }));
    setPriceMatrix(newMatrix);
  };

  const handlePriceChange = (id, field, value) => {
    const newMatrix = priceMatrix.map(p => p.id === id ? { ...p, [field]: value } : p);
    setPriceMatrix(newMatrix);
  };

  const handleRemovePermutation = (id) => {
    setPriceMatrix(priceMatrix.filter(p => p.id !== id));
  };

  const handleSeatClick = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleApplyDynamicPricing = () => {
    if (selectedSeats.length === 0) return alert('Select seats first.');
    if (dynamicOffsetInput === '') return alert('Enter a value (can be negative).');

    const offsetNum = Number(dynamicOffsetInput);
    
    let updatedDP = [...dynamicPricing];
    selectedSeats.forEach(seatId => {
      const existingIdx = updatedDP.findIndex(dp => dp.seatId === seatId);
      if (existingIdx >= 0) {
        if (offsetNum === 0) {
           updatedDP.splice(existingIdx, 1);
        } else {
           updatedDP[existingIdx].offset = offsetNum;
        }
      } else if (offsetNum !== 0) {
        updatedDP.push({ seatId, offset: offsetNum });
      }
    });

    setDynamicPricing(updatedDP);
    setSelectedSeats([]);
    setDynamicOffsetInput('');
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!selectedRouteId) return alert('Please select a route');
    
    // Ensure all prices are set
    const invalid = priceMatrix.some(p => p.priceSleeper === '');
    if (invalid) return alert('Please fill in all pricing options.');

    if (priceMatrix.length === 0) return alert('No permutations remaining. Please cancel or add another route.');

    const newSchedule = {
      route: selectedRouteId,
      priceMatrix: priceMatrix.map(p => ({
        source: p.source,
        destination: p.destination,
        priceSleeper: Number(p.priceSleeper)
      })),
      dynamicPricing
    };

    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(`${API_BASE}/api/pricing`, newSchedule, config);
      fetchData();
      setShowForm(false);
      setSelectedRouteId('');
      setSelectedRouteBase(null);
      setPriceMatrix([]);
      setDynamicPricing([]);
    } catch (error) {
      alert('Error creating schedule pricing');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pricing schedule?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`${API_BASE}/api/pricing/${id}`, config);
        fetchData();
      } catch (error) {
        alert('Error deleting schedule');
        console.error(error);
      }
    }
  };

  // Layout Generation
  const lowerLayout = [];
  const upperLayout = [];
  if (selectedRouteBase) {
    const capacity = selectedRouteBase.busCapacity || 30;
    const rows = capacity / 6;
    for (let i = 1; i <= rows; i++) {
      lowerLayout.push(`L${i}A`, `L${i}B`, `L${i}C`);
      upperLayout.push(`U${i}A`, `U${i}B`, `U${i}C`);
    }
  }

  const renderDeck = (layout) => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 2fr', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          {layout.map((seatId, i) => {
            if (i % 3 !== 0) return null;
            const isSelected = selectedSeats.includes(seatId);
            const dpObj = dynamicPricing.find(dp => dp.seatId === seatId);
            const hasDp = !!dpObj;
            return (
              <div 
                key={seatId} onClick={() => handleSeatClick(seatId)}
                style={{
                  height: '80px', width: '40px',
                  border: isSelected ? '2px solid #22c55e' : (hasDp ? '2px solid #3b82f6' : '2px solid #cbd5e1'),
                  backgroundColor: isSelected ? '#dcfce7' : (hasDp ? '#eff6ff' : 'white'),
                  borderRadius: '4px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s', position: 'relative'
                }}
              >
                {seatId}
                {hasDp && <span style={{ fontSize: '10px', color: dpObj.offset > 0 ? '#16a34a' : '#dc2626' }}>{dpObj.offset > 0 ? '+' : ''}{dpObj.offset}</span>}
              </div>
            )
          })}
        </div>
        <div style={{ width: '60px', borderLeft: '1px dashed #e2e8f0', borderRight: '1px dashed #e2e8f0' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {layout.map((seatId, i) => {
            if (i % 3 === 0) return null;
            const isSelected = selectedSeats.includes(seatId);
            const dpObj = dynamicPricing.find(dp => dp.seatId === seatId);
            const hasDp = !!dpObj;
            return (
              <div 
                key={seatId} onClick={() => handleSeatClick(seatId)}
                style={{
                  height: '80px', width: '40px',
                  border: isSelected ? '2px solid #22c55e' : (hasDp ? '2px solid #3b82f6' : '2px solid #cbd5e1'),
                  backgroundColor: isSelected ? '#dcfce7' : (hasDp ? '#eff6ff' : 'white'),
                  borderRadius: '4px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s', position: 'relative'
                }}
              >
                {seatId}
                {hasDp && <span style={{ fontSize: '10px', color: dpObj.offset > 0 ? '#16a34a' : '#dc2626' }}>{dpObj.offset > 0 ? '+' : ''}{dpObj.offset}</span>}
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading schedules...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="sync-gradient-text" style={{ fontSize: '32px' }}>Route Pricing schedules</h1>
        <button 
          className={showForm ? "btn-secondary" : "sync-gradient-bg btn-primary"} 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', border: showForm ? '1px solid #ddd' : 'none', backgroundColor: showForm ? 'transparent' : undefined }}
        >
          {showForm ? 'Cancel' : '+ Add Pricing'}
        </button>
      </div>

      {showForm && (
        <div className="card sync-gradient-border" style={{ marginBottom: '32px', display: 'flex', gap: '32px' }}>
          
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Define Sub-route Prices</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Select Base Route</label>
              <select value={selectedRouteId} onChange={handleRouteSelect} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}>
                <option value="">-- Choose Route --</option>
                {routes.map(r => <option key={r._id} value={r._id}>{r.name} ({r.distance}km)</option>)}
              </select>
            </div>

            {priceMatrix.length > 0 && selectedRouteBase && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'flex-end', padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>Apply to all permutations (₹)</label>
                    <input type="number" placeholder="e.g. 700" value={globalPrice} onChange={(e) => setGlobalPrice(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/>
                  </div>
                  <button type="button" onClick={handleApplyGlobalPrice} style={{ padding: '8px 16px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply All</button>
                </div>

                <form onSubmit={handleCreateSchedule}>
                  <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Base Fare Prices (₹)</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                    {priceMatrix.map((subRoute) => (
                      <div key={subRoute.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', flex: 1 }}>
                          {subRoute.source} <span style={{ color: '#94a3b8' }}>→</span> {subRoute.destination}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <input type="number" placeholder="Fare" required value={subRoute.priceSleeper} onChange={(e) => handlePriceChange(subRoute.id, 'priceSleeper', e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/>
                          <button type="button" onClick={() => handleRemovePermutation(subRoute.id)} style={{ padding: '6px', color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer' }} title="Remove Permutation">✖</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="sync-gradient-bg btn-primary" style={{ padding: '12px 24px', width: '100%' }}>Save Pricing Structure</button>
                </form>
              </>
            )}
          </div>

          {selectedRouteBase && (
            <div style={{ width: '400px', paddingLeft: '32px', borderLeft: '1px solid #e2e8f0' }}>
               <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Dynamic Pricing</h2>
               <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                 Select seats to dynamically adjust their pricing above/below the base fare. Set to 0 to clear.
               </p>

               <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                 <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                   <div style={{ flex: 1 }}>
                     <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold' }}>Dynamic Pricing Offset (₹)</label>
                     <input type="number" placeholder="+100 or -50" value={dynamicOffsetInput} onChange={(e) => setDynamicOffsetInput(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}/>
                   </div>
                   <button type="button" onClick={handleApplyDynamicPricing} className="btn-primary sync-gradient-bg" style={{ padding: '8px 16px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Apply</button>
                 </div>
                 <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748b' }}>Selected {selectedSeats.length} seats</p>
               </div>

               <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                  <button onClick={() => setActiveDeck('Lower')} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: activeDeck === 'Lower' ? 'none' : '1px solid #ddd', backgroundColor: activeDeck === 'Lower' ? '#0f172a' : 'white', color: activeDeck === 'Lower' ? 'white' : 'black', cursor: 'pointer' }}>Lower Deck</button>
                  <button onClick={() => setActiveDeck('Upper')} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: activeDeck === 'Upper' ? 'none' : '1px solid #ddd', backgroundColor: activeDeck === 'Upper' ? '#0f172a' : 'white', color: activeDeck === 'Upper' ? 'white' : 'black', cursor: 'pointer' }}>Upper Deck</button>
               </div>

               <div style={{ padding: '24px', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', justifyContent: 'center' }}>
                 {renderDeck(activeDeck === 'Lower' ? lowerLayout : upperLayout)}
               </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
              <th style={{ padding: '12px' }}>Base Route</th>
              <th style={{ padding: '12px' }}>Total Sub-routes</th>
              <th style={{ padding: '12px' }}>Dynamic Seats</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pricings.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center' }}>No pricing defined.</td></tr>
            ) : null}
            {pricings.map(pricing => (
              <tr key={pricing._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>
                  {pricing.route?.name || 'Unknown Route'}
                </td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                  {pricing.priceMatrix?.length || 0} permutations priced
                </td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                  {pricing.dynamicPricing?.length || 0} seats adjusted
                </td>
                <td style={{ padding: '12px' }}>
                  <button style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handleDelete(pricing._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPricing;
