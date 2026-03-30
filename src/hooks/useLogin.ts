import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { notify } from '@/utils/notifications';

export function useLogin() {
  const [tab, setTab] = useState<'user' | 'client'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [userForm, setUserForm] = useState({ identifier: '', password: '' });
  const [clientForm, setClientForm] = useState({ mobile: '' });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

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
    setError('');
    try {
      const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userForm.identifier);
      await login(
        isEmail ? userForm.identifier : '',
        userForm.password
      );
      navigate(from, { replace: true });
    } catch (err: any) {
      notify.error(err.message || 'Login failed');
    }
  };

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.mobile) {
      notify.error('Please enter your mobile number.');
      return;
    }
    setError('');
    notify.info('Client login not yet implemented');
  };

  return {
    tab,
    setTab,
    showPassword,
    togglePassword,
    userForm,
    clientForm,
    error,
    loading,
    handleUserChange,
    handleClientChange,
    handleUserLogin,
    handleClientLogin,
  };
}
