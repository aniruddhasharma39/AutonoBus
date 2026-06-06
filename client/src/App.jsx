import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBuses from './pages/admin/AdminBuses';
import AdminRoutes from './pages/admin/AdminRoutes';
import AdminPricing from './pages/admin/AdminPricing';
import AdminAssignments from './pages/admin/AdminAssignments';
import ScheduleSetup from './pages/admin/ScheduleSetup';
import AdminProfile from './pages/admin/AdminProfile';

import CustomerLayout from './components/CustomerLayout';
import LandingPage from './pages/customer/LandingPage';
import SearchResults from './pages/customer/SearchResults';
import SeatSelection from './pages/customer/SeatSelection';
import Checkout from './pages/customer/Checkout';
import AuthWalls from './pages/customer/AuthWalls';
import CustomerProfile from './pages/customer/CustomerProfile';

const getUserInfo = () => JSON.parse(sessionStorage.getItem('userInfo'));

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  return getUserInfo() ? children : <Navigate to="/login" state={{ from: location }} />;
};

const AdminRoute = ({ children }) => {
  const user = getUserInfo();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public / Customer Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="seat-selection/:id" element={<SeatSelection />} />
          <Route path="login" element={<AuthWalls />} />
          <Route path="register" element={<AuthWalls />} />
          <Route path="checkout" element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          } />
          <Route path="profile" element={
            <PrivateRoute>
              <CustomerProfile />
            </PrivateRoute>
          } />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="buses" element={<AdminBuses />} />
          <Route path="routes" element={<AdminRoutes />} />
          <Route path="pricing" element={<AdminPricing />} />
          <Route path="schedules" element={<ScheduleSetup />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
