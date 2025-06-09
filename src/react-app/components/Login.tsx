import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/variables.css';
import '../styles/Login.css';
import { notify } from '../utils/notifications';

const Login = () => {
  const [tab, setTab] = useState<'user' | 'client'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({ identifier: '', password: '' });
  const [clientForm, setClientForm] = useState({ mobile: '' });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientForm({ mobile: e.target.value });
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.identifier || !userForm.password) {
      notify.error('Please enter your email/mobile and password.');
      return;
    }
    setError('');
    try {
      // Try email first, fallback to mobile if not an email
      const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userForm.identifier);
      await login(
        isEmail ? userForm.identifier : '',
        userForm.password
      );
      notify.success('Login successful');
      navigate(from, { replace: true });
    } catch (err: any) {
      notify.error(err.message || 'Login failed');
    }
  };

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement real client login logic
    if (!clientForm.mobile) {
      notify.error('Please enter your mobile number.');
      return;
    }
    setError('');
    notify.info('Client login not yet implemented');
  };

  return (
    <div className="login-page" style={{ maxWidth: 400, margin: '60px auto', background: 'white', borderRadius: 12, boxShadow: '0 4px 24px rgba(72,84,159,0.08)', padding: 32 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24, textAlign: 'center' }}>Sign In</h2>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <button
          className={`btn ${tab === 'user' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '8px 0 0 8px', minWidth: 120 }}
          onClick={() => setTab('user')}
        >
          User / Admin
        </button>
        <button
          className={`btn ${tab === 'client' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '0 8px 8px 0', minWidth: 120 }}
          onClick={() => setTab('client')}
        >
          Client
        </button>
      </div>
      {error && <div style={{ color: '#EC5757', marginBottom: 16, textAlign: 'center' }}>{error}</div>}
      {tab === 'user' ? (
        <form onSubmit={handleUserLogin}>
          <div className="form-group">
            <label className="form-label">Email or Mobile</label>
            <input
              type="text"
              name="identifier"
              className="form-control"
              value={userForm.identifier}
              onChange={handleUserChange}
              placeholder="Enter email or mobile"
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-control"
                value={userForm.password}
                onChange={handleUserChange}
                placeholder="Enter password"
                disabled={loading}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                  color: '#7C5DFA'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          <div className="form-actions" style={{ marginTop: 32 }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleClientLogin}>
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              className="form-control"
              value={clientForm.mobile}
              onChange={handleClientChange}
              placeholder="e.g. 0771234567"
              autoFocus
              disabled={loading}
            />
          </div>
          <div className="form-actions" style={{ marginTop: 32 }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Login;