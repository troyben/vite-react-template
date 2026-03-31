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
    <section>
      <form onSubmit={onSubmit} className="space-y-4">
        <AvatarUpload
          avatarPreview={avatarPreview}
          profileData={profileData}
          onAvatarChange={onAvatarChange}
        />
        <div className="grid gap-2">
          <Label htmlFor="profile-name">Name</Label>
          <Input
            id="profile-name"
            type="text"
            name="name"
            value={profileData?.name || ''}
            onChange={onChange}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input
            id="profile-email"
            type="email"
            name="email"
            value={profileData?.email || ''}
            onChange={onChange}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="profile-mobile">Mobile Number</Label>
          <Input
            id="profile-mobile"
            type="tel"
            name="mobile"
            value={profileData?.mobile || ''}
            onChange={onChange}
            placeholder="e.g. 0771234567"
          />
        </div>
        <div className="pt-4">
          <Button
            type="submit"
            className="w-full sm:w-auto sm:min-w-[160px]"
            disabled={loading || submitting}
          >
            {loading || submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
        {success && (
          <div className="text-center mt-4 text-sm font-medium text-emerald-600">
            Profile updated!
          </div>
        )}
      </form>
    </section>
  );
};

export default ProfileForm;
