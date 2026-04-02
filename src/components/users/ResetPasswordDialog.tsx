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
import { Eye, EyeOff } from 'lucide-react';

interface ResetPasswordDialogProps {
  open: boolean;
  userName: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

export function ResetPasswordDialog({
  open,
  userName,
  submitting,
  onClose,
  onSubmit,
}: ResetPasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setShowPassword(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    onSubmit(password);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Set a new password for <span className="font-medium text-foreground">{userName}</span>
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="reset-password">New Password</Label>
            <div className="relative">
              <Input
                id="reset-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="pr-10"
                autoFocus
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
            <Label htmlFor="reset-confirm-password">Confirm Password</Label>
            <Input
              id="reset-confirm-password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Re-enter password"
            />
          </div>
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
