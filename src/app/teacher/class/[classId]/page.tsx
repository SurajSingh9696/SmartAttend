import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import LiveClassView from '@/components/teacher/LiveClassView';

export default async function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'teacher') redirect('/');
  const { classId } = await params;
  return (
    <div className="layout-with-sidebar">
      <Sidebar role="teacher" userName={session.user.name || 'Teacher'} />
      <LiveClassView classId={classId} />
    </div>
  );
}