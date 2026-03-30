import { CircleUser } from 'lucide-react';
import type { ProfileData } from '@/services/settingsService';

interface AvatarUploadProps {
  avatarPreview: string;
  profileData: ProfileData | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarUpload = ({ avatarPreview, profileData, onAvatarChange }: AvatarUploadProps) => {
  const hasAvatar = avatarPreview || (profileData && profileData.avatar);

  return (
    <div className="flex flex-col items-center mb-6">
      <label htmlFor="avatar-upload" className="cursor-pointer flex flex-col items-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#f3f3fb] flex items-center justify-center overflow-hidden mb-3 border-2 border-[#e0e7ff]">
          {hasAvatar ? (
            <img
              src={avatarPreview || profileData?.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <CircleUser className="w-14 h-14 sm:w-16 sm:h-16 text-[#7c5dfa]" />
          )}
        </div>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onAvatarChange}
        />
        <span className="text-[#7c5dfa] font-medium text-sm">Change Avatar</span>
      </label>
    </div>
  );
};

export default AvatarUpload;
