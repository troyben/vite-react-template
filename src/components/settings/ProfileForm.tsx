import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { ProfileData } from '@/services/settingsService';
import AvatarUpload from './AvatarUpload';

interface ProfileFormProps {
  profileData: ProfileData;
  avatarPreview: string;
  loading: boolean;
  submitting: boolean;
  success: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ProfileForm = ({
  profileData,
  avatarPreview,
  loading,
  submitting,
  success,
  onChange,
  onAvatarChange,
  onSubmit,
}: ProfileFormProps) => {
  return (
    <section className="profile-section">
      <form onSubmit={onSubmit}>
        <AvatarUpload
          avatarPreview={avatarPreview}
          profileData={profileData}
          onAvatarChange={onAvatarChange}
        />
        <div className="form-group">
          <Label className="form-label">Name</Label>
          <Input
            type="text"
            name="name"
            className="form-control"
            value={profileData?.name || ''}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <Label className="form-label">Email</Label>
          <Input
            type="email"
            name="email"
            className="form-control"
            value={profileData?.email || ''}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <Label className="form-label">Mobile Number</Label>
          <Input
            type="tel"
            name="mobile"
            className="form-control"
            value={profileData?.mobile || ''}
            onChange={onChange}
            placeholder="e.g. 0771234567"
          />
        </div>
        <div className="form-actions" style={{ justifyContent: 'center', marginTop: 32 }}>
          <Button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ minWidth: 160 }}
            disabled={loading || submitting}
          >
            {loading || submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
        {success && (
          <div style={{ color: '#33D69F', textAlign: 'center', marginTop: 16, fontWeight: 600 }}>
            Profile updated!
          </div>
        )}
      </form>
    </section>
  );
};

export default ProfileForm;
