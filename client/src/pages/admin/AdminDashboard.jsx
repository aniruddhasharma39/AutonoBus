import { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../api';
import { Bus, Map, CalendarClock, Users } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div 
      className="sync-gradient-bg" 
      style={{ 
        width: '60px', height: '60px', borderRadius: '50%', 
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}
    >
      <Icon color="white" size={28} />
    </div>
    <div>
      <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase', marginBottom: '4px' }}>{title}</h3>
      <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{value}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ buses: 0, routes: 0, schedules: 0, users: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [busesRes, routesRes, schedulesRes] = await Promise.all([
          axios.get(`${API_BASE}/api/buses`),
          axios.get(`${API_BASE}/api/routes`),
          axios.get(`${API_BASE}/api/schedules`)
        ]);
        setStats({
          buses: busesRes.data.length || 0,
          routes: routesRes.data.length || 0,
          schedules: schedulesRes.data.length || 0,
          users: 0 // Waiting for user management feature
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="sync-gradient-text" style={{ fontSize: 'clamp(22px, 5vw, 32px)', marginBottom: '24px' }}>Dashboard Overview</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <StatCard title="Total Buses" value={stats.buses} icon={Bus} />
        <StatCard title="Active Routes" value={stats.routes} icon={Map} />
        <StatCard title="Upcoming Trips" value={stats.schedules} icon={CalendarClock} />
        <StatCard title="Customers" value={stats.users} icon={Users} />
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>Recent Bookings</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Booking history module will be implementated here.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
