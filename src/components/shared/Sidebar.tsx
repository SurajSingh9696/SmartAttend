'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import ThemeToggle from '@/components/shared/ThemeToggle';

interface NavItem { href: string; label: string; section?: string; icon: React.ReactNode; }

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={size} height={size} style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const studentNav: NavItem[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { href: '/student/history', label: 'My Attendance', icon: <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /> },
];
const teacherNav: NavItem[] = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { href: '/teacher/reports', label: 'Reports', icon: <Icon d="M18 20V10M12 20V4M6 20v-6" /> },
];
const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', section: 'Overview', icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { href: '/admin/users', label: 'Users', section: 'Management', icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /> },
  { href: '/admin/classes', label: 'Classes', icon: <Icon d="M22 10v6M2 10l10-5 10 5-10 5z" /> },
  { href: '/admin/timetable', label: 'Timetable', icon: <Icon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /> },
  { href: '/admin/analytics', label: 'Analytics', section: 'Insights', icon: <Icon d="M18 20V10M12 20V4M6 20v-6" /> },
  { href: '/admin/fraud', label: 'Fraud Dashboard', icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
  { href: '/admin/settings', label: 'Settings', icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0v3m0-9V3m9 9h-3M3 12h3" /> },
];
const superadminNav: NavItem[] = [
  { href: '/superadmin/dashboard', label: 'Dashboard', section: 'Global Overview', icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { href: '/superadmin/colleges', label: 'Colleges', section: 'Institutions', icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /> },
];

interface SidebarProps { role: string; userName: string; }

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'superadmin' ? superadminNav : role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav;
  const roleBadge = role === 'superadmin' ? 'badge-danger' : role === 'admin' ? 'badge-danger' : role === 'teacher' ? 'badge-info' : 'badge-success';
  const roleLabel = role === 'superadmin' ? 'Superadmin' : role === 'admin' ? 'College' : role === 'teacher' ? 'Teacher' : 'Student';
  let lastSection = '';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <img src="/logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>SmartAttend</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Attendance System</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '1rem 1.5rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-glow)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
            {userName?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <span className={`badge ${roleBadge}`} style={{ marginTop: 2 }}>{roleLabel}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <div key={item.href}>
              {showSection && <div className="nav-section">{item.section}</div>}
              <Link href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                {item.icon}
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          id="sidebar-signout-btn"
          className="nav-item"
          style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--rose)' }}
          onClick={() => signOut({ callbackUrl: `${window.location.origin}/` })}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          Sign Out
        </button>
        <ThemeToggle size="sm" />
      </div>
    </aside>
  );
}