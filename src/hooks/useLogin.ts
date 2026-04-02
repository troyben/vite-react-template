import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notify } from '@/utils/notifications';
import * as authApi from '@/services/authService';

export function useLogin() {
  const [tab, setTab] = useState<'user' | 'client'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({ identifier: '', password: '' });
  const [clientForm, setClientForm] = useState({ mobile: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const { login, clientLogin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientForm({ mobile: e.target.value });
  };

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.identifier || !userForm.password) {
      notify.error('Please enter your email/mobile and password.');
      return;
    }
    try {
      await login(userForm.identifier, userForm.password);
      navigate(from, { replace: true });
    } catch (err: any) {
      notify.error(err.message || 'Login failed');
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.mobile) {
      notify.error('Please enter your mobile number.');
      return;
    }
    try {
      if (!otpSent) {
        await authApi.requestOtp(clientForm.mobile);
        setOtpSent(true);
        setOtpCountdown(60);
        notify.success('OTP sent to your mobile number');
      } else {
        if (!otp || otp.length !== 6) {
          notify.error('Please enter the 6-digit OTP.');
          return;
        }
        await clientLogin(clientForm.mobile, otp);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      notify.error(err.message || 'Something went wrong');
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    try {
      await authApi.requestOtp(clientForm.mobile);
      setOtpCountdown(60);
      setOtp('');
      notify.success('OTP resent');
    } catch (err: any) {
      notify.error(err.message || 'Failed to resend OTP');
    }
  };

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtp('');
    setOtpCountdown(0);
  };

  return {
    tab,
    setTab,
    showPassword,
    togglePassword,
    userForm,
    clientForm,
    loading,
    handleUserChange,
    handleClientChange,
    handleUserLogin,
    handleClientLogin,
    otpSent,
    otp,
    setOtp,
    otpCountdown,
    handleResendOtp,
    resetOtpFlow,
  };
}
