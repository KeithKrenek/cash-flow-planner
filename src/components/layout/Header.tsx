import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/settings', label: 'Settings' },
];

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link
              to="/dashboard"
              className="text-xl font-bold text-text-primary hover:text-accent transition-colors"
            >
              Cash Flow Tracker
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    location.pathname === to
                      ? 'bg-surface-hover text-text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-sm text-text-secondary">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
