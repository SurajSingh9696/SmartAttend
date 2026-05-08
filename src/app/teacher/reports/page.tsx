import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';

const SUBJECTS = [
  { subject: 'Database Management Systems', class: 'CSE-A', teacher: 'Dr. Sharma', time: '09:00-10:00', today: { present: 38, total: 45, pct: 84 } },
  { subject: 'Operating Systems', class: 'CSE-A', teacher: 'Prof. Verma', time: '10:00-11:00', today: { present: 40, total: 45, pct: 89 } },
  { subject: 'Computer Networks', class: 'CSE-A', teacher: 'Dr. Singh', time: '11:00-12:00', today: { present: 35, total: 45, pct: 78 } },
  { subject: 'Software Engineering', class: 'CSE-A', teacher: 'Prof. Kumar', time: '14:00-15:00', today: { present: 0, total: 45, pct: 0 } },
];

export default async function TeacherReports() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'teacher') redirect('/');

  return (
    <div className="layout-with-sidebar">
      <Sidebar role="teacher" userName={session.user.name || 'Teacher'} />
      <div className="main-content animate-fade-in">
        <div className="page-header">
          <h1>Attendance Reports</h1>
          <p>Subject-wise attendance summaries for your classes</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {SUBJECTS.map((s, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem' }}>{s.subject}</h3>
                  <p style={{ margin: 0, fontSize: '0.82rem' }}>{s.class} · {s.teacher} · {s.time}</p>
                </div>
                <span className={`badge ${s.today.pct >= 85 ? 'badge-success' : s.today.pct >= 75 ? 'badge-warning' : s.today.pct === 0 ? 'badge-info' : 'badge-danger'}`}>
                  {s.today.pct === 0 ? 'Not started' : `${s.today.pct}% today`}
                </span>
              </div>
              {s.today.pct > 0 && (
                <>
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>Present: {s.today.present}</span>
                    <span style={{ color: 'var(--rose)', fontWeight: 600 }}>Absent: {s.today.total - s.today.present}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Total: {s.today.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${s.today.pct}%`, background: s.today.pct >= 85 ? 'var(--emerald)' : s.today.pct >= 75 ? 'var(--amber)' : 'var(--rose)' }} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}