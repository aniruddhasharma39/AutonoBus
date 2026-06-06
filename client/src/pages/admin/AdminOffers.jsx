import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    bannerImageUrl: '',
    isFirstJourneyOnly: false,
    applicableRoutes: [],
    discountType: 'fixed',
    discountValue: 0,
    validFrom: '',
    validUntil: '',
    termsAndConditions: '',
    isActive: true
  });

  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

  useEffect(() => {
    fetchOffers();
    fetchRoutes();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/offers`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      if (Array.isArray(data)) {
        setOffers(data);
      } else {
        setOffers([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/routes`);
      if (Array.isArray(data)) {
        setRoutes(data);
      } else {
        setRoutes([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRouteSelect = (e) => {
    const routeId = e.target.value;
    if (routeId && !formData.applicableRoutes.includes(routeId)) {
      setFormData(prev => ({
        ...prev,
        applicableRoutes: [...prev.applicableRoutes, routeId]
      }));
    }
    e.target.value = "";
  };

  const removeRoute = (routeId) => {
    setFormData(prev => ({
      ...prev,
      applicableRoutes: prev.applicableRoutes.filter(id => id !== routeId)
    }));
  };

  const resetForm = () => {
    setFormData({
      code: '', title: '', description: '', bannerImageUrl: '',
      isFirstJourneyOnly: false, applicableRoutes: [],
      discountType: 'fixed', discountValue: 0,
      validFrom: '', validUntil: '', termsAndConditions: '', isActive: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (offer) => {
    setFormData({
      ...offer,
      validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
      validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : '',
      applicableRoutes: offer.applicableRoutes.map(r => r._id)
    });
    setEditingId(offer._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this offer?")) {
      try {
        await axios.delete(`${API_BASE}/api/offers/${id}`, {
          headers: { Authorization: `Bearer ${userInfo?.token}` }
        });
        fetchOffers();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting offer');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo?.token}` } };
      if (editingId) {
        await axios.put(`${API_BASE}/api/offers/${editingId}`, formData, config);
      } else {
        await axios.post(`${API_BASE}/api/offers`, formData, config);
      }
      resetForm();
      fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving offer');
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="sync-gradient-text">Offers & Coupons</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="sync-gradient-bg btn-primary">
            + Create Offer
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>{editingId ? 'Edit Offer' : 'Create Offer'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Offer Code</label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', textTransform: 'uppercase' }} placeholder="e.g. FESTIVE50" />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Banner Image URL (Optional)</label>
              <input type="text" name="bannerImageUrl" value={formData.bannerImageUrl} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} placeholder="https://example.com/banner.jpg" />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Discount Type</label>
                <select name="discountType" value={formData.discountType} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white' }}>
                  <option value="fixed">Fixed Amount (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Discount Value</label>
                <input type="number" name="discountValue" value={formData.discountValue} onChange={handleChange} min={0} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Valid From</label>
                <input type="date" name="validFrom" value={formData.validFrom} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Valid Until</label>
                <input type="date" name="validUntil" value={formData.validUntil} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #eee', paddingTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" name="isFirstJourneyOnly" checked={formData.isFirstJourneyOnly} onChange={handleChange} />
                Applicable on First Journey Only
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Applicable Routes (Leave empty for all routes)</label>
              <select onChange={handleRouteSelect} defaultValue="" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white', marginBottom: '12px' }}>
                <option value="" disabled>Select route to add...</option>
                {routes.filter(r => !formData.applicableRoutes.includes(r._id)).map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {formData.applicableRoutes.map(routeId => {
                  const r = routes.find(x => x._id === routeId);
                  return (
                    <div key={routeId} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e2e8f0', padding: '6px 12px', borderRadius: '16px', fontSize: '14px' }}>
                      {r ? r.name : routeId}
                      <button type="button" onClick={() => removeRoute(routeId)} style={{ background: 'none', border: 'none', color: '#64748b', padding: 0, display: 'flex', cursor: 'pointer' }}>&times;</button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Terms and Conditions</label>
              <textarea name="termsAndConditions" value={formData.termsAndConditions} onChange={handleChange} rows={2} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                Offer is Active
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button type="button" onClick={resetForm} style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }}>Cancel</button>
              <button type="submit" className="sync-gradient-bg btn-primary" style={{ padding: '12px 24px', borderRadius: '8px' }}>{editingId ? 'Update Offer' : 'Save Offer'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="responsive-table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
                <th style={{ padding: '12px' }}>Code</th>
                <th style={{ padding: '12px' }}>Title</th>
                <th style={{ padding: '12px' }}>Discount</th>
                <th style={{ padding: '12px' }}>Validity</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(offer => (
                <tr key={offer._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{offer.code}</td>
                  <td style={{ padding: '12px' }}>{offer.title}</td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>
                    {offer.discountType === 'fixed' ? `₹${offer.discountValue}` : `${offer.discountValue}%`}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    {new Date(offer.validFrom).toLocaleDateString()} to {new Date(offer.validUntil).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                      backgroundColor: offer.isActive ? '#dcfce7' : '#fee2e2',
                      color: offer.isActive ? '#166534' : '#991b1b'
                    }}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(offer)} style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}>Edit</button>
                      <button onClick={() => handleDelete(offer._id)} style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '13px' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No offers created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOffers;
