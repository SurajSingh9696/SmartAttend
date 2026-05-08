'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface LiveEntry {
  id: string;
  name: string;
  rollNo: string;
  time: string;
  status: 'present' | 'flagged' | 'rejected' | 'absent';
  riskScore: number;
  reason?: string;
}

interface SlotInfo {
  subject: string;
  room: string;
  startTime: string;
  endTime: string;
  className: string;
  totalStudents: number;
  attendanceWindowOpen: boolean;
}

export default function LiveClassView({ classId }: { classId: string }) {
  const router = useRouter();
  const [feed, setFeed] = useState<LiveEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);

  // Fetch slot info (subject, class name, total enrolled)
  useEffect(() => {
    fetch(`/api/timetable/${classId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.slot) setSlotInfo(data.slot); })
      .catch(console.error);
  }, [classId]);

  // Polling for live feed every 3 seconds
  useEffect(() => {
    fetchFeed();
    const t = setInterval(fetchFeed, 3000);
    return () => clearInterval(t);
  }, [classId]);

  async function fetchFeed() {
    try {
      const res = await fetch(`/api/teacher/live-feed?timetableId=${classId}`);
      if (!res.ok) return;
      const data = await res.json();
      setFeed(data.feed || []);
    } catch (e) {
      console.error('Failed to fetch live feed');
    }
  }

  const displayed = filter === 'flagged' ? feed.filter(e => e.status === 'flagged') : feed;
  const present = feed.filter(e => e.status === 'present').length;
  const flagged = feed.filter(e => e.status === 'flagged').length;
  // Use real total from DB; fall back to present+flagged if slot info not loaded yet
  const total = slotInfo?.totalStudents ?? (present + flagged);

  async function handleAction(id: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch('/api/teacher/attendance-action', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId: id, action })
      });
      if (res.ok) {
        toast.success(`Attendance ${action}d`);
        fetchFeed(); // Refresh immediately
      } else {
        toast.error('Action failed');
      }
    } catch (e) {
      toast.error('Network error');
    }
  }

  return (
    <div className="main-content animate-fade-in">
      <div className="page-header">
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
          ← Back to Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1>Live Attendance Feed</h1>
            {slotInfo && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                {slotInfo.subject} · {slotInfo.className} · Room {slotInfo.room} · {slotInfo.startTime}–{slotInfo.endTime}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="live-dot" />
            <span className="badge badge-success">LIVE</span>
          </div>
        </div>
        <p style={{ marginTop: '0.25rem', fontSize: '0.8rem' }}>Monitoring feed auto-updates every 3 seconds</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Enrolled', value: total, color: 'var(--accent-light)', icon: '👥' },
          { label: 'Present', value: present, color: 'var(--emerald)', icon: '✅' },
          { label: 'Absent', value: Math.max(0, total - present - flagged), color: 'var(--text-muted)', icon: '—' },
          { label: 'Flagged', value: flagged, color: 'var(--amber)', icon: '⚠️' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Attendance Progress</span>
            <span>{Math.round((present / total) * 100)}% ({present}/{total})</span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-fill" style={{ width: `${(present / total) * 100}%`, background: 'linear-gradient(90deg, var(--emerald), var(--cyan))' }} />
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3>Live Attendance Feed</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button id="live-filter-all" className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>All ({feed.length})</button>
            <button id="live-filter-flagged" className={`btn btn-sm ${filter === 'flagged' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('flagged')}>⚠ Flagged ({flagged})</button>
          </div>
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {feed.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No attendances marked yet.</div>
          ) : (
            <table>
              <thead>
                <tr><th>Student</th><th>Roll No</th><th>Time</th><th>Status</th><th>Risk Score</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {displayed.map(e => (
                  <tr key={e.id} style={{ animation: 'fade-in 0.3s ease' }}>
                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.rollNo}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>{e.time}</td>
                    <td>
                      <div>
                        <span className={`badge ${e.status === 'present' ? 'badge-success' : e.status === 'flagged' ? 'badge-warning' : 'badge-danger'}`}>
                          {e.status}
                        </span>
                        {e.reason && <div style={{ fontSize: '0.72rem', color: 'var(--amber)', marginTop: 3 }}>{e.reason}</div>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar" style={{ width: 60 }}>
                          <div className="progress-fill" style={{ width: `${e.riskScore}%`, background: e.riskScore < 30 ? 'var(--emerald)' : e.riskScore < 60 ? 'var(--amber)' : 'var(--rose)' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.riskScore}</span>
                      </div>
                    </td>
                    <td>
                      {e.status === 'flagged' && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-success btn-sm" onClick={() => handleAction(e.id, 'approve')}>✓ Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(e.id, 'reject')}>✗ Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
