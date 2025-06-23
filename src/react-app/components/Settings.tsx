import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchProfile, updateProfile, changePassword, type ProfileData } from '../services/settingsService';
import { notify } from '../utils/notifications';
import { compressImage } from '../utils/imageUtils';
import '../styles/variables.css';
import '../styles/Settings.css';
import { ScreenLoader } from './ScreenLoader';

interface ApiResponse<T> {
  success: boolean;
  data: {
    user: T;
  };
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await fetchProfile();
        const apiResponse = response.data as ApiResponse<ProfileData>;
        if (apiResponse.success && apiResponse.data?.user) {
          setProfileData(apiResponse.data.user);
          // Set the avatar preview if it exists
          if (apiResponse.data.user.avatar) {
            setAvatarPreview(apiResponse.data.user.avatar);
          }
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (profileData) {
      setProfileData({ ...profileData, [name]: value });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && profileData) {
      try {
        // Compress image before converting to base64
        const compressedFile = await compressImage(file, {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 400
        });
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Validate size after compression
          if (base64String.length > 65535) { // MySQL TEXT field limit
            notify.error('Image is too large. Please choose a smaller image.');
            return;
          }
          setAvatarPreview(base64String);
          setProfileData({
            ...profileData,
            avatar: base64String
          });
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        notify.error('Failed to process image');
        console.error('Image compression failed:', err);
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notify.error('Passwords do not match');
      return;
    }

    try {
      setSubmitting(true);
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      notify.success('Password updated successfully');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      notify.error('Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id || !profileData) return;

    try {
      setSubmitting(true);
      const response = await updateProfile(user.id, profileData);
      if (response.data.success) {
        // Fetch fresh profile data after update
        const freshResponse = await fetchProfile();
        const apiResponse = freshResponse.data as ApiResponse<ProfileData>;
        
        if (apiResponse.success && apiResponse.data?.user) {
          setProfileData(apiResponse.data.user);
          notify.success('Profile updated successfully');
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
          localStorage.setItem('user', JSON.stringify({ ...user, ...apiResponse.data.user }));
          window.dispatchEvent(new Event('storage'));
        }
      }
    } catch (err) {
      notify.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ScreenLoader isLoading={true} />;
  if (error) return <div className="error">{error}</div>;
  if (!profileData) return <div>No profile data available</div>;

  return (
    <div className="settings-page" style={{ maxWidth: 500, margin: '40px auto', background: 'white', borderRadius: 12, boxShadow: '0 4px 24px rgba(72,84,159,0.08)', padding: 32 }}>
      <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24 }}>Profile Settings</h2>
      <div className="settings-content">
        <section className="profile-section">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
              <label htmlFor="avatar-upload" style={{ cursor: 'pointer' }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#f3f3fb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 12, border: '2px solid #e0e7ff' }}>
                  {(avatarPreview || (profileData && profileData.avatar)) ? (
                    <img 
                      src={avatarPreview || profileData?.avatar} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
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
                value={profileData?.name || ''}
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
                value={profileData?.email || ''}
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
                value={profileData?.mobile || ''}
                onChange={handleChange}
                placeholder="e.g. 0771234567"
              />
            </div>
            <div className="form-actions" style={{ justifyContent: 'center', marginTop: 32 }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ minWidth: 160 }} disabled={loading || submitting}>
                {loading || submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            {success && <div style={{ color: '#33D69F', textAlign: 'center', marginTop: 16, fontWeight: 600 }}>Profile updated!</div>}
          </form>
        </section>

        <div style={{ marginTop: 32, borderTop: '1px solid #e0e7ff', paddingTop: 32 }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            style={{ width: '100%' }}
          >
            {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
          </button>
          
          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} style={{ marginTop: 24 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  className="form-control"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  className="form-control"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="form-actions" style={{ marginTop: 24 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;