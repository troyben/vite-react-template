import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSystemSettingsStore } from './stores/systemSettingsStore';
import type { ReactNode } from 'react';
import AppRoutes from './routes';

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role !== 'client') {
      useSystemSettingsStore.getState().fetchSettings();
    }
  }, [user]);

  return (
    <div className="flex min-h-screen">
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? 'flex-1' : 'flex-1 ml-16'}>
        <AppRoutes />
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
