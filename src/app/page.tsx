import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.warn('[page] Auth session error (likely old cookie)', err);
  }

  if (session) {
    const r = session.user.role;
    if (r === "superadmin") redirect("/superadmin/dashboard");
    if (r === "admin") redirect("/admin/dashboard");
    if (r === "teacher") redirect("/teacher/dashboard");
    redirect("/student/dashboard");
  }

  return (
    <main className="landing-root">
      {/* Background layers */}
      <div className="landing-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />

      {/* ── Navigation ───────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="nav-brand">
            <div className="logo-icon" style={{ background: 'transparent', padding: 0 }}>
              <img src="/logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="logo-text">SmartAttend</span>
          </div>
          <div className="nav-links-center">
            <a href="#features" className="nav-link">Features</a>
            <a href="#portals" className="nav-link">Portals</a>
            <a href="#workflow" className="nav-link">Workflow</a>
            <a href="#tech" className="nav-link">Technology</a>
          </div>
          <div className="nav-actions">
            <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/register" className="btn btn-primary btn-sm">Get Started →</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="live-dot" />
          AI-Powered &nbsp;·&nbsp; Fraud-Resistant &nbsp;·&nbsp; Fully Automated
        </div>

        <h1 className="hero-title">
          The Future of<br />
          <span className="gradient-text">Smart Attendance</span>
        </h1>

        <p className="hero-desc">
          Seven-layer biometric verification with device fingerprinting, GPS validation,
          dynamic QR codes, and real-time fraud detection — all orchestrated automatically.
        </p>

        <div className="hero-cta-group">
          <Link href="/login" className="btn btn-primary btn-lg hero-cta-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Launch Portal
          </Link>
          <a href="#features" className="btn btn-ghost btn-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            See How It Works
          </a>
        </div>

        {/* Stats */}
        <div className="hero-stats-strip">
          {[
            { value: "7", label: "Security Layers", icon: "🛡️" },
            { value: "15s", label: "QR Refresh Rate", icon: "🔄" },
            { value: "100m", label: "Geo-fence Radius", icon: "📍" },
            { value: "0%", label: "Manual Effort", icon: "⚡" },
            { value: "99.9%", label: "Detection Accuracy", icon: "🎯" },
          ].map((s) => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-icon">{s.icon}</div>
              <div className="hero-stat-value">{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trusted By ───────────────────────── */}
      <section className="trusted-section">
        <div className="container">
          <p className="trusted-label">Built for modern academic institutions</p>
          <div className="trusted-logos">
            {["University System", "Engineering College", "Medical Academy", "Tech Institute", "Business School"].map((name) => (
              <div key={name} className="trusted-logo-chip">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security Pipeline ────────────────── */}
      <section id="features" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Verification Engine</span>
            <h2>7-Layer Security Pipeline</h2>
            <p>Every attendance request passes through all layers before being accepted. No shortcuts, no workarounds.</p>
          </div>

          <div className="pipeline-grid-v2">
            {[
              {
                n: "01", title: "Device Binding", icon: "💻",
                desc: "Unique device ID + browser fingerprint registered on first login. Cannot be shared or spoofed.",
                color: "var(--accent)", glow: "var(--accent-glow)"
              },
              {
                n: "02", title: "Time Window", icon: "⏱️",
                desc: "Window opens 10 min before class, closes 5 min after start. Automated via cron scheduler.",
                color: "var(--cyan)", glow: "var(--cyan-glow)"
              },
              {
                n: "03", title: "GPS Verification", icon: "📍",
                desc: "Student GPS must be within 100m of campus coordinates. Location spoofers are detected instantly.",
                color: "var(--emerald)", glow: "var(--emerald-glow)"
              },
              {
                n: "04", title: "Network Check", icon: "🌐",
                desc: "Campus IP range verified. VPN and proxy detection active on every single attendance request.",
                color: "var(--amber)", glow: "var(--amber-glow)"
              },
              {
                n: "05", title: "Dynamic QR", icon: "🔐",
                desc: "HMAC-signed token rotates every 15 seconds. Replay attacks are blocked at the server level.",
                color: "var(--violet)", glow: "rgba(139,92,246,0.3)"
              },
              {
                n: "06", title: "Face + Liveness", icon: "👁️",
                desc: "Biometric face match with blink and head-movement liveness detection via face-api.js.",
                color: "var(--rose)", glow: "var(--rose-glow)"
              },
              {
                n: "07", title: "Fraud Analysis", icon: "🧠",
                desc: "Risk scoring engine. GPS clusters, device sharing, and fast submissions flagged instantly.",
                color: "var(--cyan)", glow: "var(--cyan-glow)"
              },
            ].map((s, i) => (
              <div key={s.n} className="pipeline-card-v2" style={{ "--card-color": s.color, "--card-glow": s.glow, animationDelay: `${i * 0.08}s` } as React.CSSProperties}>
                <div className="pipeline-card-header">
                  <span className="pipeline-num-v2">{s.n}</span>
                  <span className="pipeline-icon-v2">{s.icon}</span>
                </div>
                <div className="pipeline-connector" />
                <h4 className="pipeline-title-v2">{s.title}</h4>
                <p className="pipeline-desc-v2">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portals ──────────────────────────── */}
      <section id="portals" className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Three Portals</span>
            <h2>Built for Every Role</h2>
            <p>One unified platform with three purpose-built, role-specific experiences.</p>
          </div>

          <div className="portals-grid-v2">
            {[
              {
                role: "Student",
                emoji: "🎓",
                color: "var(--accent)",
                glow: "rgba(99,102,241,0.15)",
                border: "rgba(99,102,241,0.3)",
                tagline: "Your attendance, your trust score.",
                features: [
                  { icon: "📅", text: "View today's schedule" },
                  { icon: "🔐", text: "7-step verification pipeline" },
                  { icon: "📷", text: "Live QR code scanner" },
                  { icon: "🏅", text: "Trust score tracker" },
                  { icon: "📊", text: "Full attendance history" },
                ],
              },
              {
                role: "Teacher",
                emoji: "👨‍🏫",
                color: "var(--cyan)",
                glow: "rgba(34,211,238,0.15)",
                border: "rgba(34,211,238,0.3)",
                tagline: "Monitor live, review flags.",
                features: [
                  { icon: "📡", text: "Live class monitoring" },
                  { icon: "🔴", text: "Real-time attendance feed" },
                  { icon: "⚠️", text: "Flag review & override" },
                  { icon: "📈", text: "Subject-wise reports" },
                  { icon: "🤖", text: "Fully automated — no manual work" },
                ],
              },
              {
                role: "College",
                emoji: "🏢",
                color: "var(--violet)",
                glow: "rgba(139,92,246,0.15)",
                border: "rgba(139,92,246,0.3)",
                tagline: "Full platform control.",
                features: [
                  { icon: "📥", text: "Bulk CSV student import" },
                  { icon: "🗓️", text: "Visual timetable builder" },
                  { icon: "🚨", text: "Fraud detection dashboard" },
                  { icon: "📊", text: "Platform-wide analytics" },
                  { icon: "⚙️", text: "Verification engine config" },
                ],
              },
            ].map((p) => (
              <div
                key={p.role}
                className="portal-card-v2"
                style={{
                  background: p.glow,
                  borderColor: p.border,
                  "--portal-color": p.color,
                } as React.CSSProperties}
              >
                <div className="portal-card-top">
                  <div className="portal-emoji" style={{ background: p.glow, border: `1px solid ${p.border}` }}>{p.emoji}</div>
                  <div>
                    <h3 className="portal-role" style={{ color: p.color }}>{p.role} Portal</h3>
                    <p className="portal-tagline">{p.tagline}</p>
                  </div>
                </div>
                <ul className="portal-features-v2">
                  {p.features.map((f) => (
                    <li key={f.text}>
                      <span className="portal-feat-icon">{f.icon}</span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="btn portal-cta-btn"
                  style={{ background: p.color } as React.CSSProperties}
                >
                  Enter {p.role} Portal →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ─────────────────────────── */}
      <section id="workflow" className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Workflow</span>
            <h2>From Zero to Verified in 60 Seconds</h2>
            <p>Fully automated pipeline — from class scheduling to attendance confirmation.</p>
          </div>

          <div className="workflow-timeline">
            {[
              {
                step: "1",
                icon: "⚙️",
                title: "Admin Sets Up",
                desc: "Admin creates classes, uploads student roster via CSV, and builds the timetable. System auto-activates attendance windows.",
                color: "var(--accent)",
              },
              {
                step: "2",
                icon: "🕐",
                title: "Window Auto-Opens",
                desc: "A cron job detects class start time and automatically opens the attendance window — no teacher action required whatsoever.",
                color: "var(--cyan)",
              },
              {
                step: "3",
                icon: "🧬",
                title: "Student Verifies",
                desc: "Student passes through all 7 biometric and contextual verification layers in sequence on their registered device.",
                color: "var(--violet)",
              },
              {
                step: "4",
                icon: "🛡️",
                title: "Fraud Engine Runs",
                desc: "Risk scoring engine evaluates the attempt. Suspicious entries are auto-flagged. Clean entries marked present instantly.",
                color: "var(--emerald)",
              },
            ].map((item, i) => (
              <div key={item.step} className="workflow-card">
                <div className="workflow-step-bubble" style={{ background: `linear-gradient(135deg, ${item.color}, rgba(255,255,255,0.1))`, boxShadow: `0 0 24px ${item.color}55` }}>
                  <span className="workflow-step-icon">{item.icon}</span>
                  <span className="workflow-step-num">{item.step}</span>
                </div>
                {i < 3 && <div className="workflow-connector" />}
                <div className="workflow-content">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology ───────────────────────── */}
      <section id="tech" className="section section-alt">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Technology Stack</span>
            <h2>Enterprise-Grade Architecture</h2>
            <p>Built on a battle-tested, modern stack designed for scalability and security.</p>
          </div>

          <div className="tech-grid">
            {[
              { name: "Next.js 14", category: "Framework", desc: "App Router, Server Components, edge-ready", icon: "▲", color: "#fff" },
              { name: "MongoDB", category: "Database", desc: "Flexible document store with aggregation pipelines", icon: "🍃", color: "#00ed64" },
              { name: "NextAuth.js", category: "Auth", desc: "Role-based JWT sessions with credential flows", icon: "🔑", color: "var(--amber)" },
              { name: "face-api.js", category: "Biometrics", desc: "On-device face recognition + liveness detection", icon: "👁️", color: "var(--cyan)" },
              { name: "WebCrypto HMAC", category: "Security", desc: "Dynamic QR token signing and verification", icon: "🔐", color: "var(--accent)" },
              { name: "Node-Cron", category: "Scheduler", desc: "Automated attendance window management", icon: "⏰", color: "var(--violet)" },
            ].map((t) => (
              <div key={t.name} className="tech-card">
                <div className="tech-icon" style={{ color: t.color }}>{t.icon}</div>
                <div className="tech-category">{t.category}</div>
                <h4 className="tech-name">{t.name}</h4>
                <p className="tech-desc">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <div className="cta-banner-orb" />
            <div className="cta-banner-content">
              <span className="section-tag" style={{ marginBottom: "1.25rem", display: "inline-block" }}>Ready to Start?</span>
              <h2 className="cta-banner-title">Eliminate Attendance Fraud Today</h2>
              <p className="cta-banner-desc">
                Deploy SmartAttend in minutes. Trusted by institutions that demand precision and zero manual overhead.
              </p>
              <div className="cta-banner-actions">
                <Link href="/login" className="btn btn-primary btn-lg">
                  Launch Portal →
                </Link>
                <a href="#features" className="btn btn-ghost btn-lg">
                  Explore Features
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────── */}
      <footer className="landing-footer-v2">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="nav-brand" style={{ marginBottom: "0.75rem" }}>
                <div className="logo-icon logo-icon-sm" style={{ background: 'transparent', padding: 0 }}>
                  <img src="/logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <span className="logo-text" style={{ fontSize: "1rem" }}>SmartAttend</span>
              </div>
              <p className="footer-tagline">Automated · Fraud-Resistant · University-Grade</p>
            </div>

            <div className="footer-links-col">
              <div className="footer-col-title">Platform</div>
              <a href="#features">7-Layer Pipeline</a>
              <a href="#portals">Student Portal</a>
              <a href="#portals">Teacher Portal</a>
              <a href="#portals">College Portal</a>
            </div>

            <div className="footer-links-col">
              <div className="footer-col-title">Access</div>
              <Link href="/login">Sign In</Link>
              <a href="#workflow">How It Works</a>
              <a href="#tech">Technology</a>
            </div>
          </div>

          <div className="footer-divider" />

          <div className="footer-bottom">
            <p>© 2025 SmartAttend. Built with Next.js, MongoDB and NextAuth.</p>
            <div className="footer-bottom-badges">
              <span className="footer-badge">🔒 Secure</span>
              <span className="footer-badge">⚡ Automated</span>
              <span className="footer-badge">🎯 Accurate</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}