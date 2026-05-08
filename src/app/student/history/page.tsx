import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import { connectDB } from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import Timetable from '@/models/Timetable';

const STATUS_COLOR: Record<string, string> = {
  present: 'badge-success', absent: 'badge-danger',
  flagged: 'badge-warning', rejected: 'badge-danger',
};

export default async function HistoryPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'student') redirect('/');

  await connectDB();

  const student = await Student.findOne({ userId: session.user.id }).lean() as any;
  if (!student) {
    return (
      <div className="layout-with-sidebar">
        <Sidebar role="student" userName={session.user.name || 'Student'} />
        <div className="main-content animate-fade-in">
          <div className="page-header"><h1>My Attendance</h1></div>
          <div className="alert alert-warning">Student profile not found. Please contact admin.</div>
        </div>
      </div>
    );
  }

  const records = await Attendance.find({ studentId: student._id })
    .sort({ date: -1, timestamp: -1 })
    .lean() as any[];

  // Enrich with subject names
  const timetableIds = [...new Set(records.map((r: any) => r.timetableId?.toString()))].filter(Boolean);
  const slots = await Timetable.find({ _id: { $in: timetableIds } }).select('subject').lean() as any[];
  const slotMap: Record<string, string> = {};
  slots.forEach((s: any) => { slotMap[s._id.toString()] = s.subject; });

  const history = records.map((r: any) => ({
    date: new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    subject: slotMap[r.timetableId?.toString()] || 'Unknown Subject',
    time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-',
    status: r.status as string,
    riskScore: r.riskScore ?? 0,
    flagReason: r.flagReason || null,
  }));

  const total = history.length;
  const present = history.filter(h => h.status === 'present').length;
  const absent = history.filter(h => h.status === 'absent').length;
  const flagged = history.filter(h => h.status === 'flagged').length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="layout-with-sidebar">
      <Sidebar role="student" userName={session.user.name || 'Student'} />
      <div className="main-content animate-fade-in">
        <div className="page-header">
          <h1>My Attendance</h1>
          <p>Complete attendance history with verification details</p>
        </div>

        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Total Lectures', value: total, color: 'var(--accent-light)' },
            { label: 'Present', value: present, color: 'var(--emerald)' },
            { label: 'Absent', value: absent, color: 'var(--rose)' },
            { label: 'Attendance %', value: pct + '%', color: pct >= 75 ? 'var(--emerald)' : 'var(--rose)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {pct < 75 && total > 0 && (
          <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
            ⚠️ Your attendance is below 75%. You need {Math.ceil((0.75 * total - present) / 0.25)} more classes to meet the requirement.
          </div>
        )}

        {flagged > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            🚨 You have {flagged} flagged attendance record{flagged > 1 ? 's' : ''} under review. Contact admin if you believe this is an error.
          </div>
        )}

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
            <h3>{total === 0 ? 'No attendance records yet' : `Attendance Log (${total} records)`}</h3>
          </div>
          {total === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No attendance records found. Attend your first class to see data here.
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Subject</th><th>Check-in Time</th><th>Status</th><th>Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-secondary)' }}>{h.date}</td>
                      <td style={{ fontWeight: 600 }}>{h.subject}</td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>{h.time}</td>
                      <td>
                        <span className={`badge ${STATUS_COLOR[h.status] || 'badge-info'}`}>
                          {h.status.charAt(0).toUpperCase() + h.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className="progress-fill" style={{ width: `${h.riskScore}%`, background: h.riskScore < 30 ? 'var(--emerald)' : h.riskScore < 60 ? 'var(--amber)' : 'var(--rose)' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.riskScore}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}