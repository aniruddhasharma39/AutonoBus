import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../../api';

const AuthWalls = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const { data } = await axios.post(`${API_BASE}${endpoint}`, formData);
      
      if (!isLogin) {
        // Registration successful
        alert('Registration Successful! Please log in with your new credentials.');
        setIsLogin(true); // Switch to login view
        return; // Stop here, do not log them in automatically
      }
      
      // Login successful
      sessionStorage.setItem('userInfo', JSON.stringify(data));
      
      if (data.role === 'admin') {
        window.location.href = '/admin';
      } else {
        const redirect = location.state?.from?.pathname || '/';
        window.location.href = redirect;
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Authentication Failed');
    }
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '80vh', justifyContent: 'center' }}>
      <div className="card sync-gradient-border">
        <h1 className="sync-gradient-text" style={{ fontSize: '32px', marginBottom: '8px', textAlign: 'center' }}>
          {isLogin ? 'Welcome Back' : 'Join Garuda'}
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Please {isLogin ? 'log in' : 'register'} to continue booking your journey.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
              <input type="text" name="name" onChange={handleChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
            <input type="email" name="email" onChange={handleChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
            <input type="password" name="password" onChange={handleChange} required style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} />
          </div>

          <button type="submit" className="sync-gradient-bg btn-primary" style={{ padding: '16px', fontSize: '18px', marginTop: '16px' }}>
            {isLogin ? 'Log In' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ padding: 0, backgroundColor: 'transparent', color: 'var(--grad-2)', textDecoration: 'underline' }}
          >
            {isLogin ? 'Register' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthWalls;
