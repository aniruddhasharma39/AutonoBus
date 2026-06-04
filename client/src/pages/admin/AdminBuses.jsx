import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';

const AdminBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/buses`);
      setBuses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching buses:', error);
      setLoading(false);
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    busNumber: '',
    type: '2x1 Deluxe AC Sleeper',
    totalSeats: 30
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateBus = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.busNumber) return alert('Please fill in required fields');

    // Create rigorous 2x1 sleeper layout
    let layout = [];
    const capacity = Number(formData.totalSeats);
    const rows = capacity / 6; // Since it's 2 decks and 3 seats per row = 6 seats
    
    for (let i = 1; i <= rows; i++) {
      // Lower deck
      layout.push({ seatNumber: `L${i}A`, type: 'sleeper' }); // Left Side Single
      layout.push({ seatNumber: `L${i}B`, type: 'sleeper' }); // Right Side Double A
      layout.push({ seatNumber: `L${i}C`, type: 'sleeper' }); // Right Side Double B
      
      // Upper deck
      layout.push({ seatNumber: `U${i}A`, type: 'sleeper' }); // Left Side Single
      layout.push({ seatNumber: `U${i}B`, type: 'sleeper' }); // Right Side Double A
      layout.push({ seatNumber: `U${i}C`, type: 'sleeper' }); // Right Side Double B
    }

    const newBus = {
      ...formData,
      layout,
      totalSeats: capacity
    };

    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(`${API_BASE}/api/buses`, newBus, config);
      fetchBuses();
      setShowForm(false);
      setFormData({ name: '', busNumber: '', type: '2x1 Deluxe AC Sleeper', totalSeats: 30 }); // Reset
    } catch (error) {
      alert('Error creating bus');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`${API_BASE}/api/buses/${id}`, config);
        fetchBuses();
      } catch (error) {
        alert('Error deleting bus');
        console.error(error);
      }
    }
  };

  if (loading) return <div>Loading buses...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 className="sync-gradient-text" style={{ fontSize: '32px' }}>Bus Management</h1>
        <button 
          className={showForm ? "btn-secondary" : "sync-gradient-bg btn-primary"} 
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', border: showForm ? '1px solid #ddd' : 'none', backgroundColor: showForm ? 'transparent' : undefined }}
        >
          {showForm ? 'Cancel' : '+ Add New Bus'}
        </button>
      </div>

      {showForm && (
        <div className="card sync-gradient-border" style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Add New Bus</h2>
          <form onSubmit={handleCreateBus} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Bus Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Garuda Alpha" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Number Plate</label>
               <input type="text" name="busNumber" value={formData.busNumber} onChange={handleChange} required placeholder="e.g. MH-12-AB-1234" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Bus Type</label>
              <select name="type" value={formData.type} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}>
                <option value="2x1 Deluxe AC Sleeper">2x1 Deluxe AC Sleeper</option>
                <option value="2x1 Deluxe Non AC Sleeper">2x1 Deluxe Non AC Sleeper</option>
                <option value="Volvo 9600 Multi-Axle AC Sleeper">Volvo 9600 Multi-Axle AC Sleeper</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Total Seats</label>
              <select name="totalSeats" value={formData.totalSeats} onChange={handleChange} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}>
                <option value="30">30 Sleeper</option>
                <option value="36">36 Sleeper</option>
                <option value="42">42 Sleeper</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <button type="submit" className="sync-gradient-bg btn-primary" style={{ padding: '8px 24px' }}>Save Bus</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
              <th style={{ padding: '12px' }}>Bus Name</th>
              <th style={{ padding: '12px' }}>Number Plate</th>
              <th style={{ padding: '12px' }}>Type</th>
              <th style={{ padding: '12px' }}>Capacity</th>
              <th style={{ padding: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {buses.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center' }}>No buses found. Add one above.</td></tr>
            ) : null}
            {buses.map(bus => (
              <tr key={bus._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>{bus.name}</td>
                <td style={{ padding: '12px' }}>{bus.busNumber}</td>
                <td style={{ padding: '12px' }}>{bus.type}</td>
                <td style={{ padding: '12px' }}>{bus.totalSeats} seats</td>
                <td style={{ padding: '12px' }}>
                  <button style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626' }} onClick={() => handleDelete(bus._id)}>
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

export default AdminBuses;
