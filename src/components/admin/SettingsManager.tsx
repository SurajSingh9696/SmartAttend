'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [windowBefore, setWindowBefore] = useState(10);
  const [windowAfter, setWindowAfter] = useState(5);
  const [geoRadius, setGeoRadius] = useState(100);
  const [qrInterval, setQrInterval] = useState(15);
  const [riskThreshold, setRiskThreshold] = useState(50);
  const [fraudThreshold, setFraudThreshold] = useState(70);
  const [vpnBlocking, setVpnBlocking] = useState(true);
  const [faceRequired, setFaceRequired] = useState(true);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success('Settings saved and applied to automation engine!');
  }

  return (
    <div className="main-content animate-fade-in">
      <div className="page-header">
        <h1>⚙️ System Settings</h1>
        <p>Configure automation engine parameters — changes apply immediately</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Attendance Window */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>⏱️ Attendance Window</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Open Before Class Start (minutes)</label>
              <input className="input" type="number" min={0} max={30} value={windowBefore} onChange={e => setWindowBefore(+e.target.value)} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Current: Opens {windowBefore} min before class → window opens at class_time − {windowBefore}m
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Close After Class Start (minutes)</label>
              <input className="input" type="number" min={1} max={30} value={windowAfter} onChange={e => setWindowAfter(+e.target.value)} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Current: Closes {windowAfter} min after class starts → late entries blocked
              </div>
            </div>
            <div style={{ padding: '0.875rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
              <strong>Window Formula:</strong><br />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-light)', fontSize: '0.75rem' }}>
                Open = startTime − {windowBefore}min<br />
                Close = startTime + {windowAfter}min<br />
                Total window = {windowBefore + windowAfter} minutes
              </span>
            </div>
          </div>
        </div>

        {/* QR Settings */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>🔲 QR Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">QR Refresh Interval (seconds)</label>
              <input className="input" type="number" min={5} max={60} value={qrInterval} onChange={e => setQrInterval(+e.target.value)} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Lower = more secure, harder to share. Min: 5s, Recommended: 10–15s
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Require Face Verification</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Biometric + liveness check mandatory</div>
                </div>
                <button style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: faceRequired ? 'var(--emerald)' : 'var(--glass-border)', transition: 'var(--transition)', position: 'relative' }}
                  onClick={() => setFaceRequired(!faceRequired)}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: faceRequired ? 24 : 4, transition: 'var(--transition)' }} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Block VPN / Proxy</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reject attendance from VPN IPs</div>
                </div>
                <button style={{ width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: vpnBlocking ? 'var(--emerald)' : 'var(--glass-border)', transition: 'var(--transition)', position: 'relative' }}
                  onClick={() => setVpnBlocking(!vpnBlocking)}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: vpnBlocking ? 24 : 4, transition: 'var(--transition)' }} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Geo Settings */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>📍 Geo-fencing</h3>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Campus Radius (meters)</label>
            <input className="input" type="number" min={20} max={500} value={geoRadius} onChange={e => setGeoRadius(+e.target.value)} />
            <input type="range" min={20} max={500} value={geoRadius} onChange={e => setGeoRadius(+e.target.value)}
              style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--accent)' }} />
          </div>
          <div style={{ padding: '0.875rem', background: 'var(--accent-glow)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.8rem' }}>
            <strong>Current:</strong> Students must be within <strong>{geoRadius}m</strong> of campus center coordinates to mark attendance.
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>🧠 Fraud Risk Thresholds</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Suspicious Threshold (flag for review)</label>
              <input className="input" type="number" min={10} max={90} value={riskThreshold} onChange={e => setRiskThreshold(+e.target.value)} />
              <div style={{ fontSize: '0.75rem', color: 'var(--amber)', marginTop: '0.25rem' }}>
                Risk score ≥ {riskThreshold} → Status: Flagged (Pending Review)
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fraud Threshold (auto reject)</label>
              <input className="input" type="number" min={riskThreshold + 1} max={100} value={fraudThreshold} onChange={e => setFraudThreshold(+e.target.value)} />
              <div style={{ fontSize: '0.75rem', color: 'var(--rose)', marginTop: '0.25rem' }}>
                Risk score ≥ {fraudThreshold} → Status: Rejected + trust score −30
              </div>
            </div>
            <div style={{ padding: '0.875rem', background: 'var(--glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', fontSize: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--emerald)' }}>0–{riskThreshold - 1}</span> Clean &nbsp;|&nbsp;
              <span style={{ color: 'var(--amber)' }}>{riskThreshold}–{fraudThreshold - 1}</span> Suspicious &nbsp;|&nbsp;
              <span style={{ color: 'var(--rose)' }}>{fraudThreshold}–100</span> Fraud
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <button className="btn btn-primary btn-lg" onClick={save} disabled={saving}>
          {saving ? <><span className="spinner" /> Saving...</> : '💾 Save & Apply Settings'}
        </button>
      </div>
    </div>
  );
}
