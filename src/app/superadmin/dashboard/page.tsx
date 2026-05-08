import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Class from '@/models/Class';
import Link from 'next/link';

export default async function SuperadminDashboard() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'superadmin') redirect('/');

  await connectDB();

  // Aggregate stats
  const [totalColleges, totalStudents, totalTeachers, totalClasses] = await Promise.all([
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    Class.countDocuments({}),
  ]);

  const stats = [
    { label: 'Registered Colleges', value: totalColleges.toLocaleString(), color: 'var(--violet)' },
    { label: 'Total Students', value: totalStudents.toLocaleString(), color: 'var(--accent-light)' },
    { label: 'Total Teachers', value: totalTeachers.toLocaleString(), color: 'var(--cyan)' },
    { label: 'Active Classes', value: totalClasses.toLocaleString(), color: 'var(--emerald)' },
  ];

  return (
    <div className="layout-with-sidebar">
      <Sidebar role="superadmin" userName={session.user.name || 'Superadmin'} />
      <div className="main-content animate-fade-in">
        <div className="page-header">
          <h1>Global Overview</h1>
          <p>Superadmin control center for the SmartAttend platform.</p>
        </div>

        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Quick Actions</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Link href="/superadmin/colleges" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', transition: 'var(--transition)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>Manage Colleges</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>View, suspend, or activate college accounts.</div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="2" width="20" height="20"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
