import { useState, useEffect } from 'react';
import { fetchProfile, updateProfile } from '../api/authApi';
import { useAuth } from '../contexts/AuthContext';
import '../styles/variables.css';
import '../styles/Settings.css';

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '', avatar: '', mobile: '' });
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;
    setLoading(true);
    fetchProfile()
      .then((data) => {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          avatar: data.avatar || '',
          mobile: data.mobile || '',
        });
        setAvatarPreview(data.avatar || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        setProfile((prev) => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password && !currentPassword) {
      setError('Please enter your current password to change your password.');
      return;
    }
    setLoading(true);
    try {
      const updates: any = {
        name: profile.name,
        email: profile.email,
        mobile: profile.mobile,
        avatar: profile.avatar,
      };
      if (password) {
        updates.password = password;
        updates.currentPassword = currentPassword;
      }
      const updated = await updateProfile(user!.id, updates);
      setSuccess(true);
      setPassword('');
      setCurrentPassword('');
      setTimeout(() => setSuccess(false), 2000);
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page" style={{ maxWidth: 500, margin: '40px auto', background: 'white', borderRadius: 12, boxShadow: '0 4px 24px rgba(72,84,159,0.08)', padding: 32 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Profile Settings</h2>
      {loading ? (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>Loading...</div>
      ) : error ? (
        <div style={{ color: '#EC5757', textAlign: 'center', marginBottom: 16 }}>{error}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <label htmlFor="avatar-upload" style={{ cursor: 'pointer' }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#f3f3fb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12, border: '2px solid #e0e7ff' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="40" fill="#edeaff" />
                    <circle cx="40" cy="32" r="14" fill="#7c5dfa" />
                    <path d="M20 62c0-10.5 13-16 20-16s20 5.5 20 16" fill="#d6d3fa" />
                    <circle cx="40" cy="32" r="10" fill="#edeaff" />
                    <path d="M30 60c0-5.5 6.5-8 10-8s10 2.5 10 8" fill="#edeaff" />
                  </svg>
                )}
              </div>
              <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              <span style={{ color: '#7c5dfa', fontWeight: 500, fontSize: 14 }}>Change Avatar</span>
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={profile.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={profile.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              className="form-control"
              value={profile.mobile}
              onChange={handleChange}
              placeholder="e.g. 0771234567"
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Current Password {password && <span style={{ color: '#EC5757' }}>*</span>}</label>
            <input
              type="password"
              name="currentPassword"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={password ? 'Required to change password' : 'Not required unless changing password'}
              required={!!password}
            />
          </div>
          <div className="form-actions" style={{ justifyContent: 'center', marginTop: 32 }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ minWidth: 160 }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {success && <div style={{ color: '#33D69F', textAlign: 'center', marginTop: 16, fontWeight: 600 }}>Profile updated!</div>}
        </form>
      )}
    </div>
  );
};

export default Settings;