import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
    <div className="mt-6">
      <Separator className="mb-6" />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onToggle}
      >
        {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
      </Button>

      {showPasswordForm && (
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={onChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={onChange}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={onChange}
              required
            />
          </div>
          <div className="pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PasswordForm;
