import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LeadsDashboard } from '@/components/admin/leads/LeadsDashboard';

function LeadsPage() {
  return (
    <div className="space-y-6">
      <LeadsDashboard />
    </div>
  );
}

export const Route = createFileRoute('/admin/leads')({
  component: () => (
    <ProtectedRoute requireAdmin={true} fallbackRoute="/auth/signin">
      <LeadsPage />
    </ProtectedRoute>
  ),
});
