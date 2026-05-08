import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import TimetableManager from '@/components/admin/TimetableManager';

export default async function TimetablePage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect('/');
  return (
    <div className="layout-with-sidebar">
      <Sidebar role="admin" userName={session.user.name || 'Admin'} />
      <TimetableManager />
    </div>
  );
}
