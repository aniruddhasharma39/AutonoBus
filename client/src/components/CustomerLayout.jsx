import { Outlet, Link, useNavigate } from 'react-router-dom';

const CustomerLayout = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo'));

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: '500', color: 'white', fontSize: '14px' }}>Hi, {userInfo.name.split(' ')[0]}</span>
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
