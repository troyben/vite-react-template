import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLogin } from '@/hooks/useLogin';
import UserLoginForm from '@/components/auth/UserLoginForm';
import ClientLoginForm from '@/components/auth/ClientLoginForm';
import '@/styles/variables.css';
import '@/styles/Login.css';

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
    <div className="login-page">
      <Card>
        <CardHeader>
          <div className="login-logo">
            <img src="/logo.jpg" alt="Logo" />
          </div>
          <CardTitle className="font-bold text-lg sm:text-xl text-center">
            Sign In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v: string) => setTab(v as 'user' | 'client')}>
            <TabsList style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <TabsTrigger value="user" style={{ minWidth: 120 }}>
                User / Admin
              </TabsTrigger>
              <TabsTrigger value="client" style={{ minWidth: 120 }}>
                Client
              </TabsTrigger>
            </TabsList>

            {error && (
              <div style={{ color: '#EC5757', marginBottom: 16, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <TabsContent value="user">
              <UserLoginForm
                identifier={userForm.identifier}
                password={userForm.password}
                showPassword={showPassword}
                loading={loading}
                onTogglePassword={togglePassword}
                onChange={handleUserChange}
                onSubmit={handleUserLogin}
              />
            </TabsContent>

            <TabsContent value="client">
              <ClientLoginForm
                mobile={clientForm.mobile}
                loading={loading}
                onChange={handleClientChange}
                onSubmit={handleClientLogin}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
