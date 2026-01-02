import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Spinner } from '@/components/ui/Spinner';

export function LoginPage() {
  const { user, isLoading } = useAuth();

  // If already logged in, redirect to dashboard
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Cash Flow Tracker</h1>
          <p className="mt-2 text-text-secondary">Sign in to your account</p>
        </div>

        <div className="card p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
