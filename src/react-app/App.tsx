import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QuotationList from './components/QuotationList';
import QuotationForm from './components/QuotationForm';
import QuotationDetail from './components/QuotationDetail';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import Clients from './components/Clients';
import Settings from './components/Settings';
import Login from './components/Login';
import Users from './components/Users';
import './styles/variables.css';
import './styles/base.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { ReactElement, ReactNode } from 'react';

function PrivateRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function AppContent() {
  const location = useLocation();
  // Add all auth page paths here
  const hideNavbar = location.pathname === '/login';
  const { user } = useAuth();

  return (
    <div className="app">
      {!hideNavbar && <Navbar />}
      <div className="main-content" style={hideNavbar ? { marginLeft: 0, width: '100%' } : {}}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/quotations" element={<PrivateRoute><QuotationList /></PrivateRoute>} />
          <Route path="/quotations/new" element={<PrivateRoute><QuotationForm /></PrivateRoute>} />
          <Route path="/quotations/edit/:id" element={<PrivateRoute><QuotationForm /></PrivateRoute>} />
          <Route path="/quotations/:id" element={<PrivateRoute><QuotationDetail /></PrivateRoute>} />
          <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
          {/* Catch-all route for undefined paths */}
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
      </div>
    </div>
  );
}

const AuthWrapper = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  return (
    <AuthProvider onSessionExpired={() => navigate('/login')}>
      {children}
    </AuthProvider>
  );
};

const App = () => {
  return (
    <Router>
      <AuthWrapper>
        <AppContent />
        <ToastContainer />
      </AuthWrapper>
    </Router>
  );
};

export default App;
