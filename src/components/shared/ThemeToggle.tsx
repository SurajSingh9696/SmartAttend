'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sa-theme';

export default function ThemeToggle({ size = 'default' }: { size?: 'default' | 'sm' }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  // On mount: read saved preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as 'dark' | 'light' | null;
    const preferred = saved ?? 'dark';
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  // Avoid rendering wrong icon before hydration
  if (!mounted) return null;

  const isLight = theme === 'light';
  const btnSize = size === 'sm' ? 28 : 34;
  const iconSize = size === 'sm' ? 14 : 16;

  return (
    <button
      id="theme-toggle-btn"
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      onClick={toggle}
      style={{
        width: btnSize,
        height: btnSize,
        borderRadius: '50%',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass)',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-card-hover)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
      }}
    >
      {isLight ? (
        /* Moon icon — switch to dark */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={iconSize} height={iconSize}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        /* Sun icon — switch to light */
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={iconSize} height={iconSize}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}
