import { useState, useMemo, useEffect } from 'react';
import BaseDataTable from './BaseDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import * as authApi from '../api/authApi';
import { useAuth } from '../contexts/AuthContext';
import { notify, confirm, alert } from '../utils/notifications';

import '../styles/Users.css';

interface User {
  id: number;
  name: string;
  email: string;
  mobile: string;
  role: 'admin' | 'user' | 'client';
}

const Users = () => {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Ensure nothing runs before context is ready
  if (authLoading || !currentUser) {
    return <div>Loading...</div>;
  }

  // Restrict access to admins only
  if (currentUser?.role !== 'admin') {
    return <div style={{ color: '#EC5757', textAlign: 'center', marginTop: 40 }}>Access denied. Only admins can manage users.</div>;
  }

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.getUsers();
      // Hide the current user from the list
      setUsers(data.filter((u: User) => u.id !== currentUser.id));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || authLoading) return;
    fetchUsers();
    // eslint-disable-next-line
  }, [currentUser, authLoading]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
    setFormError(null);
  };

  const handleDelete = async (userId: number) => {
    const willDelete = await confirm({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (willDelete) {
      setLoading(true);
      setError(null);
      try {
        await authApi.deleteUser(userId);
        await fetchUsers();
        notify.success('User deleted successfully');
      } catch (err: any) {
        notify.error(err.message || 'Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  // Removed handleDeactivate function as status management is no longer needed

  const handleResetPassword = async (userId: number) => {
    const willReset = await confirm({
      title: 'Reset Password',
      text: 'Are you sure you want to reset this user\'s password? A new password will be generated.',
      icon: 'warning',
      confirmButtonText: 'Yes, reset it',
      cancelButtonText: 'Cancel'
    });

    if (willReset) {
      setLoading(true);
      try {
        await authApi.resetUserPassword(userId);
        await alert({
          title: 'Password Reset',
          text: 'Password has been reset successfully. The user will receive an email with the new password.',
          icon: 'success'
        });
        await fetchUsers();
      } catch (err: any) {
        notify.error(err.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      const formValues = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        mobile: formData.get('mobile') as string,
        role: formData.get('role') as string,
        status: formData.get('status') as 'active' | 'inactive'
      };

      if (editingUser) {
        await authApi.updateUser(editingUser.id, formValues);
        notify.success('User updated successfully');
      } else {
        const password = formData.get('password') as string;
        await authApi.createUser({ ...formValues, password });
        notify.success('User created successfully');
      }
      
      setIsFormOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
      notify.error(err.message || 'Failed to save user');
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile',
      },
      {
        accessorKey: 'role',
        header: 'Role',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => handleEdit(row.original)}>
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
    []
  );

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Users Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingUser(null);
            setIsFormOpen(true);
            setFormError(null);
          }}
        >
          Add New User
        </button>
      </div>

      {error && <div style={{ color: '#EC5757', marginBottom: 16 }}>{error}</div>}
      {loading ? (
        <div style={{ textAlign: 'center', margin: '32px 0' }}>Loading...</div>
      ) : (
        <BaseDataTable columns={columns} data={users} globalFilterPlaceholder="Search users..." />
      )}

      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 500, margin: '40px auto', background: 'white', borderRadius: 12, boxShadow: '0 4px 24px rgba(72,84,159,0.08)', padding: 32 }}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button 
                className="btn-icon"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingUser(null);
                  setFormError(null);
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  defaultValue={editingUser?.name}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  defaultValue={editingUser?.email}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile</label>
                <input
                  type="tel"
                  className="form-control"
                  name="mobile"
                  defaultValue={editingUser?.mobile}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select 
                  className="form-control"
                  name="role"
                  defaultValue={editingUser?.role || 'user'}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="client">Client</option>
                </select>
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                  />
                </div>
              )}
              {formError && <div style={{ color: '#EC5757', marginBottom: 16 }}>{formError}</div>}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;