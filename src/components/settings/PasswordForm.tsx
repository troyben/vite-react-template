import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface PasswordFormProps {
  showPasswordForm: boolean;
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  submitting: boolean;
  onToggle: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const PasswordForm = ({
  showPasswordForm,
  passwordData,
  submitting,
  onToggle,
  onChange,
  onSubmit,
}: PasswordFormProps) => {
  return (
    <section aria-labelledby="password-heading" className="px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="password-heading" className="font-medium">Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">Update the password you use to sign in.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={showPasswordForm}
          aria-controls="password-settings"
          onClick={onToggle}
        >
          {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
        </Button>
      </div>

      {showPasswordForm && (
        <form id="password-settings" onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
          <div className="grid grid-cols-1 gap-2 sm:col-span-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              value={passwordData.currentPassword}
              onChange={onChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              value={passwordData.newPassword}
              onChange={onChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={passwordData.confirmPassword}
              onChange={onChange}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
};

export default PasswordForm;
