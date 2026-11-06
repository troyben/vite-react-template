import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useSettings } from '@/hooks/useSettings';
import { ScreenLoader } from '@/components/ScreenLoader';
import ProfileForm from '@/components/settings/ProfileForm';
import PasswordForm from '@/components/settings/PasswordForm';

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
  if (error) return <div className="p-6 text-destructive">{error}</div>;
  if (!profileData) return <div className="p-6 text-muted-foreground">No profile data available</div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader><h1 className="text-2xl font-semibold">Profile Settings</h1>
        <Button type="submit" form="profile-settings" disabled={loading || submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
      </PageHeader>
      <Card>
        <CardContent className="space-y-6">
          <ProfileForm
            profileData={profileData}
            avatarPreview={avatarPreview}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
