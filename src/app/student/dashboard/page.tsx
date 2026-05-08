import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import StudentDashboard from '@/components/student/StudentDashboard';

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'student') redirect('/');

  return (
    <div className="layout-with-sidebar">
      <Sidebar role="student" userName={session.user.name || 'Student'} />
      <StudentDashboard userName={session.user.name || 'Student'} />
    </div>
  );
}
