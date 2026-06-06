import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bus, Map, CalendarDays, User, Menu, X, Tag, Users } from 'lucide-react';

const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Buses', path: '/admin/buses', icon: Bus },
    { label: 'Routes', path: '/admin/routes', icon: Map },
    { label: 'Pricing', path: '/admin/pricing', icon: CalendarDays },
    { label: 'Schedules', path: '/admin/schedules', icon: CalendarDays },
    { label: 'Daily Assignments', path: '/admin/assignments', icon: Bus },
    { label: 'Offers & Coupons', path: '/admin/offers', icon: Tag },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Profile', path: '/admin/profile', icon: User },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      {/* Mobile Hamburger Button */}
      <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Menu</span>
      </button>

      {/* Overlay for mobile */}
      <div
        className={`admin-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar sync-gradient-bg${sidebarOpen ? ' open' : ''}`}>
        <Link
          to="/admin"
          style={{ marginBottom: '40px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
          onClick={closeSidebar}
        >
          <img
            src="/logo.png"
            alt="Garuda Urbanlines Logo"
            style={{ height: '40px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <span style={{ display: 'none', color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
            Garuda Admin
          </span>
        </Link>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={closeSidebar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <Icon size={20} />
                <span style={{ fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
