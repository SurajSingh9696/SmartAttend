import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import Teacher from '@/models/Teacher';
import Timetable from '@/models/Timetable';
import Attendance from '@/models/Attendance';
import Class from '@/models/Class';

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'teacher') redirect('/');

  await connectDB();

  const teacher = await Teacher.findOne({ userId: session.user.id }).lean() as any;

  let classes: any[] = [];
  let stats = { assignedClasses: 0, studentsToday: 0, flaggedAttempts: 0, avgAttendance: '0%' };

  if (teacher) {
    const today = new Date().getDay();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const todaySlots = await Timetable.find({
      teacherId: teacher._id, dayOfWeek: today, isActive: true,
    }).lean() as any[];

    classes = await Promise.all(todaySlots.map(async (slot: any) => {
      const [presentCount, flaggedCount, cls] = await Promise.all([
        Attendance.countDocuments({ timetableId: slot._id, date: { $gte: todayStart }, status: 'present' }),
        Attendance.countDocuments({ timetableId: slot._id, date: { $gte: todayStart }, status: 'flagged' }),
        Class.findById(slot.classId).lean() as any,
      ]);
      const total = (cls as any)?.totalStudents ?? 0;
      const now = new Date();
      const isOpen = !!(slot.attendanceWindowOpen && slot.attendanceWindowOpenAt && slot.attendanceWindowCloseAt &&
        now >= new Date(slot.attendanceWindowOpenAt) && now <= new Date(slot.attendanceWindowCloseAt));
      return {
        id: slot._id.toString(), subject: slot.subject,
        class: (cls as any)?.name || 'Unknown', room: slot.room,
        startTime: slot.startTime, endTime: slot.endTime,
        present: presentCount, flagged: flaggedCount, total,
        status: isOpen ? 'active' : 'upcoming',
      };
    }));

    const totalStudents = classes.reduce((a: number, c: any) => a + c.present, 0);
    const totalFlagged = classes.reduce((a: number, c: any) => a + c.flagged, 0);
    const totalPossible = classes.reduce((a: number, c: any) => a + c.total, 0);
    stats = {
      assignedClasses: classes.length,
      studentsToday: totalStudents,
      flaggedAttempts: totalFlagged,
      avgAttendance: (totalPossible > 0 ? Math.round((totalStudents / totalPossible) * 100) : 0) + '%',
    };
  }

  const activeClass = classes.find((c: any) => c.status === 'active');

  return (
    <div className="layout-with-sidebar">
      <Sidebar role="teacher" userName={session.user.name || 'Teacher'} />
      <div className="main-content animate-fade-in">
        <div className="page-header">
          <h1>Teacher Dashboard</h1>
          <p>Live monitoring — attendance runs automatically based on the timetable</p>
        </div>

        <div className="alert alert-info" style={{ marginBottom: '2rem' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div><strong>Fully Automated:</strong> Attendance windows open and close automatically. You monitor and review flagged entries only.</div>
        </div>

        {!teacher && (
          <div className="alert alert-warning" style={{ marginBottom: '2rem' }}>
            Teacher profile not found in database. Please contact admin to set up your profile.
          </div>
        )}

        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Assigned Classes', value: stats.assignedClasses, color: 'var(--accent-light)' },
            { label: 'Students Today', value: stats.studentsToday, color: 'var(--emerald)' },
            { label: 'Flagged Attempts', value: stats.flaggedAttempts, color: 'var(--rose)' },
            { label: 'Avg Attendance', value: stats.avgAttendance, color: 'var(--cyan)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {activeClass && (
          <div className="card" style={{ marginBottom: '2rem', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div className="live-dot" /><span className="badge badge-success">LIVE</span>
                </div>
                <h2 style={{ fontSize: '1.2rem' }}>{activeClass.subject} — {activeClass.class}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Room {activeClass.room} · {activeClass.startTime}–{activeClass.endTime}</p>
              </div>
              <Link href={`/teacher/class/${activeClass.id}`} className="btn btn-primary">Open Live View</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--emerald-glow)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--emerald)' }}>{activeClass.present}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Present</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--rose-glow)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(244,63,94,0.2)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--rose)' }}>{activeClass.total - activeClass.present}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Absent</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--amber-glow)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--amber)' }}>{activeClass.flagged}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Flagged</div>
              </div>
            </div>
            {activeClass.total > 0 && (
              <>
                <div className="progress-bar" style={{ marginTop: '1rem' }}>
                  <div className="progress-fill" style={{ width: `${(activeClass.present / activeClass.total) * 100}%`, background: 'var(--emerald)' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right' }}>
                  {Math.round((activeClass.present / activeClass.total) * 100)}% attendance
                </div>
              </>
            )}
          </div>
        )}

        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Today&apos;s Schedule</h3>
          {classes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No classes scheduled for today.</p>
          ) : (
            classes.map((cls: any) => (
              <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--glass)', border: '1px solid var(--glass-border)', marginBottom: '0.75rem' }}>
                <div style={{ width: 4, height: 48, borderRadius: 2, background: cls.status === 'active' ? 'var(--emerald)' : 'var(--glass-border)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{cls.subject} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {cls.class}</span></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Room {cls.room} · {cls.startTime}–{cls.endTime}</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cls.present}/{cls.total}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Present</div>
                </div>
                {cls.flagged > 0 && <span className="badge badge-warning">{cls.flagged} flagged</span>}
                <span className={`badge ${cls.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                  {cls.status === 'active' ? 'Live' : 'Upcoming'}
                </span>
                <Link href={`/teacher/class/${cls.id}`} className="btn btn-secondary btn-sm">View</Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}