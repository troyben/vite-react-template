import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '@/hooks/useSettings';
import { ScreenLoader } from '@/components/ScreenLoader';
import ProfileForm from '@/components/settings/ProfileForm';
import PasswordForm from '@/components/settings/PasswordForm';
import '@/styles/variables.css';
import '@/styles/Settings.css';

const Settings = () => {
  const {
    loading,
    error,
    profileData,
    avatarPreview,
    success,
    submitting,
    showPasswordForm,
    passwordData,
    handleChange,
    handleAvatarChange,
    handlePasswordChange,
    handlePasswordSubmit,
    handleSubmit,
    togglePasswordForm,
  } = useSettings();

  if (loading) return <ScreenLoader isLoading={true} />;
  if (error) return <div className="error">{error}</div>;
  if (!profileData) return <div>No profile data available</div>;

  return (
    <div className="settings-page" style={{ maxWidth: 500, margin: '40px auto' }}>
      <Card>
        <CardHeader>
          <CardTitle style={{ fontWeight: 700, fontSize: 24 }}>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="settings-content">
            <ProfileForm
              profileData={profileData}
              avatarPreview={avatarPreview}
              loading={loading}
              submitting={submitting}
              success={success}
              onChange={handleChange}
              onAvatarChange={handleAvatarChange}
              onSubmit={handleSubmit}
            />
            <PasswordForm
              showPasswordForm={showPasswordForm}
              passwordData={passwordData}
              submitting={submitting}
              onToggle={togglePasswordForm}
              onChange={handlePasswordChange}
              onSubmit={handlePasswordSubmit}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
