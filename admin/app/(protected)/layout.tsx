import { AppSidebar } from '@/components/layout/app-sidebar';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { Topbar } from '@/components/layout/topbar';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background lg:grid lg:grid-cols-[18rem_1fr]">
        <AppSidebar />
        <div className="min-w-0">
          <Topbar />
          <main className="space-y-6 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
