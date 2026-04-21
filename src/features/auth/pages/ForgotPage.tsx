import { FullLayout } from '@/layouts';
import { ForgotForm } from '../components';

const ForgotPage = () => {
  return (
    <FullLayout>
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-background p-8 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-foreground">Forgot password?</h1>
          <p className="text-sm text-muted-foreground">
            Enter your registered email and we&apos;ll send instructions to reset your password.
          </p>
        </div>
        <ForgotForm />
      </div>
    </FullLayout>
  );
};

export default ForgotPage;
