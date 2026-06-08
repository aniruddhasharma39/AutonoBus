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
  const [editMode, setEditMode] = useState(false);
  const [editingBusId, setEditingBusId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    busNumber: '',
    type: '2x1 Deluxe AC Sleeper',
    totalSeats: 30,
    serviceImage: '',
    themeColor: '#0B3D91',
    frontImage: '',
    rightImage: '',
    leftImage: '',
    backImage: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.busNumber) return alert('Please fill in required fields');

    const capacity = Number(formData.totalSeats);

    const busPayload = {
      ...formData,
      images: {
        front: formData.frontImage,
        right: formData.rightImage,
        left: formData.leftImage,
        back: formData.backImage
      },
      totalSeats: capacity
    };

    if (!editMode) {
      // Create rigorous 2x1 sleeper layout
      let layout = [];
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
      busPayload.layout = layout;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      if (editMode) {
        await axios.put(`${API_BASE}/api/buses/${editingBusId}`, busPayload, config);
      } else {
        await axios.post(`${API_BASE}/api/buses`, busPayload, config);
      }
      fetchBuses();
      setShowForm(false);
      setEditMode(false);
      setEditingBusId(null);
      setFormData({ name: '', busNumber: '', type: '2x1 Deluxe AC Sleeper', totalSeats: 30, serviceImage: '', themeColor: '#0B3D91', frontImage: '', rightImage: '', leftImage: '', backImage: '' }); // Reset
    } catch (error) {
      alert(`Error ${editMode ? 'updating' : 'creating'} bus`);
      console.error(error);
    }
  };

  const handleEdit = (bus) => {
    setEditMode(true);
    setEditingBusId(bus._id);
    setFormData({
      name: bus.name,
      busNumber: bus.busNumber,
      type: bus.type,
      totalSeats: bus.totalSeats,
      serviceImage: bus.serviceImage || '',
      themeColor: bus.themeColor || '#0B3D91',
      frontImage: bus.images?.front || '',
      rightImage: bus.images?.right || '',
      leftImage: bus.images?.left || '',
      backImage: bus.images?.back || ''
    });
    setShowForm(true);
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
      <div className="admin-page-header">
        <h1 className="sync-gradient-text">Bus Management</h1>
        <button 
          className={showForm ? "btn-secondary" : "sync-gradient-bg btn-primary"} 
          onClick={() => {
            if (showForm) {
              setEditMode(false);
              setEditingBusId(null);
              setFormData({ name: '', busNumber: '', type: '2x1 Deluxe AC Sleeper', totalSeats: 30, serviceImage: '', themeColor: '#0B3D91', frontImage: '', rightImage: '', leftImage: '', backImage: '' });
            }
            setShowForm(!showForm);
          }}
          style={{ padding: '10px 20px', border: showForm ? '1px solid #ddd' : 'none', backgroundColor: showForm ? 'transparent' : undefined }}
        >
          {showForm ? 'Cancel' : '+ Add New Bus'}
        </button>
      </div>

      {showForm && (
        <div className="card sync-gradient-border" style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>{editMode ? 'Edit Bus' : 'Add New Bus'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Service Name Logo URL</label>
              <input type="text" name="serviceImage" value={formData.serviceImage} onChange={handleChange} placeholder="e.g. https://example.com/logo.png" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Theme Color</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" name="themeColor" value={formData.themeColor} onChange={handleChange} style={{ padding: '0', border: 'none', width: '40px', height: '40px', borderRadius: '4px', cursor: 'pointer' }} />
                <span style={{ fontSize: '14px', color: '#666' }}>{formData.themeColor}</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Bus Front Image URL</label>
              <input type="text" name="frontImage" value={formData.frontImage} onChange={handleChange} placeholder="URL" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Bus Right Image URL</label>
              <input type="text" name="rightImage" value={formData.rightImage} onChange={handleChange} placeholder="URL" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Bus Left Image URL</label>
              <input type="text" name="leftImage" value={formData.leftImage} onChange={handleChange} placeholder="URL" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>Bus Back Image URL</label>
              <input type="text" name="backImage" value={formData.backImage} onChange={handleChange} placeholder="URL" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
              <button type="submit" className="sync-gradient-bg btn-primary" style={{ padding: '8px 24px' }}>{editMode ? 'Update Bus' : 'Save Bus'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '0' }}>
        <div className="responsive-table-wrapper" style={{ padding: '0 4px' }}>
          <table>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Bus Name</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Number Plate</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Type</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Capacity</th>
                <th style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No buses found. Add one above.</td></tr>
              ) : null}
              {buses.map(bus => (
                <tr key={bus._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '500', whiteSpace: 'nowrap' }}>{bus.name}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{bus.busNumber}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>{bus.type}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{bus.totalSeats} seats</td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '6px 14px', backgroundColor: '#e0f2fe', color: '#0284c7', fontSize: '13px', borderRadius: '4px', border: 'none', cursor: 'pointer' }} onClick={() => handleEdit(bus)}>
                      Edit
                    </button>
                    <button style={{ padding: '6px 14px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '13px', borderRadius: '4px', border: 'none', cursor: 'pointer' }} onClick={() => handleDelete(bus._id)}>
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

export default AdminBuses;
