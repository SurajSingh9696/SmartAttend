'use client';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

type TabType = 'students' | 'teachers';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export default function UsersManager() {
  const [tab, setTab] = useState<TabType>('students');
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('User deleted');
        fetchUsers();
      } else {
        toast.error('Failed to delete user');
      }
    } catch (e) {
      toast.error('Error deleting user');
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data.map((row: any) => ({
            ...row,
            role: tab === 'students' ? 'student' : 'teacher'
          }));

          const res = await fetch('/api/admin/bulk-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows })
          });

          const data = await res.json();
          if (res.ok) {
            toast.success(`Imported ${data.created} accounts. Skipped ${data.skipped}.`);
            if (data.errors?.length > 0) {
              toast.error(`Errors: ${data.errors.length}`);
              console.error(data.errors);
            }
            fetchUsers();
          } else {
            toast.error(data.error || 'Upload failed');
          }
        } catch (err) {
          toast.error('Upload error');
        } finally {
          setUploading(false);
          if (fileRef.current) fileRef.current.value = '';
        }
      },
      error: () => {
        toast.error('Failed to parse CSV file');
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    });
  }

  const filtered = users.filter(u =>
    (tab === 'students' ? u.role === 'student' : u.role === 'teacher') &&
    (u.name.toLowerCase().includes(search.toLowerCase()) ||
     u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="main-content animate-fade-in">
      <div className="page-header">
        <h1>👥 User Management</h1>
        <p>Bulk import students and teachers via CSV upload</p>
      </div>

      {/* Upload Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>📥 Bulk CSV Upload</h3>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {(['students', 'teachers'] as TabType[]).map(t => (
            <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>
              {t === 'students' ? '🎓 Students CSV' : '👨‍🏫 Teachers CSV'}
            </button>
          ))}
        </div>

        <div style={{
          border: '2px dashed var(--glass-border)', borderRadius: 'var(--radius-lg)',
          padding: '2.5rem', textAlign: 'center', cursor: uploading ? 'wait' : 'pointer',
          transition: 'var(--transition)', marginBottom: '1rem',
          opacity: uploading ? 0.6 : 1
        }}
          onClick={() => !uploading && fileRef.current?.click()}
          onMouseEnter={e => (!uploading && (e.currentTarget.style.borderColor = 'var(--accent)'))}
          onMouseLeave={e => (!uploading && (e.currentTarget.style.borderColor = 'var(--glass-border)'))}>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
            {uploading ? 'Processing...' : `Drop your ${tab === 'students' ? 'students' : 'teachers'} CSV here`}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>or click to browse</div>
        </div>

        <div className="alert alert-info">
          <span>📋</span>
          <div>
            <strong>Required columns:</strong>{' '}
            {tab === 'students'
              ? 'name, rollNo, email, classId, department, semester'
              : 'name, email, department, employeeId'}
            <br />Auto-generates: login credentials (demo123), trust score (100)
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3>{tab === 'students' ? 'Student' : 'Teacher'} Directory ({filtered.length})</h3>
          <input className="input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
        </div>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><span className="spinner" /> Loading users...</div>
          ) : (
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
