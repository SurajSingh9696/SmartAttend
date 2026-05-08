import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';

const FRAUD_FLAGS = [
  { id: 1, student: 'Rohan Gupta', rollNo: 'CSE2303', class: 'DBMS - CSE-A', date: 'Apr 22, 2026', time: '09:02 AM', reason: 'Suspicious GPS cluster — 12 students at identical coordinates', risk: 72, device: 'Chrome/Android', ip: '192.168.1.45', status: 'pending' },
  { id: 2, student: 'Karan Singh', rollNo: 'CSE2305', class: 'DBMS - CSE-A', date: 'Apr 22, 2026', time: '09:03 AM', reason: 'Non-campus IP: 103.55.12.8 — possible VPN', risk: 55, device: 'Safari/iOS', ip: '103.55.12.8', status: 'pending' },
  { id: 3, student: 'Meera Das', rollNo: 'ECE2201', class: 'OS - CSE-B', date: 'Apr 22, 2026', time: '10:01 AM', reason: 'Device shared: same fingerprint as Ankit Roy (ECE2202)', risk: 88, device: 'Chrome/Windows', ip: '192.168.2.11', status: 'pending' },
  { id: 4, student: 'Ankit Roy', rollNo: 'ECE2202', class: 'OS - CSE-B', date: 'Apr 22, 2026', time: '10:01 AM', reason: 'Device shared: same fingerprint as Meera Das (ECE2201)', risk: 88, device: 'Chrome/Windows', ip: '192.168.2.11', status: 'pending' },
  { id: 5, student: 'Divya Nair', rollNo: 'CSE2310', class: 'Networks - CSE-A', date: 'Apr 21, 2026', time: '11:00 AM', reason: 'Submission in 2 seconds — too fast', risk: 45, device: 'Firefox/Windows', ip: '192.168.1.72', status: 'resolved' },
];

export default async function FraudPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect('/');
  const pending = FRAUD_FLAGS.filter(f => f.status === 'pending');

  return (
    <div className="layout-with-sidebar">
      <Sidebar role="admin" userName={session.user.name || 'Admin'} />
      <div className="main-content animate-fade-in">
        <div className="page-header">
          <h1>Fraud Dashboard</h1>
          <p>All flagged attendance attempts with detailed analysis</p>
        </div>

        <div className="grid-4" style={{ marginBottom: '2rem' }}>
          {[
            { label: 'Total Flags Today', value: FRAUD_FLAGS.length, color: 'var(--rose)' },
            { label: 'Pending Review', value: pending.length, color: 'var(--amber)' },
            { label: 'Resolved', value: FRAUD_FLAGS.length - pending.length, color: 'var(--emerald)' },
            { label: 'Avg Risk Score', value: Math.round(FRAUD_FLAGS.reduce((a, f) => a + f.risk, 0) / FRAUD_FLAGS.length), color: 'var(--accent-light)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {FRAUD_FLAGS.map(f => (
          <div key={f.id} className="card" style={{ marginBottom: '1rem', borderColor: f.status === 'pending' ? (f.risk >= 70 ? 'rgba(244,63,94,0.4)' : 'rgba(245,158,11,0.4)') : 'var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{f.student}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.rollNo}</span>
                  <span className={`badge ${f.risk >= 70 ? 'badge-danger' : 'badge-warning'}`}>Risk: {f.risk}/100</span>
                  <span className={`badge ${f.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>{f.status}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--rose)', marginBottom: '0.5rem', fontWeight: 500 }}>{f.reason}</div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>{f.class}</span>
                  <span>{f.date} at {f.time}</span>
                  <span>{f.device}</span>
                  <span>IP: {f.ip}</span>
                </div>
              </div>
              {f.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-success btn-sm">Approve</button>
                  <button className="btn btn-danger btn-sm">Reject</button>
                </div>
              )}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>Risk level</span>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${f.risk}%`, background: f.risk >= 70 ? 'var(--rose)' : f.risk >= 40 ? 'var(--amber)' : 'var(--emerald)' }} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: f.risk >= 70 ? 'var(--rose)' : f.risk >= 40 ? 'var(--amber)' : 'var(--emerald)' }}>{f.risk}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}