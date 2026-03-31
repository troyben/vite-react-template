import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MoreHorizontal, Pencil, KeyRound, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import * as userService from '@/services/userService';
import { notify, confirm, alert } from '@/utils/notifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchUsers = useCallback(async (page: number, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getAllUsers({ page, limit: 10, search });
      if (response.data.success) {
        const filteredUsers = response.data.data.items.filter((u: User) => u.id !== currentUserId);
        setUsers(filteredUsers);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalItems(response.data.data.pagination.totalItems);
        setCurrentPage(response.data.data.pagination.page);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchUsers(1);
    }
  }, [currentUserId, fetchUsers]);

  const handlePageChange = useCallback((page: number) => {
    fetchUsers(page, searchTerm);
  }, [fetchUsers, searchTerm]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers(1, term);
    }, 300);
  }, [fetchUsers]);

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
        await fetchUsers(currentPage, searchTerm);
        notify.success('User deleted successfully');
      } catch (err: any) {
        notify.error(err.message || 'Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  }, [fetchUsers, currentPage, searchTerm]);

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
        await fetchUsers(currentPage, searchTerm);
      } catch (err: any) {
        notify.error(err.message || 'Failed to reset password');
      } finally {
        setLoading(false);
      }
    }
  }, [fetchUsers, currentPage, searchTerm]);

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
      await fetchUsers(currentPage, searchTerm);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
      notify.error(err.message || 'Failed to save user');
    }
  }, [editingUser, closeForm, fetchUsers, currentPage, searchTerm]);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'mobile', header: 'Mobile' },
      { accessorKey: 'role', header: 'Role' },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openEditForm(row.original)} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" />
                  <div>
                    <div className="text-sm">Edit</div>
                    <div className="text-xs text-muted-foreground">Modify user details</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleResetPassword(row.original.id)} className="cursor-pointer">
                  <KeyRound className="mr-2 h-4 w-4" />
                  <div>
                    <div className="text-sm">Reset Password</div>
                    <div className="text-xs text-muted-foreground">Generate a new password</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(row.original.id)} className="cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <div>
                    <div className="text-sm">Delete</div>
                    <div className="text-xs text-muted-foreground">Remove this user</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
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
    currentPage,
    totalPages,
    totalItems,
    searchTerm,
    openAddForm,
    closeForm,
    handleFormSubmit,
    handlePageChange,
    handleSearch,
  };
}
