import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import * as userService from '@/services/userService';
import { notify, confirm, alert } from '@/utils/notifications';

type UserRole = 'user' | 'client' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
}

export interface FormValues {
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  status: 'active' | 'inactive';
  password?: string;
}

export function useUsers(currentUserId: number | undefined) {
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getAllUsers();
      if (response.data.success) {
        setUsers(response.data.data.filter((u: User) => u.id !== currentUserId));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId, fetchUsers]);

  const openAddForm = useCallback(() => {
    setEditingUser(null);
    setIsFormOpen(true);
    setFormError(null);
  }, []);

  const openEditForm = useCallback((user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
    setFormError(null);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingUser(null);
    setFormError(null);
  }, []);

  const handleDelete = useCallback(async (userId: number) => {
    const willDelete = await confirm({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (willDelete) {
      setLoading(true);
      setError(null);
      try {
        await userService.deleteUser(userId);
        await fetchUsers();
        notify.success('User deleted successfully');
      } catch (err: any) {
        notify.error(err.message || 'Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  }, [fetchUsers]);

  const handleResetPassword = useCallback(async (userId: number) => {
    const willReset = await confirm({
      title: 'Reset Password',
      text: "Are you sure you want to reset this user's password? A new password will be generated.",
      icon: 'warning',
      confirmButtonText: 'Yes, reset it',
      cancelButtonText: 'Cancel',
    });

    if (willReset) {
      setLoading(true);
      try {
        await userService.resetUserPassword(userId);
        await alert({
          title: 'Password Reset',
          text: 'Password has been reset successfully. The user will receive an email with the new password.',
          icon: 'success',
        });
        await fetchUsers();
      } catch (err: any) {
        notify.error(err.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    }
  }, [fetchUsers]);

  const handleFormSubmit = useCallback(async (formValues: FormValues) => {
    setFormError(null);
    try {
      if (editingUser) {
        await userService.updateUser(editingUser.id, formValues);
        notify.success('User updated successfully');
      } else {
        await userService.createUser({ ...formValues, password: formValues.password! });
        notify.success('User created successfully');
      }
      closeForm();
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
      notify.error(err.message || 'Failed to save user');
    }
  }, [editingUser, closeForm, fetchUsers]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'mobile', header: 'Mobile' },
      { accessorKey: 'role', header: 'Role' },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => openEditForm(row.original)}>
              Edit
            </button>
            <button
              className="btn btn-sm btn-warning"
              onClick={() => handleResetPassword(row.original.id)}
            >
              Reset Password
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDelete(row.original.id)}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [openEditForm, handleResetPassword, handleDelete]
  );

  return {
    users,
    columns,
    loading,
    error,
    isFormOpen,
    editingUser,
    formError,
    openAddForm,
    closeForm,
    handleFormSubmit,
  };
}
