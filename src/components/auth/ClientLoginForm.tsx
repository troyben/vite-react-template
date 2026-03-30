import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ClientLoginFormProps {
  mobile: string;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ClientLoginForm = ({
  mobile,
  loading,
  onChange,
  onSubmit,
}: ClientLoginFormProps) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <Label className="form-label">Mobile Number</Label>
        <Input
          type="tel"
          name="mobile"
          className="form-control"
          value={mobile}
          onChange={onChange}
          placeholder="e.g. 0771234567"
          autoFocus
          disabled={loading}
        />
      </div>
      <div className="form-actions" style={{ marginTop: 32 }}>
        <Button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </div>
    </form>
  );
};

export default ClientLoginForm;
