import { CircleUser } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { ProfileData } from '@/services/settingsService';

interface AvatarUploadProps {
  avatarPreview: string;
  profileData: ProfileData | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarUpload = ({ avatarPreview, profileData, onAvatarChange }: AvatarUploadProps) => {
  const hasAvatar = avatarPreview || (profileData && profileData.avatar);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-4 md:flex-col md:items-start">
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {hasAvatar ? (
          <img
            src={avatarPreview || profileData?.avatar}
            alt="Your profile photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <CircleUser className="size-14 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onAvatarChange}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Change Avatar</Button>
        <p className="text-xs text-muted-foreground">Choose a photo from your device.</p>
      </div>
    </div>
  );
};

export default AvatarUpload;
