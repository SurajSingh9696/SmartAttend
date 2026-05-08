'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ClassSlot {
  id: string;
  subject: string;
  room: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'upcoming' | 'completed';
  windowOpen: boolean;
  alreadyMarked: boolean;
}

interface DashboardData {
  classes: ClassSlot[];
  stats: { total: number; present: number; absent: number; flagged: number; percentage: number };
  trustScore: number;
  studentId: string;
}

export default function StudentDashboard({ userName }: { userName: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/student/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Re-fetch every minute to catch window open/close
  useEffect(() => {
    const t = setInterval(() => {
      fetch('/api/student/dashboard').then(r => r.json()).then(setData).catch(console.error);
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const trustScore = data?.trustScore ?? 100;
  const trustClass = trustScore >= 80 ? '' : trustScore >= 50 ? 'medium' : 'low';
  const activeClass = data?.classes.find(c => c.status === 'active' && !c.alreadyMarked);

  if (loading) {
    return (
      <div className="main-content animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Good {now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : 'Evening'}, {userName.split(' ')[0]}</h1>
          <p>Here&apos;s your attendance overview for today</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-light)' }}>
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {activeClass && (
        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 'var(--radius-xl)', padding: '1.5rem 2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="live-dot" />
            <span className="badge badge-success">ACTIVE CLASS</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attendance window open</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{activeClass.subject}</h2>
          <p style={{ margin: 0 }}>Room {activeClass.room} · {activeClass.startTime} – {activeClass.endTime}</p>
          <Link href={`/student/attendance/${activeClass.id}`}>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Mark Attendance Now</button>
          </Link>
        </div>
      )}

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Lectures', value: data?.stats.total ?? 0, color: 'var(--accent-light)' },
          { label: 'Present', value: data?.stats.present ?? 0, color: 'var(--emerald)' },
          { label: 'Absent', value: data?.stats.absent ?? 0, color: 'var(--rose)' },
          { label: 'Attendance %', value: (data?.stats.percentage ?? 0) + '%', color: (data?.stats.percentage ?? 0) >= 75 ? 'var(--emerald)' : 'var(--rose)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Today&apos;s Schedule</h3>
          {!data?.classes.length ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No classes scheduled for today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.classes.map(cls => (
                <div key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: cls.status === 'active' ? 'rgba(99,102,241,0.08)' : 'var(--glass)', border: `1px solid ${cls.status === 'active' ? 'rgba(99,102,241,0.3)' : 'var(--glass-border)'}` }}>
                  <div style={{ width: 4, height: 48, borderRadius: 2, flexShrink: 0, background: cls.status === 'active' ? 'var(--accent)' : cls.status === 'completed' ? 'var(--emerald)' : 'var(--glass-border)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cls.subject}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Room {cls.room} · {cls.startTime} – {cls.endTime}</div>
                  </div>
                  <span className={`badge ${cls.alreadyMarked ? 'badge-success' : cls.status === 'active' ? 'badge-success' : 'badge-info'}`}>
                    {cls.alreadyMarked ? 'Done ✓' : cls.status === 'active' ? 'Live' : 'Upcoming'}
                  </span>
                  {cls.status === 'active' && !cls.alreadyMarked && (
                    <Link href={`/student/attendance/${cls.id}`} className="btn btn-primary btn-sm">Mark</Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Trust Score</div>
            <div className={`trust-score ${trustClass}`}>{trustScore}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>out of 100</div>
            <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
              <div className="progress-fill" style={{ width: `${trustScore}%`, background: trustScore >= 80 ? 'linear-gradient(90deg, var(--emerald), var(--cyan))' : trustScore >= 50 ? 'var(--amber)' : 'var(--rose)' }} />
            </div>
          </div>
          <div className="alert alert-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div style={{ fontSize: '0.82rem' }}>Attendance is marked automatically via the 7-step verification pipeline. Keep your device registered.</div>
          </div>
          <Link href="/student/history" className="btn btn-secondary" style={{ justifyContent: 'center' }}>View Full History</Link>
        </div>
      </div>
    </div>
  );
}