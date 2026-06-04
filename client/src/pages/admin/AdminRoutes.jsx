import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';

const AdminRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

  // Edit / Duplicate States
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [duplicateRouteId, setDuplicateRouteId] = useState('');
  const [offsetStartTime, setOffsetStartTime] = useState('');

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/routes`);
      setRoutes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    distance: '',
    estimatedDuration: '', // Will be calculated and read only
    serviceName: 'UrbanLines',
    busType: '2x1 Deluxe AC Sleeper',
    busCapacity: 30
  });
  const [cities, setCities] = useState([{ 
    cityName: '', 
    sequenceOrder: 1,
    isBoarding: true,
    isDropping: true,
    dayOffset: 0,
    boardingPoints: [{ location: '', time: '' }],
    droppingPoints: [{ location: '', time: '' }]
  }]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCityChange = (index, field, value) => {
    const newCities = [...cities];
    newCities[index][field] = value;
    setCities(newCities);
  };

  const handlePointChange = (cityIndex, type, pointIndex, field, value) => {
    const newCities = [...cities];
    newCities[cityIndex][type][pointIndex][field] = value;
    setCities(newCities);
  };

  const addPoint = (cityIndex, type) => {
    const newCities = [...cities];
    newCities[cityIndex][type].push({ location: '', time: '' });
    setCities(newCities);
  };

  const removePoint = (cityIndex, type, pointIndex) => {
    const newCities = [...cities];
    newCities[cityIndex][type] = newCities[cityIndex][type].filter((_, i) => i !== pointIndex);
    setCities(newCities);
  };

  const addCity = () => {
    setCities([...cities, { 
      cityName: '', 
      sequenceOrder: cities.length + 1,
      isBoarding: true,
      isDropping: true,
      dayOffset: 0,
      boardingPoints: [{ location: '', time: '' }],
      droppingPoints: [{ location: '', time: '' }]  
    }]);
  };

  const removeCity = (index) => {
    const newCities = cities.filter((_, i) => i !== index);
    newCities.forEach((c, i) => c.sequenceOrder = i + 1);
    setCities(newCities);
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  const getMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTime = (totalMins) => {
    let mins = totalMins % (24 * 60);
    if (mins < 0) mins += 24 * 60; 
    let days = Math.floor(totalMins / (24 * 60));
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return { time: `${h}:${m}`, extraDays: days };
  };

  const calculateDuration = () => {
    if (cities.length < 2) return 0;
    const firstCity = cities[0];
    const lastCity = cities[cities.length - 1];
    
    let firstTime = null;
    let lastTime = null;

    if (firstCity.boardingPoints?.length > 0 && firstCity.boardingPoints[0].time) {
       firstTime = getMinutes(firstCity.boardingPoints[0].time) + (firstCity.dayOffset * 24 * 60);
    }
    
    const validDps = lastCity.droppingPoints?.filter(dp => dp.time);
    if (validDps?.length > 0) {
       lastTime = getMinutes(validDps[validDps.length - 1].time) + (lastCity.dayOffset * 24 * 60);
    }
    
    if (firstTime !== null && lastTime !== null) {
       const diff = lastTime - firstTime;
       if (diff > 0) {
           return (diff / 60).toFixed(1); // Hours
       }
    }
    return 0;
  };

  // -----------------------------
  // Action Handlers
  // -----------------------------
  const handleApplyDuplicate = () => {
    if (!duplicateRouteId) return;
    const sourceRoute = routes.find(r => r._id === duplicateRouteId);
    if (!sourceRoute) return;

    setFormData({
      distance: sourceRoute.distance || '',
      estimatedDuration: sourceRoute.estimatedDuration || '',
      serviceName: sourceRoute.serviceName || 'UrbanLines',
      busType: sourceRoute.busType || '2x1 Deluxe AC Sleeper',
      busCapacity: sourceRoute.busCapacity || 30
    });
      
    const newCities = JSON.parse(JSON.stringify(sourceRoute.cities));
    
    if (!offsetStartTime) {
       newCities.forEach(city => {
        if(city.boardingPoints) city.boardingPoints.forEach(p => p.time = '');
        if(city.droppingPoints) city.droppingPoints.forEach(p => p.time = '');
      });
    } else {
      const originTimeStr = newCities[0].boardingPoints?.[0]?.time || '00:00';
      const originMins = getMinutes(originTimeStr);
      const newStartMins = getMinutes(offsetStartTime);
      
      const diffMins = newStartMins - originMins;
      
      newCities.forEach(city => {
        if(city.boardingPoints) {
          city.boardingPoints.forEach(p => {
            if (p.time) {
               const absoluteOldMins = city.dayOffset * 24 * 60 + getMinutes(p.time);
               const absoluteNewMins = absoluteOldMins + diffMins;
               
               const { time, extraDays } = formatTime(absoluteNewMins);
               p.time = time;
               city.dayOffset = Math.max(0, extraDays);
            }
          });
        }
        if(city.droppingPoints) {
          city.droppingPoints.forEach(p => {
            if (p.time) {
               const absoluteOldMins = city.dayOffset * 24 * 60 + getMinutes(p.time);
               const absoluteNewMins = absoluteOldMins + diffMins;
               
               const { time, extraDays } = formatTime(absoluteNewMins);
               p.time = time;
               city.dayOffset = Math.max(0, extraDays);
            }
          });
        }
      });
    }
    setCities(newCities);
    setEditingRouteId(null);
  };

  const handleReverseRoute = () => {
    if (cities.length < 2) return alert('Need at least 2 cities to reverse.');
    
    let forwardDurations = [];
    for(let i = 0; i < cities.length - 1; i++) {
        let currentCityMins = cities[i].dayOffset * 24 * 60 + getMinutes(cities[i].boardingPoints[0]?.time || cities[i].droppingPoints[0]?.time || '00:00');
        let nextCityMins = cities[i+1].dayOffset * 24 * 60 + getMinutes(cities[i+1].droppingPoints[0]?.time || cities[i+1].boardingPoints[0]?.time || '00:00');
        let diff = nextCityMins - currentCityMins;
        if (isNaN(diff) || diff < 0) diff = 120; // default 2 hours if missing times
        forwardDurations.push(diff);
    }
    const reversedDurations = forwardDurations.reverse();
    const startMins = getMinutes(offsetStartTime || '00:00');
    const newCities = [...cities].reverse();
    
    let currentAbsoluteMins = startMins;

    const reversedCities = newCities.map((city, index) => {
       const isFirst = index === 0;
       const isLast = index === newCities.length - 1;
       
       const { time, extraDays } = formatTime(currentAbsoluteMins);

       const mappedCity = {
         ...city,
         sequenceOrder: index + 1,
         isBoarding: !isLast,
         isDropping: !isFirst,
         boardingPoints: !isLast ? (city.droppingPoints ? city.droppingPoints.map(p => ({...p, time: offsetStartTime ? time : ''})) : []) : [],
         droppingPoints: !isFirst ? (city.boardingPoints ? city.boardingPoints.map(p => ({...p, time: offsetStartTime ? time : ''})) : []) : [],
         dayOffset: offsetStartTime ? extraDays : 0, 
       };
       
       if (index < reversedDurations.length && offsetStartTime) {
           currentAbsoluteMins += reversedDurations[index];
       }

       return mappedCity;
    });

    setCities(reversedCities);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRouteId(null);
    setDuplicateRouteId('');
    setOffsetStartTime('');
    setFormData({ distance: '', estimatedDuration: '', serviceName: 'UrbanLines', busType: '2x1 Deluxe AC Sleeper', busCapacity: 30 });
    setCities([{ cityName: '', sequenceOrder: 1, isBoarding: true, isDropping: true, dayOffset: 0, boardingPoints: [{ location: '', time: '' }], droppingPoints: [{ location: '', time: '' }] }]);
  };

  const handleEdit = (route) => {
    setEditingRouteId(route._id);
    setFormData({
      distance: route.distance || '',
      estimatedDuration: route.estimatedDuration || '',
      serviceName: route.serviceName || 'UrbanLines',
      busType: route.busType || '2x1 Deluxe AC Sleeper',
      busCapacity: route.busCapacity || 30
    });
    setCities(route.cities);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (cities.length < 2) return alert('A route must have at least 2 cities.');
    if (cities.some(c => !c.cityName.trim())) return alert('All city names must be filled out.');

    const cleanedCities = cities.map(c => ({
      ...c,
      boardingPoints: c.isBoarding ? c.boardingPoints.filter(p => p.location.trim() !== '') : [],
      droppingPoints: c.isDropping ? c.droppingPoints.filter(p => p.location.trim() !== '') : []
    }));

    const computedDuration = calculateDuration();

    const routePayload = {
      ...formData,
      distance: Number(formData.distance),
      estimatedDuration: Number(computedDuration),
      busCapacity: Number(formData.busCapacity),
      cities: cleanedCities
    };

    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      if (editingRouteId) {
        await axios.put(`${API_BASE}/api/routes/${editingRouteId}`, routePayload, config);
      } else {
        await axios.post(`${API_BASE}/api/routes`, routePayload, config);
      }
      fetchRoutes();
      handleCancel();
    } catch (error) {
      alert(editingRouteId ? 'Error updating route' : 'Error creating route');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`${API_BASE}/api/routes/${id}`, config);
        fetchRoutes();
      } catch (error) {
        alert('Error deleting route');
        console.error(error);
      }
    }
  };

  if (loading) return <div>Loading routes...</div>;

  const durationHrs = calculateDuration();

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="sync-gradient-text">Route Management</h1>
        <button 
          className={showForm ? "btn-secondary" : "sync-gradient-bg btn-primary"} 
          onClick={() => {
            if(showForm) handleCancel();
            else setShowForm(true);
          }}
          style={{ padding: '10px 20px', border: showForm ? '1px solid #ddd' : 'none', backgroundColor: showForm ? 'transparent' : undefined }}
        >
          {showForm ? 'Cancel' : '+ Add New Route'}
        </button>
      </div>

      {showForm && (
        <div className="card sync-gradient-border" style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>{editingRouteId ? 'Edit Route' : 'Add New Route'}</h2>
          
          {!editingRouteId && (
            <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 250px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Duplicate Existing Route</label>
                <select value={duplicateRouteId} onChange={(e) => setDuplicateRouteId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <option value="">-- Select a route to duplicate --</option>
                  {routes.map(r => (
                    <option key={r._id} value={r._id}>{r.name} ({r.cities.map(c => c.cityName).join(', ')})</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Offset (Start Time)</label>
                <input type="time" value={offsetStartTime} onChange={(e) => setOffsetStartTime(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} title="Leave blank to duplicate with NO timings. Set a time to adjust all subsequent points." />
              </div>
              <div>
                <button type="button" onClick={handleApplyDuplicate} disabled={!duplicateRouteId} className="sync-gradient-bg btn-primary" style={{ padding: '8px 16px', opacity: !duplicateRouteId ? 0.6 : 1 }}>
                  Apply Duplicate
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateRoute} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={handleReverseRoute} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                ⇄ Reverse Route
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Service Name (Visible to Customer)</label>
                <input type="text" name="serviceName" value={formData.serviceName} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} placeholder="e.g. UrbanLines by Garuda" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Bus Type</label>
                <select name="busType" value={formData.busType} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}>
                  <option value="2x1 Deluxe AC Sleeper">2x1 Deluxe AC Sleeper</option>
                  <option value="2x1 Deluxe Non AC Sleeper">2x1 Deluxe Non AC Sleeper</option>
                  <option value="Volvo 9600 Multi-Axle AC Sleeper">Volvo 9600 Multi-Axle AC Sleeper</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>Sleeper Capacity</label>
                <select name="busCapacity" value={formData.busCapacity} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}>
                  <option value="30">30 Sleeper</option>
                  <option value="36">36 Sleeper</option>
                  <option value="42">42 Sleeper</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Total Distance (km)</label>
                <input type="number" name="distance" value={formData.distance} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Est. Duration</label>
                <div style={{ padding: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', fontWeight: 'bold', border: '1px solid #cbd5e1' }}>
                  {durationHrs > 0 ? `${durationHrs} hrs` : 'Auto-calculated (hrs)'}
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '16px', fontWeight: 'bold' }}>City Stops (In Order)</label>
              {cities.map((city, index) => {
                const isFirst = index === 0;
                const isLast = index === cities.length - 1;

                return (
                  <div key={index} style={{ padding: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{index + 1}.</span>
                      <input 
                        type="text" 
                        value={city.cityName} 
                        onChange={(e) => handleCityChange(index, 'cityName', e.target.value)} 
                        placeholder="City Name" 
                        required 
                        style={{ flex: 1, minWidth: '150px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} 
                      />

                      <select
                        value={city.dayOffset}
                        onChange={(e) => handleCityChange(index, 'dayOffset', Number(e.target.value))}
                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}
                      >
                        <option value="0">Same Day (+0)</option>
                        <option value="1">Next Day (+1)</option>
                        <option value="2">Day 3 (+2)</option>
                        <option value="3">Day 4 (+3)</option>
                        <option value="4">Day 5 (+4)</option>
                      </select>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={!isLast ? city.isBoarding : false} disabled={isLast} onChange={(e) => handleCityChange(index, 'isBoarding', e.target.checked)} />
                        Boarding allowed
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={!isFirst ? city.isDropping : false} disabled={isFirst} onChange={(e) => handleCityChange(index, 'isDropping', e.target.checked)} />
                        Dropping allowed
                      </label>

                      {cities.length > 1 && (
                        <button type="button" onClick={() => removeCity(index)} style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          Remove
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', paddingLeft: '32px' }}>
                      {(!isLast && city.isBoarding) && (
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Boarding Points</p>
                          {city.boardingPoints?.map((pt, pIdx) => (
                            <div key={`bp-${pIdx}`} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <input type="text" value={pt.location} onChange={(e) => handlePointChange(index, 'boardingPoints', pIdx, 'location', e.target.value)} placeholder="Location" style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} required />
                              <input type="time" value={pt.time} onChange={(e) => handlePointChange(index, 'boardingPoints', pIdx, 'time', e.target.value)} style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                              <button type="button" onClick={() => removePoint(index, 'boardingPoints', pIdx)} style={{ padding: '0 8px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✖</button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addPoint(index, 'boardingPoints')} style={{ fontSize: '12px', padding: '4px 8px', background: 'transparent', border: '1px dashed #ccc', cursor: 'pointer', borderRadius: '4px' }}>+ add point</button>
                        </div>
                      )}

                      {(!isFirst && city.isDropping) && (
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Dropping Points</p>
                          {city.droppingPoints?.map((pt, pIdx) => (
                            <div key={`dp-${pIdx}`} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              <input type="text" value={pt.location} onChange={(e) => handlePointChange(index, 'droppingPoints', pIdx, 'location', e.target.value)} placeholder="Location" style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} required />
                              <input type="time" value={pt.time} onChange={(e) => handlePointChange(index, 'droppingPoints', pIdx, 'time', e.target.value)} style={{ width: '100px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }} />
                              <button type="button" onClick={() => removePoint(index, 'droppingPoints', pIdx)} style={{ padding: '0 8px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>✖</button>
                            </div>
                          ))}
                          <button type="button" onClick={() => addPoint(index, 'droppingPoints')} style={{ fontSize: '12px', padding: '4px 8px', background: 'transparent', border: '1px dashed #ccc', cursor: 'pointer', borderRadius: '4px' }}>+ add point</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <button type="button" onClick={addCity} style={{ padding: '8px 16px', border: '1px dashed #94a3b8', borderRadius: '4px', backgroundColor: '#f1f5f9', cursor: 'pointer', marginTop: '8px', fontWeight: 'bold' }}>
                + Add Next City Stop
              </button>
            </div>

            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fff', borderTop: '1px solid #eee' }}>
              <button type="submit" className="sync-gradient-bg btn-primary" style={{ padding: '10px 32px', fontSize: '16px', width: '100%' }}>
                {editingRouteId ? 'Update Route' : 'Save Route'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '0' }}>
        <div className="responsive-table-wrapper" style={{ padding: '0 4px' }}>
          <table>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Route Name</th>
                <th style={{ padding: '14px 16px' }}>Path</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Dist. (km)</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Duration</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No routes found. Add one above.</td></tr>
              ) : null}
              {routes.map(route => (
                <tr key={route._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{route.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {route.cities?.map(c => c.cityName)?.join(' → ')}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{route.distance || '-'}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{route.estimatedDuration || '-'} hrs</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button style={{ padding: '6px 14px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }} onClick={() => handleEdit(route)}>
                        Edit
                      </button>
                      <button style={{ padding: '6px 14px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }} onClick={() => handleDelete(route._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRoutes;
