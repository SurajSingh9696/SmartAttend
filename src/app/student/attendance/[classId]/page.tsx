import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import VerificationPipeline from '@/components/student/VerificationPipeline';

export default async function AttendancePage({ params }: { params: Promise<{ classId: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'student') redirect('/');
  const { classId } = await params;
  return (
    <div className="layout-with-sidebar">
      <Sidebar role="student" userName={session.user.name || 'Student'} />
      <VerificationPipeline classId={classId} />
    </div>
  );
}