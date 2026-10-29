import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProfileData } from '@/services/settingsService';
import AvatarUpload from './AvatarUpload';

interface ProfileFormProps {
  profileData: ProfileData;
  avatarPreview: string;
  success: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const ProfileForm = ({
  profileData,
  avatarPreview,
  success,
  onChange,
  onAvatarChange,
  onSubmit,
}: ProfileFormProps) => {
  return (
    <form id="profile-settings" onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b bg-muted/20 p-5 md:border-r md:border-b-0">
        <h2 className="mb-4 font-medium">Profile photo</h2>
        <AvatarUpload
          avatarPreview={avatarPreview}
          profileData={profileData}
          onAvatarChange={onAvatarChange}
        />
      </aside>
      <section aria-labelledby="account-details-heading" className="min-w-0 space-y-4 p-5">
        <div>
          <h2 id="account-details-heading" className="font-medium">Account details</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your name and contact information.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid grid-cols-1 gap-2 sm:col-span-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              type="text"
              name="name"
              autoComplete="name"
              value={profileData?.name || ''}
              onChange={onChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              name="email"
              autoComplete="email"
              value={profileData?.email || ''}
              onChange={onChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="profile-mobile">Mobile Number</Label>
            <Input
              id="profile-mobile"
              type="tel"
              name="mobile"
              autoComplete="tel"
              value={profileData?.mobile || ''}
              onChange={onChange}
              placeholder="e.g. 0771234567"
            />
          </div>
        </div>
        {success && (
          <div role="status" className="text-sm font-medium text-emerald-600">
            Profile updated!
          </div>
        )}
      </section>
    </form>
  );
};

export default ProfileForm;
