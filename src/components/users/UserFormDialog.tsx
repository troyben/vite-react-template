import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff } from 'lucide-react';
import * as clientApi from '@/services/clientService';
import type { Client } from '@/services/clientService';
import type { User, FormValues } from '@/hooks/useUsers';

interface UserFormDialogProps {
  open: boolean;
  editingUser: User | null;
  formError: string | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
  submitting?: boolean;
}

export function UserFormDialog({
  open,
  editingUser,
  formError,
  onClose,
  onSubmit,
  submitting,
}: UserFormDialogProps) {
  const [role, setRole] = useState<string>(editingUser?.role || 'user');
  const [clientId, setClientId] = useState<string>(editingUser?.clientId?.toString() || '');
  const [clients, setClients] = useState<Client[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRole(editingUser?.role || 'user');
      setClientId(editingUser?.clientId?.toString() || '');
      setShowPassword(false);
      setPasswordError(null);
    }
  }, [open, editingUser]);

  useEffect(() => {
    if (role === 'client') {
      clientApi.getAllClients({ limit: 100 }).then((res) => {
        if (res.data.success) {
          setClients(res.data.data.items);
        }
      });
    }
  }, [role]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const values: FormValues = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      mobile: formData.get('mobile') as string,
      role: role as FormValues['role'],
      status: 'active',
      clientId: role === 'client' && clientId ? parseInt(clientId) : null,
    };

    if (!editingUser) {
      const password = formData.get('password') as string;
      const confirmPassword = formData.get('confirmPassword') as string;
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
      }
      setPasswordError(null);
      values.password = password;
    }

    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              name="name"
              type="text"
              defaultValue={editingUser?.name}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              name="email"
              type="email"
              defaultValue={editingUser?.email}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-mobile">Mobile</Label>
            <Input
              id="user-mobile"
              name="mobile"
              type="tel"
              defaultValue={editingUser?.mobile}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => { if (v !== null) setRole(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === 'client' && (
            <div className="grid gap-2">
              <Label>Linked Client</Label>
              <Select value={clientId} onValueChange={(v) => { if (v !== null) setClientId(v); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!editingUser && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="user-password">Password</Label>
                <div className="relative">
                  <Input
                    id="user-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="user-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    className="pr-10"
                  />
                </div>
              </div>
              {passwordError && (
                <div className="text-sm text-destructive">{passwordError}</div>
              )}
            </>
          )}
          {formError && (
            <div className="text-sm text-destructive">{formError}</div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
