import { createFileRoute } from '@tanstack/react-router';
import { AdminLayout } from '../components/admin/AdminLayout';
import { Outlet } from '@tanstack/react-router';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const Route = createFileRoute('/admin')({
  component: () => (
    <ProtectedRoute requireAdmin={true} fallbackRoute="/profile">
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </ProtectedRoute>
  ),
});

function AdminLayoutRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
