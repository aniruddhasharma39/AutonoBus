import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';

const ScheduleSetup = () => {
  const [routes, setRoutes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

  // Form states per route
  // e.g. { 'routeId': { fromDate: '', toDate: '', busType: 'AC Sleeper' } }
  const [formStates, setFormStates] = useState({});



  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [routesRes, schedulesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/routes`),
        axios.get(`${API_BASE}/api/schedules`)
      ]);
      setRoutes(routesRes.data);
      setSchedules(schedulesRes.data);

      const initialForms = {};
      routesRes.data.forEach(route => {
        initialForms[route._id] = {
          fromDate: '',
          toDate: ''
        };
      });
      setFormStates(initialForms);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (routeId, field, value) => {
    setFormStates(prev => ({
      ...prev,
      [routeId]: {
        ...prev[routeId],
        [field]: value
      }
    }));
  };

  const handleCreateSchedule = async (routeId) => {
    const formData = formStates[routeId];
    if (!formData.fromDate || !formData.toDate) {
      return alert('Please select both From and To dates.');
    }

    if (new Date(formData.fromDate) > new Date(formData.toDate)) {
      return alert('From Date cannot be later than To Date.');
    }

    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(`${API_BASE}/api/schedules`, {
        route: routeId,
        fromDate: formData.fromDate,
        toDate: formData.toDate
      }, config);
      
      alert('Schedule Generated Successfully!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating schedule');
      console.error(error);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this master schedule rule? Unbooked daily assignments for this rule will be deleted.')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`${API_BASE}/api/schedules/${scheduleId}`, config);
        fetchData();
      } catch (error) {
        alert('Error deleting schedule config');
        console.error(error);
      }
    }
  };

  if (loading) return <div>Loading Schedule Setup...</div>;

  return (
    <div>
      <h1 className="sync-gradient-text" style={{ fontSize: '32px', marginBottom: '8px' }}>Schedule Setup</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Define date ranges and bus types for active routes to generate daily assignments.</p>

      {/* Per-Route Forms */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Configure Active Routes</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
              <th style={{ padding: '12px' }}>Route</th>
              <th style={{ padding: '12px' }}>From Date</th>
              <th style={{ padding: '12px' }}>To Date</th>
              <th style={{ padding: '12px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(route => (
              <tr key={route._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{route.name}</td>
                <td style={{ padding: '12px' }}>
                  <input 
                    type="date" 
                    value={formStates[route._id]?.fromDate || ''} 
                    onChange={(e) => handleInputChange(route._id, 'fromDate', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <input 
                    type="date" 
                    value={formStates[route._id]?.toDate || ''} 
                    onChange={(e) => handleInputChange(route._id, 'toDate', e.target.value)}
                    style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => handleCreateSchedule(route._id)}
                    className="sync-gradient-bg btn-primary"
                    style={{ padding: '8px 16px' }}
                  >
                    Generate Schedule
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Active Schedules List */}
      <div className="card">
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Active Master Schedules</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
              <th style={{ padding: '12px' }}>Route</th>
              <th style={{ padding: '12px' }}>Date Range</th>
              <th style={{ padding: '12px' }}>Bus Type</th>
              <th style={{ padding: '12px' }}>Capacity</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '12px', textAlign: 'center' }}>No active generic schedules generated.</td></tr>
            ) : null}
            {schedules.map(schedule => (
              <tr key={schedule._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>
                  {schedule.route?.name || 'Unknown Route'}
                </td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                  {schedule.fromDate} to {schedule.toDate}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{schedule.route?.busType}</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{schedule.route?.busCapacity} seats</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => handleDelete(schedule._id)}>
                    Delete Rule
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

export default ScheduleSetup;
