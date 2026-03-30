import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProfile, updateProfile, changePassword, type ProfileData } from '@/services/settingsService';
import { notify } from '@/utils/notifications';
import { compressImage } from '@/utils/imageUtils';

interface ApiResponse<T> {
  success: boolean;
  data: {
    user: T;
  };
}

export function useSettings() {
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
    confirmPassword: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await fetchProfile();
        const apiResponse = response.data as ApiResponse<ProfileData>;
        if (apiResponse.success && apiResponse.data?.user) {
          setProfileData(apiResponse.data.user);
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
        const compressedFile = await compressImage(file, {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 400,
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          if (base64String.length > 65535) {
            notify.error('Image is too large. Please choose a smaller image.');
            return;
          }
          setAvatarPreview(base64String);
          setProfileData({
            ...profileData,
            avatar: base64String,
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
    setPasswordData((prev) => ({ ...prev, [name]: value }));
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
        newPassword: passwordData.newPassword,
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

  const togglePasswordForm = () => setShowPasswordForm((prev) => !prev);

  return {
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
  };
}
