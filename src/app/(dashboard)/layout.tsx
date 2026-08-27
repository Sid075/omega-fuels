import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/auth.service';
import { AppLayout } from '@/components/layout/AppLayout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AppLayout
      userRole={user.role}
      userName={user.name}
      userEmail={user.email}
    >
      {children}
    </AppLayout>
  );
}
