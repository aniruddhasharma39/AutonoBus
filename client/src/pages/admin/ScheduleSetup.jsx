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
      <h1 className="sync-gradient-text" style={{ fontSize: 'clamp(22px, 5vw, 32px)', marginBottom: '8px' }}>Schedule Setup</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>Define date ranges for active routes to generate daily assignments.</p>

      <div className="card" style={{ marginBottom: '24px', padding: '0' }}>
        <h2 style={{ fontSize: '18px', padding: '16px 16px 0 16px' }}>Configure Active Routes</h2>
        <div className="responsive-table-wrapper" style={{ padding: '0 4px' }}>
          <table>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Route</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>From Date</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>To Date</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {routes.map(route => (
                <tr key={route._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{route.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <input 
                      type="date" 
                      value={formStates[route._id]?.fromDate || ''} 
                      onChange={(e) => handleInputChange(route._id, 'fromDate', e.target.value)}
                      style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <input 
                      type="date" 
                      value={formStates[route._id]?.toDate || ''} 
                      onChange={(e) => handleInputChange(route._id, 'toDate', e.target.value)}
                      style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px' }}
                    />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                      onClick={() => handleCreateSchedule(route._id)}
                      className="sync-gradient-bg btn-primary"
                      style={{ padding: '8px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}
                    >
                      Generate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: '0' }}>
        <h2 style={{ fontSize: '18px', padding: '16px 16px 0 16px' }}>Active Master Schedules</h2>
        <div className="responsive-table-wrapper" style={{ padding: '0 4px' }}>
          <table>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Route</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Date Range</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Bus Type</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Capacity</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No active schedules generated.</td></tr>
              ) : null}
              {schedules.map(schedule => (
                <tr key={schedule._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {schedule.route?.name || 'Unknown Route'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {schedule.fromDate} → {schedule.toDate}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: '#e2e8f0', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>{schedule.route?.busType}</span>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{schedule.route?.busCapacity} seats</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{ padding: '6px 14px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }} onClick={() => handleDelete(schedule._id)}>
                      Delete
                    </button>
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

export default ScheduleSetup;
