import InviteAdminForm from '@/components/InviteAdminForm';

export default function AdminDashboardPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage users, approvals, and system settings.
        </p>
      </div>

      <InviteAdminForm />
    </div>
  );
}