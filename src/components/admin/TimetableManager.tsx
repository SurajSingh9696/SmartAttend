'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

const SUBJECT_COLORS: Record<string, string> = {
  'DBMS': 'rgba(99,102,241,0.25)',
  'OS': 'rgba(34,211,238,0.2)',
  'Networks': 'rgba(16,185,129,0.2)',
  'Software Eng': 'rgba(245,158,11,0.2)',
  'DBMS Lab': 'rgba(139,92,246,0.25)',
};

interface SlotData {
  _id: string;
  subject: string;
  teacherId: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherName?: string;
}

export default function TimetableManager() {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [timetable, setTimetable] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '', teacherId: '', room: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:00'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchTimetable(selectedClass);
  }, [selectedClass]);

  async function fetchInitialData() {
    try {
      const [clsRes, usersRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/admin/users')
      ]);
      const clsData = await clsRes.json();
      const usersData = await usersRes.json();
      
      setClasses(clsData.classes || []);
      setTeachers(usersData.users?.filter((u: any) => u.role === 'teacher') || []);
      
      if (clsData.classes?.length > 0) {
        setSelectedClass(clsData.classes[0]._id);
      }
    } catch (e) {
      toast.error('Failed to load initial data');
    }
  }

  async function fetchTimetable(classId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/timetable?classId=${classId}`);
      const data = await res.json();
      setTimetable(data.slots || []);
    } catch (e) {
      toast.error('Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClass) return toast.error('Please select a class first');
    setSubmitting(true);
    try {
      const payload = { ...formData, classId: selectedClass, isActive: true };
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Slot added!');
        setShowModal(false);
        fetchTimetable(selectedClass);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add slot');
      }
    } catch (e) {
      toast.error('Error adding slot');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteSlot(id: string) {
    if (!confirm('Delete this slot?')) return;
    try {
      const res = await fetch(`/api/timetable/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Slot deleted');
        fetchTimetable(selectedClass);
      } else {
        toast.error('Failed to delete slot');
      }
    } catch (e) {
      toast.error('Error deleting slot');
    }
  }

  // Transform flat timetable array into a grid map: map[day][startTime] = slot
  const gridMap: Record<number, Record<string, SlotData>> = {};
  timetable.forEach(slot => {
    if (!gridMap[slot.dayOfWeek]) gridMap[slot.dayOfWeek] = {};
    const teacher = teachers.find(t => String(t._id) === String(slot.teacherId));
    gridMap[slot.dayOfWeek][slot.startTime] = { ...slot, teacherName: teacher?.name || 'Unknown' };
  });

  // Start with Monday (1) to Saturday (6)
  const displayDays = [1, 2, 3, 4, 5, 6];

  return (
    <div className="main-content animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>🕒 Timetable Management</h1>
          <p>Visual timetable — drives the entire attendance automation engine</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select className="select" style={{ width: 'auto' }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Slot</button>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        <span>⚡</span>
        <div>Timetable changes take effect <strong>immediately</strong>. The cron scheduler reads this table every minute to open/close attendance windows automatically.</div>
      </div>

      {/* Grid */}
      <div className="card" style={{ padding: 0, overflowX: 'auto', opacity: loading ? 0.6 : 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: 'rgba(99,102,241,0.08)' }}>
              <th style={{ padding: '0.875rem 1rem', width: 80, textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</th>
              {displayDays.map(d => (
                <th key={d} style={{ padding: '0.875rem 1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{DAYS[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIMES.map(time => (
              <tr key={time}>
                <td style={{ padding: '0.625rem 1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)' }}>{time}</td>
                {displayDays.map(day => {
                  const slot = gridMap[day]?.[time];
                  return (
                    <td key={day} style={{ padding: '0.375rem 0.5rem', borderTop: '1px solid var(--glass-border)', verticalAlign: 'top' }}>
                      {slot ? (
                        <div style={{
                          background: SUBJECT_COLORS[slot.subject] || 'var(--glass)',
                          borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.5rem',
                          cursor: 'pointer', transition: 'var(--transition)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          position: 'relative'
                        }} onClick={() => handleDeleteSlot(slot._id)}>
                          <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>{slot.subject}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>{slot.teacherName}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{slot.room}</div>
                          <div style={{ position: 'absolute', top: 2, right: 4, fontSize: '0.6rem', color: 'var(--rose)', opacity: 0.6 }}>✖</div>
                        </div>
                      ) : (
                        <div style={{
                          height: 54, borderRadius: 'var(--radius-sm)', border: '1px dashed var(--glass-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', opacity: 0.4, fontSize: '1rem',
                          transition: 'var(--transition)',
                        }} onClick={() => { setFormData({ ...formData, dayOfWeek: day, startTime: time, endTime: `${parseInt(time) + 1}:00`.padStart(5, '0') }); setShowModal(true); }}>+</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Add Timetable Slot</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Subject Name</label>
                <input className="input" required placeholder="e.g. DBMS" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Teacher</label>
                <select className="select" required value={formData.teacherId} onChange={e => setFormData({ ...formData, teacherId: e.target.value })}>
                  <option value="">-- Select Teacher --</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Room</label>
                <input className="input" required placeholder="e.g. Lab-3" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Day</label>
                  <select className="select" value={formData.dayOfWeek} onChange={e => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Time</label>
                  <select className="select" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value, endTime: `${parseInt(e.target.value) + 1}:00`.padStart(5, '0') })}>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '0.5rem' }}>
                {submitting ? 'Saving...' : 'Save Slot'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
