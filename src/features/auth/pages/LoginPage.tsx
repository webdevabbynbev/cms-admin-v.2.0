import { FullLayout } from '@/layouts';
import { LoginForm } from '../components';

const LoginPage = () => {
  return (
    <FullLayout>
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-background p-8 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Please sign in with the account you&apos;ve registered.
          </p>
        </div>
        <LoginForm />
      </div>
    </FullLayout>
  );
};

export default LoginPage;
