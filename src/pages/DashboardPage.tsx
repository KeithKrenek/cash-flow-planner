import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function DashboardPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-text-primary">
              Cash Flow Tracker
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-secondary">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Welcome to Cash Flow Tracker
          </h2>
          <p className="text-text-secondary">
            Dashboard features coming in Phase 6. This placeholder confirms
            authentication is working correctly.
          </p>
        </div>
      </main>
    </div>
  );
}
