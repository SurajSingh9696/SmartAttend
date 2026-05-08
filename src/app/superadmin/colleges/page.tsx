import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import CollegesManager from '@/components/superadmin/CollegesManager';

export default async function CollegesPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'superadmin') redirect('/');

  return (
    <div className="layout-with-sidebar">
      <Sidebar role="superadmin" userName={session.user.name || 'Superadmin'} />
      <div className="main-content animate-fade-in">
        <div className="page-header">
          <h1>Colleges Management</h1>
          <p>View and manage all registered institution administrative accounts.</p>
        </div>
        <CollegesManager />
      </div>
    </div>
  );
}
