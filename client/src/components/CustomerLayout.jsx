import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../api';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    if (userInfo && userInfo.token) {
      try {
        const { data } = await axios.get(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        setNotifications(data.filter(n => !n.isRead));
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n._id !== id));
  };

  const markAllAsRead = async () => {
    if (userInfo && userInfo.token) {
      try {
        await axios.put(`${API_BASE}/api/notifications/read-all`, {}, {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        setNotifications([]);
        setIsModalOpen(false);
      } catch (error) {
        console.error('Failed to mark notifications as read', error);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Header - Synchronized Gradient */}
      <header className="sync-gradient-bg customer-header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '10px', flexShrink: 0 }}>
          <img
            src="/garuda-logo.png"
            alt="Garuda Logo"
            className="garuda-logo"
            style={{ height: '40px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <img
            src="/urbanlines-logo.png"
            alt="Urbanlines Logo"
            className="urbanlines-logo"
            style={{ height: '52px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' }}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) {
                e.target.nextSibling.style.display = 'block';
              }
            }}
          />
          <span style={{ display: 'none', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            Garuda Urbanlines
          </span>
        </Link>
        <nav className="customer-header-nav">
          {userInfo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <button 
                  style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', padding: '4px' }}
                  title="Notifications"
                  onClick={() => setIsModalOpen(!isModalOpen)}
                >
                  <Bell color="white" size={24} />
                  {notifications.length > 0 && (
                    <span 
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#ef4444',
                        borderRadius: '50%',
                      }}
                    />
                  )}
                </button>

                {isModalOpen && (
                  <>
                    <div 
                      style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                      onClick={() => setIsModalOpen(false)}
                    />
                    <div style={{
                      position: 'fixed',
                      top: '70px',
                      right: '16px',
                      width: 'calc(100vw - 32px)',
                      maxWidth: '360px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.05)',
                      border: '1px solid #e2e8f0',
                      zIndex: 50,
                      overflow: 'hidden',
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={markAllAsRead} style={{ fontSize: '12px', color: 'var(--grad-2)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          <p style={{ margin: 0, fontSize: '14px' }}>No new notifications</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif._id} style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', transition: 'background-color 0.2s' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                {notif.type.replace('_', ' ')}
                              </p>
                              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{notif.message}</p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{new Date(notif.createdAt).toLocaleString()}</p>
                            </div>
                            <button 
                              onClick={() => removeNotification(notif._id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#cbd5e1', borderRadius: '50%' }}
                              title="Remove"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
              </div>
              <div
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'white', color: 'black',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
                  flexShrink: 0
                }}
                onClick={() => navigate('/profile')}
                title="Profile"
              >
                {userInfo.name.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" style={{ color: 'white', textDecoration: 'none', fontWeight: '500', fontSize: '15px', padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}>Login</Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', backgroundColor: '#1e293b', color: '#94a3b8' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '8px', color: 'white' }}><b>Garuda UrbanLines</b></h3>
          <p style={{ marginBottom: '4px', fontSize: '14px' }}>Near Medista Hospital, Musakhedi Square, Indore, Madhya Pradesh 452001</p>
          <p style={{ fontSize: '14px' }}>Email: info@urbanlinesbus.in &nbsp;|&nbsp; Ph. 7879799574</p>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;
