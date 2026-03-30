import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface UserLoginFormProps {
  identifier: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  onTogglePassword: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const UserLoginForm = ({
  identifier,
  password,
  showPassword,
  loading,
  onTogglePassword,
  onChange,
  onSubmit,
}: UserLoginFormProps) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <Label className="form-label">Email or Mobile</Label>
        <Input
          type="text"
          name="identifier"
          className="form-control"
          value={identifier}
          onChange={onChange}
          placeholder="Enter email or mobile"
          autoFocus
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <Label className="form-label">Password</Label>
        <div style={{ position: 'relative' }}>
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            className="form-control"
            value={password}
            onChange={onChange}
            placeholder="Enter password"
            disabled={loading}
            style={{ paddingRight: '40px' }}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              color: '#7C5DFA',
            }}
          >
            {showPassword ? '\u{1F441}\uFE0F' : '\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F'}
          </button>
        </div>
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

export default UserLoginForm;
