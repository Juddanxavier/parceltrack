import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LeadList } from '@/components/LeadList';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LeadForm } from '@/components/LeadForm';

function LeadsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads Management</h1>
            <p className="text-muted-foreground">
              Manage shipping inquiries and convert leads to parcels
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Lead
          </Button>
        </div>

        <LeadList />

        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="sm:max-w-[500px]">
            <LeadForm onClose={() => setShowCreateForm(false)} />
          </DialogContent>
        </Dialog>
      </div>
  );
}

export const Route = createFileRoute('/admin/leads')({
  component: () => (
    <ProtectedRoute requireAdmin={true} fallbackRoute="/profile">
      <LeadsPage />
    </ProtectedRoute>
  ),
});
