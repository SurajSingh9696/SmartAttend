import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import { connectDB } from '@/lib/db';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import Timetable from '@/models/Timetable';
import Class from '@/models/Class';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect('/');

  await connectDB();

  // ── Overall attendance stats ────────────────────────────
  const [totalRecords, presentRecords, flaggedRecords] = await Promise.all([
    Attendance.countDocuments({}),
    Attendance.countDocuments({ status: 'present' }),
    Attendance.countDocuments({ status: 'flagged' }),
  ]);
  const overallPct = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

  // Students below 75% attendance
  const allStudents = await Student.find({}).lean() as any[];
  let belowThreshold = 0;
  for (const student of allStudents) {
    const stuTotal = await Attendance.countDocuments({ studentId: student._id });
    const stuPresent = await Attendance.countDocuments({ studentId: student._id, status: 'present' });
    const pct = stuTotal > 0 ? (stuPresent / stuTotal) * 100 : 100;
    if (stuTotal > 0 && pct < 75) belowThreshold++;
  }

  const fraudRate = totalRecords > 0 ? ((flaggedRecords / totalRecords) * 100).toFixed(1) : '0.0';

  // Classes today
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const classesToday = await Attendance.distinct('timetableId', { date: { $gte: todayStart } });

  // ── Daily attendance for the past 7 days ───────────────
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyData: { day: string; pct: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(); dayStart.setDate(dayStart.getDate() - i); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setHours(23, 59, 59, 999);
    const [dTotal, dPresent] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: dayStart, $lte: dayEnd } }),
      Attendance.countDocuments({ date: { $gte: dayStart, $lte: dayEnd }, status: 'present' }),
    ]);
    dailyData.push({ day: DAYS[dayStart.getDay()], pct: dTotal > 0 ? Math.round((dPresent / dTotal) * 100) : 0 });
  }

  // ── Department-wise stats ──────────────────────────────
  const classes = await Class.find({}).lean() as any[];
  const deptMap: Record<string, { total: number; present: number }> = {};
  for (const cls of classes) {
    const dept = cls.department || 'Unknown';
    const students = await Student.find({ classId: cls._id }).lean();
    const stuIds = students.map((s: any) => s._id);
    const [cTotal, cPresent] = await Promise.all([
      Attendance.countDocuments({ studentId: { $in: stuIds } }),
      Attendance.countDocuments({ studentId: { $in: stuIds }, status: 'present' }),
    ]);
    if (!deptMap[dept]) deptMap[dept] = { total: 0, present: 0 };
    deptMap[dept].total += cTotal;
    deptMap[dept].present += cPresent;
  }
  const deptData = Object.entries(deptMap).map(([dept, d]) => ({
    dept,
    total: d.total,
    present: d.present,
    pct: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
  }));

  // ── Subject-wise stats ─────────────────────────────────
  const slots = await Timetable.find({}).lean() as any[];
  const subjectMap: Record<string, { total: number; present: number; flagged: number }> = {};
  for (const slot of slots) {
    const sub = slot.subject || 'Unknown';
    const [sTotal, sPresent, sFlagged] = await Promise.all([
      Attendance.countDocuments({ timetableId: slot._id }),
      Attendance.countDocuments({ timetableId: slot._id, status: 'present' }),
      Attendance.countDocuments({ timetableId: slot._id, status: 'flagged' }),
    ]);
    if (!subjectMap[sub]) subjectMap[sub] = { total: 0, present: 0, flagged: 0 };
    subjectMap[sub].total += sTotal;
    subjectMap[sub].present += sPresent;
    subjectMap[sub].flagged += sFlagged;
  }
  const subjectData = Object.entries(subjectMap).map(([subject, d]) => ({
    subject,
    pct: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
    flagged: d.flagged,
  })).sort((a, b) => b.pct - a.pct);

  const stats = [
    { label: 'Overall Attendance', value: `${overallPct}%`, color: overallPct >= 80 ? 'var(--emerald)' : overallPct >= 65 ? 'var(--amber)' : 'var(--rose)' },
    { label: 'Students < 75%', value: belowThreshold.toString(), color: 'var(--rose)' },
    { label: 'Fraud Rate', value: `${fraudRate}%`, color: 'var(--amber)' },
    { label: 'Active Slots Today', value: classesToday.length.toString(), color: 'var(--accent-light)' },
  ];

  return (
    <div className="layout-with-sidebar">
      <Sidebar role="admin" userName={session.user.name || 'Admin'} />
      <div className="main-content animate-fade-in">
        <div className="page-header">
          <h1>Attendance Analytics</h1>
          <p>University-wide attendance insights — live data from database</p>
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
            <h3 style={{ marginBottom: '1.5rem' }}>Daily Attendance (Last 7 Days)</h3>
            {dailyData.every(d => d.pct === 0) ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No attendance data yet</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 140 }}>
                {dailyData.map(d => (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.pct}%</span>
                    <div style={{ width: '100%', height: `${Math.max(d.pct, 4)}%`, background: d.pct >= 85 ? 'linear-gradient(to top, var(--emerald), rgba(16,185,129,0.4))' : d.pct >= 75 ? 'linear-gradient(to top, var(--amber), rgba(245,158,11,0.4))' : 'linear-gradient(to top, var(--rose), rgba(244,63,94,0.4))', borderRadius: '4px 4px 0 0' }} />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.25rem' }}>Department-wise</h3>
            {deptData.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No department data yet</p>
            ) : (
              deptData.map(d => (
                <div key={d.dept} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 500 }}>{d.dept}</span>
                    <span style={{ fontWeight: 700, color: d.pct >= 85 ? 'var(--emerald)' : d.pct >= 75 ? 'var(--amber)' : 'var(--rose)' }}>{d.pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${d.pct}%`, background: d.pct >= 85 ? 'var(--emerald)' : d.pct >= 75 ? 'var(--amber)' : 'var(--rose)' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{d.present}/{d.total} records</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h3>Subject-wise Attendance</h3>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            {subjectData.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No subject data yet. Add timetable slots and mark attendance.</div>
            ) : (
              <table>
                <thead><tr><th>Subject</th><th>Attendance %</th><th>Fraud Flags</th><th>Status</th></tr></thead>
                <tbody>
                  {subjectData.map(s => (
                    <tr key={s.subject}>
                      <td style={{ fontWeight: 600 }}>{s.subject}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="progress-bar" style={{ width: 100 }}>
                            <div className="progress-fill" style={{ width: `${s.pct}%`, background: s.pct >= 85 ? 'var(--emerald)' : s.pct >= 75 ? 'var(--amber)' : 'var(--rose)' }} />
                          </div>
                          <span style={{ fontWeight: 700 }}>{s.pct}%</span>
                        </div>
                      </td>
                      <td><span className={`badge ${s.flagged > 3 ? 'badge-danger' : s.flagged > 0 ? 'badge-warning' : 'badge-success'}`}>{s.flagged} flags</span></td>
                      <td><span className={`badge ${s.pct >= 85 ? 'badge-success' : s.pct >= 75 ? 'badge-warning' : 'badge-danger'}`}>{s.pct >= 85 ? 'Excellent' : s.pct >= 75 ? 'Satisfactory' : 'Critical'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}