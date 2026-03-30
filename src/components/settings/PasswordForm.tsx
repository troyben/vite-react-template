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
    <div style={{ marginTop: 32 }}>
      <Separator className="mb-8" style={{ borderColor: '#e0e7ff' }} />
      <Button
        type="button"
        className="btn btn-secondary"
        onClick={onToggle}
        style={{ width: '100%' }}
      >
        {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
      </Button>

      {showPasswordForm && (
        <form onSubmit={onSubmit} style={{ marginTop: 24 }}>
          <div className="form-group">
            <Label className="form-label">Current Password</Label>
            <Input
              type="password"
              name="currentPassword"
              className="form-control"
              value={passwordData.currentPassword}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <Label className="form-label">New Password</Label>
            <Input
              type="password"
              name="newPassword"
              className="form-control"
              value={passwordData.newPassword}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <Label className="form-label">Confirm New Password</Label>
            <Input
              type="password"
              name="confirmPassword"
              className="form-control"
              value={passwordData.confirmPassword}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-actions" style={{ marginTop: 24 }}>
            <Button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PasswordForm;
