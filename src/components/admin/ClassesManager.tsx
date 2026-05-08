'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ClassData {
  _id: string;
  name: string;
  department: string;
  semester: number;
  students: string[];
  teachers: string[];
  totalStudents: number;
}

export default function ClassesManager() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', department: '', semester: 1 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    setLoading(true);
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (e) {
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Class created successfully');
        setShowModal(false);
        setFormData({ name: '', department: '', semester: 1 });
        fetchClasses();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create class');
      }
    } catch (e) {
      toast.error('Error creating class');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this class? This will also delete all its timetable slots!')) return;
    try {
      const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Class deleted');
        fetchClasses();
      } else {
        toast.error('Failed to delete class');
      }
    } catch (e) {
      toast.error('Error deleting class');
    }
  }

  return (
    <div className="main-content animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Class Management</h1>
          <p>Create and manage class sections, assign students and teachers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Class</button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" /> Loading classes...</div>
      ) : classes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏫</div>
          <h3>No classes found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Get started by creating your first class section.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>+ Create Class</button>
        </div>
      ) : (
        <div className="grid-2">
          {classes.map(cls => (
            <div key={cls._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{cls.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{cls.department} · Semester {cls.semester}</p>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cls._id)}>Delete</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-light)' }}>{cls.totalStudents || cls.students?.length || 0}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Students</div>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--cyan)' }}>{cls.teachers?.length || 0}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Teachers</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href="/admin/timetable" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Timetable</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Create New Class</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Class Name (e.g., CSE-A)</label>
                <input className="input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Department</label>
                <input className="input" required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Semester</label>
                <input className="input" type="number" min="1" max="10" required value={formData.semester} onChange={e => setFormData({ ...formData, semester: Number(e.target.value) })} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '0.5rem' }}>
                {submitting ? 'Creating...' : 'Create Class'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
