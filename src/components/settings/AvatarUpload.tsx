import type { ProfileData } from '@/services/settingsService';

interface AvatarUploadProps {
  avatarPreview: string;
  profileData: ProfileData | null;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarUpload = ({ avatarPreview, profileData, onAvatarChange }: AvatarUploadProps) => {
  const hasAvatar = avatarPreview || (profileData && profileData.avatar);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
      <label htmlFor="avatar-upload" style={{ cursor: 'pointer' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: '#f3f3fb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginBottom: 12,
            border: '2px solid #e0e7ff',
          }}
        >
          {hasAvatar ? (
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
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onAvatarChange}
        />
        <span style={{ color: '#7c5dfa', fontWeight: 500, fontSize: 14 }}>Change Avatar</span>
      </label>
    </div>
  );
};

export default AvatarUpload;
