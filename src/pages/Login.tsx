import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, User, Phone } from 'lucide-react';
import { useLogin } from '@/hooks/useLogin';

const Login = () => {
  const {
    tab,
    setTab,
    showPassword,
    togglePassword,
    userForm,
    clientForm,
    error,
    loading,
    handleUserChange,
    handleClientChange,
    handleUserLogin,
    handleClientLogin,
  } = useLogin();

  return (
    <div className="flex h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col items-center gap-2 mb-4">
              <img src="/logo.jpg" alt="Logo" className="h-14 w-14 rounded-full object-cover" />
              <CardTitle className="text-xl">Malonic</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </div>
            <Tabs value={tab} onValueChange={(v: string) => setTab(v as 'user' | 'client')}>
              <TabsList className="grid !w-full grid-cols-2">
                <TabsTrigger value="user">
                  <User className="mr-2 h-4 w-4" />
                  User / Admin
                </TabsTrigger>
                <TabsTrigger value="client">
                  <Phone className="mr-2 h-4 w-4" />
                  Client
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            {tab === 'user' ? (
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Mobile</Label>
                  <Input
                    id="identifier"
                    type="text"
                    name="identifier"
                    value={userForm.identifier}
                    onChange={handleUserChange}
                    placeholder="you@example.com"
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={userForm.password}
                      onChange={handleUserChange}
                      placeholder="Enter your password"
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={togglePassword}
                      className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleClientLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    name="mobile"
                    value={clientForm.mobile}
                    onChange={handleClientChange}
                    placeholder="e.g. 0771234567"
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
