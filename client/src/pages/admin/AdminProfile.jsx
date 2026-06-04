import { useState } from 'react';

const AdminProfile = () => {
  const [formData, setFormData] = useState({
    name: 'Super Admin',
    email: 'admin@garudaurbanlines.com',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Profile updated successfully! (Mock)');
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h1 className="sync-gradient-text" style={{ fontSize: '32px', marginBottom: '32px' }}>Admin Profile</h1>
      
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500' }}>Name</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500' }}>Email</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: '500' }}>New Password (leave blank to keep current)</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '16px' }}
          />
        </div>

        <button type="submit" className="sync-gradient-bg btn-primary" style={{ marginTop: '16px' }}>
          Update Profile
        </button>
      </form>
    </div>
  );
};

export default AdminProfile;
