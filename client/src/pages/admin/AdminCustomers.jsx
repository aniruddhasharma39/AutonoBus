import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import { Users } from 'lucide-react';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/auth/customers`, {
        headers: { Authorization: `Bearer ${userInfo?.token}` }
      });
      if (Array.isArray(data)) {
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="sync-gradient-text">Customers</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="sync-gradient-bg" style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users color="white" size={28} />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', marginBottom: '4px' }}>Total Customers</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{customers.length}</p>
          </div>
        </div>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '500' }}>Search Customers</label>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>
      </div>

      <div className="card">
        <div className="responsive-table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bg-secondary)' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Phone</th>
                <th style={{ padding: '12px' }}>Joined</th>
                <th style={{ padding: '12px' }}>Total Bookings</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer._id} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{customer.name}</td>
                  <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{customer.email}</td>
                  <td style={{ padding: '12px' }}>{customer.phone || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{new Date(customer.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      display: 'inline-block', padding: '4px 12px', borderRadius: '16px', 
                      backgroundColor: customer.bookingCount > 0 ? '#dcfce7' : '#f1f5f9',
                      color: customer.bookingCount > 0 ? '#166534' : '#64748b',
                      fontWeight: 'bold', fontSize: '13px'
                    }}>
                      {customer.bookingCount} Bookings
                    </span>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No customers found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomers;
