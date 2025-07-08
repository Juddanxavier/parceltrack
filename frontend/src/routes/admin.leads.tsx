import { createFileRoute } from '@tanstack/react-router';
import { LeadsDashboard } from '@/components/admin/leads/LeadsDashboard';

export const Route = createFileRoute('/admin/leads')({
  component: LeadsPage,
});

function LeadsPage() {
  return <LeadsDashboard />;
}
