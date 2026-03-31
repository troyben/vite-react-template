import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import type { ReactNode } from 'react';
import AppRoutes from './routes';

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/login';

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
