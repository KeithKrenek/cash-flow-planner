import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Placeholder pages - will be implemented in later phases
function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold text-text-primary">Cash Flow Tracker</h1>
      <p className="mt-2 text-text-secondary">Dashboard coming soon...</p>
    </div>
  );
}

function TransactionsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
      <p className="mt-2 text-text-secondary">Transaction management coming soon...</p>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      <p className="mt-2 text-text-secondary">Settings panel coming soon...</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-text-primary">404</h1>
        <p className="mt-2 text-text-secondary">Page not found</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-surface text-text-primary border border-border',
          duration: 4000,
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
