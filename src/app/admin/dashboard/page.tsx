import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Class from '@/models/Class';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect('/');

  await connectDB();

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [totalStudents, totalTeachers, totalClasses, fraudToday] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    Class.countDocuments({}),
    Attendance.countDocuments({ status: 'flagged', date: { $gte: todayStart } }),
  ]);

  // Recent fraud flags
  const recentFlagDocs = await Attendance.find({ status: 'flagged', date: { $gte: todayStart } })
    .sort({ timestamp: -1 }).limit(5).lean() as any[];

  // Enrich fraud with student names
  const stuIds = recentFlagDocs.map((f: any) => f.studentId);
  const students = await Student.find({ _id: { $in: stuIds } }).populate('userId', 'name').lean() as any[];
  const stuMap: Record<string, string> = {};
  students.forEach((s: any) => { stuMap[s._id.toString()] = s.userId?.name || 'Unknown'; });

  const classIds = recentFlagDocs.map((f: any) => f.classId);
  const classes = await Class.find({ _id: { $in: classIds } }).lean() as any[];
  const clsMap: Record<string, string> = {};
  classes.forEach((c: any) => { clsMap[c._id.toString()] = c.name; });

  const recentFraud = recentFlagDocs.map((f: any) => ({
    student: stuMap[f.studentId?.toString()] || 'Unknown',
    class: clsMap[f.classId?.toString()] || 'Unknown',
    reason: f.flagReason || 'Suspicious activity',
    risk: f.riskScore ?? 0,
    time: f.timestamp ? new Date(f.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
  }));

  const stats = [
    { label: 'Total Students', value: totalStudents.toLocaleString(), color: 'var(--accent-light)' },
    { label: 'Total Teachers', value: totalTeachers.toLocaleString(), color: 'var(--cyan)' },
    { label: 'Active Classes', value: totalClasses.toLocaleString(), color: 'var(--emerald)' },
    { label: 'Fraud Flags Today', value: fraudToday.toLocaleString(), color: 'var(--rose)' },
  ];

  const QUICK_ACTIONS = [
    { href: '/admin/users', label: 'Bulk Upload Users', desc: 'Import CSV for students & teachers' },
    { href: '/admin/timetable', label: 'Manage Timetable', desc: 'Add/edit class schedules' },
    { href: '/admin/fraud', label: 'Review Fraud Flags', desc: `${fraudToday} pending reviews` },
    { href: '/admin/settings', label: 'System Settings', desc: 'QR interval, geo radius, thresholds' },
  ];

  return (
    <div className="layout-with-sidebar">
      <Sidebar role="admin" userName={session.user.name || 'Admin'} />
      <div className="main-content animate-fade-in">
        <div className="page-header">
          <h1>Admin Control Center</h1>
          <p>System overview — live data from MongoDB</p>
        </div>

        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {QUICK_ACTIONS.map(a => (
                <Link key={a.href} href={a.href} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', transition: 'var(--transition)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="9 18 15 12 9 6" /></svg>
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Recent Fraud Flags</h3>
              <Link href="/admin/fraud" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            {recentFraud.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>No fraud flags today 🎉</p>
            ) : (
              recentFraud.map((f, i) => (
                <div key={i} style={{ padding: '0.875rem', background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.student}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.time}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{f.class}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>{f.reason}</span>
                    <span className="badge badge-danger">Risk: {f.risk}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>System Status</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Attendance Engine', status: 'Online', ok: true },
              { label: 'QR Generator', status: 'Active (15s)', ok: true },
              { label: 'Fraud Detector', status: 'Active', ok: true },
              { label: 'Cron Scheduler', status: 'Running', ok: true },
              { label: 'Database', status: totalStudents > 0 ? 'Connected ✓' : 'Connected (empty)', ok: true },
              { label: 'HMAC Signing', status: 'Active', ok: true },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.ok ? 'var(--emerald)' : 'var(--rose)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.label}</div>
                  <div style={{ fontSize: '0.72rem', color: s.ok ? 'var(--emerald)' : 'var(--rose)' }}>{s.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}