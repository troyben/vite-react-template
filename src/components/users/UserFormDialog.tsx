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
import * as clientApi from '@/services/clientService';
import type { Client } from '@/services/clientService';
import type { User, FormValues } from '@/hooks/useUsers';

interface UserFormDialogProps {
  open: boolean;
  editingUser: User | null;
  formError: string | null;
  onClose: () => void;
  onSubmit: (values: FormValues) => void;
}

export function UserFormDialog({
  open,
  editingUser,
  formError,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const [role, setRole] = useState<string>(editingUser?.role || 'user');
  const [clientId, setClientId] = useState<string>(editingUser?.clientId?.toString() || '');
  const [clients, setClients] = useState<Client[]>([]);

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

  const handleRendered = () => {
    setRole(editingUser?.role || 'user');
    setClientId(editingUser?.clientId?.toString() || '');
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
      values.password = formData.get('password') as string;
    }

    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton
        ref={() => handleRendered()}
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
            <div className="grid gap-2">
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>
          )}
          {formError && (
            <div className="text-sm text-destructive">{formError}</div>
          )}
          <DialogFooter>
            <Button type="submit">
              {editingUser ? 'Update User' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
