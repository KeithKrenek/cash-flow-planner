import { toast } from 'react-hot-toast';
import { PageLayout } from '@/components/layout';
import { SettingsForm } from '@/components/forms';
import { Spinner } from '@/components/ui';
import { useSettings, useUpdateSettings } from '@/hooks';
import type { ValidatedSettings } from '@/lib/validation';

export function SettingsPage() {
  const { data: settings, isLoading: settingsLoading, error } = useSettings();
  const updateSettings = useUpdateSettings();

  const handleSubmit = async (data: ValidatedSettings) => {
    try {
      await updateSettings.mutateAsync(data);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
      console.error('Settings update error:', err);
    }
  };

  // Render loading state
  if (settingsLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center py-16">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Render error state
  if (error) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-danger mb-2">
            Failed to Load Settings
          </h2>
          <p className="text-text-secondary">
            There was an error loading your settings. Please try refreshing the page.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="mt-1 text-text-secondary">
            Configure your cash flow planner preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Warning Threshold Section */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Balance Alerts
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              Set the minimum balance threshold for alerts. You&apos;ll be warned on the
              dashboard when any account&apos;s projected balance falls below this amount.
            </p>

            <SettingsForm
              initialData={{
                warningThreshold: String(settings?.warning_threshold ?? 500),
              }}
              onSubmit={handleSubmit}
              isLoading={updateSettings.isPending}
            />
          </section>

          {/* Account Information Section */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Account Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Settings ID</span>
                <span className="text-text-muted font-mono text-xs">
                  {settings?.id ?? 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">User ID</span>
                <span className="text-text-muted font-mono text-xs">
                  {settings?.user_id ?? 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Created</span>
                <span className="text-text-muted">
                  {settings?.created_at
                    ? new Date(settings.created_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Last Updated</span>
                <span className="text-text-muted">
                  {settings?.updated_at
                    ? new Date(settings.updated_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </section>

          {/* Help Section */}
          <section className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Help & Tips
            </h2>
            <div className="space-y-4 text-sm text-text-secondary">
              <div>
                <h3 className="font-medium text-text-primary mb-1">
                  Understanding Checkpoints
                </h3>
                <p>
                  Balance checkpoints are snapshots of your actual account balance on a
                  specific date. They serve as anchoring points for projections. Add a
                  checkpoint whenever you verify your real balance.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">
                  Recurring Transactions
                </h3>
                <p>
                  Set up recurring transactions for regular income (paychecks) and
                  expenses (rent, subscriptions). The projection engine will
                  automatically calculate future occurrences.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">
                  CSV Import Format
                </h3>
                <p>
                  Import transactions from your bank using CSV files. Download the
                  template from the Import CSV modal to see the required format.
                  Required columns: date, description, amount, account.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
