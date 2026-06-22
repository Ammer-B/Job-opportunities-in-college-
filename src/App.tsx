import { useState, useCallback, useEffect, useRef } from 'react';
import type { Internship, ApplicationRecord, FilterState, AppStatus } from './types';
import { INTERNSHIPS } from './data/internships';
import { loadApplications, updateStatus } from './utils/storage';
import BulkApplyModal from './components/BulkApplyModal';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Tracker from './pages/Tracker';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import LiveFeed from './pages/LiveFeed';
import { getApiKey, fetchLiveJobs, fetchRemoteOKJobs, fetchJoobleJobs, fetchAdzunaJobs, fetchRemotiveJobs, fetchTheMuseJobs, fetchJobicyJobs, LIVE_QUERIES, type LiveJob } from './utils/jobsApi';
import { loadProfile } from './utils/userProfile';
import { scoreJob } from './utils/jobScore';

const LIVE_SESSION_KEY = 'intern_live_session_v1';

type Page = 'dashboard' | 'browse' | 'tracker' | 'analytics' | 'profile' | 'live';

const DEFAULT_FILTERS: FilterState = {
  regions: [], industries: [], windows: [],
  min_composite: 0, search: '', sort_by: 'composite', show_ksa_path_only: false,
};

// ── Logo color helper ──────────────────────────────────────────────────────
const LOGO_COLORS = ['#e0322f','#2563eb','#d97706','#16a34a','#7c3aed','#0d8478','#ea580c','#0891b2'];
export function logoColor(name: string) {
  return LOGO_COLORS[name.charCodeAt(0) % LOGO_COLORS.length];
}
export function regionCode(region: string): string {
  if (region === 'california') return 'CA';
  if (region === 'texas') return 'TX';
  if (region === 'australia' || region === 'new_zealand') return 'AU';
  return 'GCC';
}

// ── SVG icons (from InternTrack icon system — 24px grid, 2px round stroke) ──
const IconDash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16" y2="16"/>
  </svg>
);
const IconTrack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="11" rx="1.5"/>
    <rect x="17" y="4" width="5" height="7" rx="1.5"/>
  </svg>
);
const IconAnalytics = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="21" x2="22" y2="21"/>
  </svg>
);
const IconProfile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V21"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconLive = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1" fill="currentColor"/>
  </svg>
);
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
// Climbing Pulse mark — from InternTrack brand design (heartbeat that rises)
const Logo = ({ size = 18, color = '#fffaf2' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path
      d="M4 28 L13 28 L18 16 L24 34 L29 24 L33 24 L38 12 L44 12"
      stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

const NAV: { id: Page; label: string; Icon: () => JSX.Element }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: IconDash },
  { id: 'browse',    label: 'Search',    Icon: IconSearch },
  { id: 'live',      label: 'Live',      Icon: IconLive },
  { id: 'tracker',   label: 'Track',     Icon: IconTrack },
  { id: 'analytics', label: 'Analytics', Icon: IconAnalytics },
  { id: 'profile',   label: 'Profile',   Icon: IconProfile },
];

// ── Auth Page ──────────────────────────────────────────────────────────────
function AuthPage({ onAuth }: { onAuth: () => void }) {
  const [isSignup, setIsSignup] = useState(true);
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [uni, setUni]       = useState('');
  const [pass, setPass]     = useState('');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Brand panel */}
      <div className="it-authbrand" style={{ flex: 1, background: 'linear-gradient(160deg,#e0322f,#9e1414)', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -120, right: -120 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -100, left: -80 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ width: 38, height: 38, background: '#fffaf2', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Logo size={20} color="#e0322f" />
          </div>
          <span className="syne" style={{ fontWeight: 800, fontSize: 19 }}>Intern<span style={{ color: 'rgba(255,250,242,0.75)' }}>Track</span></span>
        </div>
        <div style={{ position: 'relative' }}>
          <h1 className="syne" style={{ fontWeight: 800, fontSize: 40, lineHeight: 1.1, margin: '0 0 18px', letterSpacing: -0.5 }}>Land the internship you actually want.</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', margin: '0 0 28px', maxWidth: 400 }}>
            Search, apply and track every internship across California, Texas &amp; the GCC — all in one place.
          </p>
          {['200+ live roles across 3 regions', 'One pipeline from applied to offer', 'Streaks & badges to keep you going'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 14, padding: '14px 18px' }}>
          <span style={{ fontSize: 26 }}>🔥</span>
          <div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>12,400+ students</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>are tracking their hunt on InternTrack</div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div style={{ width: 480, maxWidth: '100%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 28px' }}>
        <div style={{ width: '100%', maxWidth: 368 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 34, height: 34, background: 'var(--acc)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Logo size={18} />
            </div>
            <span className="syne" style={{ fontWeight: 800, fontSize: 17, color: 'var(--t1)' }}>Intern<span style={{ color: 'var(--acc)' }}>Track</span></span>
          </div>

          <h2 className="syne" style={{ fontWeight: 800, fontSize: 26, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: -0.3 }}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--t2)', margin: '0 0 22px' }}>
            {isSignup ? 'Start tracking your internship hunt today.' : 'Log in to see your applications.'}
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 11, padding: 4, marginBottom: 22 }}>
            <div className={`authtab ${isSignup ? 'authtab-on' : ''}`} onClick={() => setIsSignup(true)}>Create account</div>
            <div className={`authtab ${!isSignup ? 'authtab-on' : ''}`} onClick={() => setIsSignup(false)}>Log in</div>
          </div>

          {/* Social */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <button className="soc-btn" onClick={onAuth}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C17.1 3.4 14.8 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 12s4.2 9.6 9.4 9.6c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"/></svg>
              Google
            </button>
            <button className="soc-btn" onClick={onAuth}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>
              LinkedIn
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--bdr)' }} />
            <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>or with email</span>
            <div style={{ flex: 1, height: 1, background: 'var(--bdr)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
            {isSignup && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700, letterSpacing: '0.4px', marginBottom: 6, textTransform: 'uppercase' }}>FULL NAME</div>
                <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="Ammer Boorenie" />
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700, letterSpacing: '0.4px', marginBottom: 6, textTransform: 'uppercase' }}>EMAIL</div>
              <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" />
            </div>
            {isSignup && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700, letterSpacing: '0.4px', marginBottom: 6, textTransform: 'uppercase' }}>UNIVERSITY</div>
                <input className="field" value={uni} onChange={e => setUni(e.target.value)} placeholder="Texas A&M" />
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 700, letterSpacing: '0.4px', marginBottom: 6, textTransform: 'uppercase' }}>PASSWORD</div>
              <input className="field" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
            </div>
          </div>

          <button className="btn-acc" style={{ width: '100%', padding: '13px', fontSize: 14 }} onClick={onAuth}>
            {isSignup ? 'Create account' : 'Log in'} →
          </button>

          {isSignup && (
            <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', margin: '16px 0 0', lineHeight: 1.5 }}>
              By creating an account you agree to our <span style={{ color: 'var(--t2)', fontWeight: 600 }}>Terms</span> &amp; <span style={{ color: 'var(--t2)', fontWeight: 600 }}>Privacy Policy</span>.
            </p>
          )}
          {!isSignup && (
            <p style={{ fontSize: 13, color: 'var(--acc)', textAlign: 'center', margin: '16px 0 0', fontWeight: 600, cursor: 'pointer' }}>Forgot your password?</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ page, onNav, onLogout }: { page: Page; onNav: (p: Page) => void; onLogout: () => void }) {
  return (
    <aside className="it-sidebar" style={{ width: 240, flexShrink: 0, background: 'var(--surf)', borderRight: '1px solid var(--bdr)', display: 'flex', flexDirection: 'column', padding: '20px 12px' }}>
      <div style={{ padding: '4px 8px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, background: 'var(--acc)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Logo size={18} />
        </div>
        <span className="syne" style={{ fontWeight: 800, fontSize: 17, color: 'var(--t1)' }}>Intern<span style={{ color: 'var(--acc)' }}>Track</span></span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV.map(({ id, label, Icon }) => (
          <div key={id} className={`nav-item${page === id ? ' active' : ''}`} onClick={() => onNav(id)}>
            <Icon />
            {label}
          </div>
        ))}
      </nav>

      <div style={{ paddingTop: 16, borderTop: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div onClick={() => onNav('profile')} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#e0322f,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: '#fff', flexShrink: 0 }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Ammer Boorenie</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>Level 3 · 1,240 XP</div>
          </div>
        </div>
        <div onClick={onLogout} title="Log out" style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--t3)', flexShrink: 0, border: '1px solid var(--bdr)' }}>
          <IconLogout />
        </div>
      </div>
    </aside>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────────────────────
function BottomNav({ page, onNav }: { page: Page; onNav: (p: Page) => void }) {
  return (
    <nav className="it-bnav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,253,249,0.92)', borderTop: '1px solid var(--bdr)', padding: '10px 8px', display: 'none', justifyContent: 'space-around', zIndex: 100, backdropFilter: 'blur(14px)' }}>
      {NAV.map(({ id, label, Icon }) => (
        <div key={id} className={`bn-item ${page === id ? 'bn-active' : 'bn-inactive'}`} onClick={() => onNav(id)}>
          <Icon />
          {label}
        </div>
      ))}
    </nav>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed]     = useState(() => localStorage.getItem('intern_session_v1') === '1');
  const [page, setPage]         = useState<Page>('dashboard');
  const [bulkQueue, setBulkQueue] = useState<Internship[]>([]);
  const [applications, setApps]   = useState<Record<string, ApplicationRecord>>(loadApplications);
  const [filters, setFilters]     = useState<FilterState>(DEFAULT_FILTERS);
  const [theme, setTheme]         = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('intern_theme_v1') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('intern_theme_v1', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('intern_session_v1', authed ? '1' : '0');
  }, [authed]);

  // ── Background job poller — runs as long as user is authed, any page ──────
  const livePollIdx  = useRef(0);
  const liveSeenIds  = useRef(new Set<string>());

  // Shared helper: score, dedup, persist, dispatch
  const processJobs = useCallback((raw: LiveJob[]) => {
    const profile = loadProfile();
    const fresh: LiveJob[] = raw
      .filter(j => !liveSeenIds.current.has(j.id))
      .map(j => ({ ...j, score: scoreJob(j, { skills: profile.skills ?? [], major: profile.major ?? '' }) }));
    fresh.forEach(j => liveSeenIds.current.add(j.id));
    if (fresh.length > 0) {
      try {
        const prev: LiveJob[] = JSON.parse(sessionStorage.getItem(LIVE_SESSION_KEY) ?? '[]');
        sessionStorage.setItem(LIVE_SESSION_KEY, JSON.stringify([...fresh, ...prev].slice(0, 200)));
      } catch { /* storage full */ }
      window.dispatchEvent(new CustomEvent('livejobs:new', { detail: fresh }));
    }
  }, []);

  // JSearch — primary source, every 20s (quota_exceeded silently skipped — free sources cover it)
  useEffect(() => {
    if (!authed) return;

    const poll = async () => {
      const key = getApiKey();
      if (!key) return;
      window.dispatchEvent(new CustomEvent('livejobs:status', { detail: 'loading' }));
      const q = LIVE_QUERIES[livePollIdx.current % LIVE_QUERIES.length];
      livePollIdx.current++;
      try {
        const raw = await fetchLiveJobs(q, key);
        processJobs(raw);
        window.dispatchEvent(new CustomEvent('livejobs:status', { detail: 'connected' }));
        window.dispatchEvent(new CustomEvent('livejobs:poll', { detail: Date.now() }));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === 'quota_exceeded') {
          // JSearch quota exhausted — free sources keep the feed alive; stay silent
          window.dispatchEvent(new CustomEvent('livejobs:poll', { detail: Date.now() }));
        } else {
          window.dispatchEvent(new CustomEvent('livejobs:status', { detail: 'error:' + msg }));
        }
      }
    };

    const onForcePoll = () => poll();
    window.addEventListener('livejobs:force-poll', onForcePoll);
    poll();
    const t = setInterval(poll, 20_000);
    return () => { clearInterval(t); window.removeEventListener('livejobs:force-poll', onForcePoll); };
  }, [authed, processJobs]);

  // RemoteOK — free, no key, every 2 minutes, reports 'connected' when jobs arrive
  useEffect(() => {
    if (!authed) return;
    const poll = async () => {
      const jobs = await fetchRemoteOKJobs();
      if (jobs.length > 0) {
        processJobs(jobs);
        window.dispatchEvent(new CustomEvent('livejobs:status', { detail: 'connected' }));
        window.dispatchEvent(new CustomEvent('livejobs:poll', { detail: Date.now() }));
      }
    };
    const delay = setTimeout(poll, 8_000);
    const t = setInterval(poll, 120_000);
    return () => { clearTimeout(delay); clearInterval(t); };
  }, [authed, processJobs]);

  // ── NA poller: Remotive + TheMuse + Jobicy + RemoteOK (every 3 min) ─────
  const naRemotiveIdx = useRef(0);
  const naMuseIdx     = useRef(0);
  const naJobicyIdx   = useRef(0);
  const NA_REMOTIVE = ['engineering intern','software intern','data science intern','mechanical intern','materials science intern','chemical engineering intern'];
  const NA_JOBICY   = ['engineering','software','data'];

  useEffect(() => {
    if (!authed) return;
    const poll = async () => {
      const search = NA_REMOTIVE[naRemotiveIdx.current++ % NA_REMOTIVE.length];
      const page   = naMuseIdx.current++ % 5;
      const tag    = NA_JOBICY[naJobicyIdx.current++ % NA_JOBICY.length];
      const results = await Promise.allSettled([
        fetchRemotiveJobs(search),
        fetchTheMuseJobs(page),
        fetchJobicyJobs(tag),
        fetchRemoteOKJobs(),
      ]);
      const jobs = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      if (jobs.length > 0) {
        processJobs(jobs);
        window.dispatchEvent(new CustomEvent('livejobs:status', { detail: 'connected' }));
        window.dispatchEvent(new CustomEvent('livejobs:poll', { detail: Date.now() }));
      }
    };
    const delay = setTimeout(poll, 12_000);
    const t = setInterval(poll, 3 * 60_000);
    return () => { clearTimeout(delay); clearInterval(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, processJobs]);

  // ── MENA poller: Jooble GCC queries (every 5 min) ────────────────────────
  const MENA_QUERIES = [
    { keywords: 'engineering internship 2025', location: 'Saudi Arabia' },
    { keywords: 'engineering internship', location: 'UAE' },
    { keywords: 'engineering internship 2025', location: 'Qatar' },
    { keywords: 'engineering internship', location: 'Kuwait' },
    { keywords: 'engineering internship', location: 'Bahrain' },
    { keywords: 'engineering internship', location: 'Oman' },
  ];
  const menaIdx = useRef(0);

  useEffect(() => {
    if (!authed) return;
    const poll = async () => {
      const joobleKey = import.meta.env.VITE_JOOBLE_KEY;
      if (!joobleKey) return;
      // Send 2 MENA queries per cycle to get ~10 jobs per fire
      const q1 = MENA_QUERIES[menaIdx.current++ % MENA_QUERIES.length];
      const q2 = MENA_QUERIES[menaIdx.current++ % MENA_QUERIES.length];
      const results = await Promise.allSettled([
        fetchJoobleJobs(joobleKey, q1.keywords, q1.location),
        fetchJoobleJobs(joobleKey, q2.keywords, q2.location),
      ]);
      const jobs = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      if (jobs.length > 0) processJobs(jobs);
    };
    const delay = setTimeout(poll, 18_000);
    const t = setInterval(poll, 5 * 60_000);
    return () => { clearTimeout(delay); clearInterval(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, processJobs]);

  // ── AU/NZ poller: Jooble AU/NZ + Adzuna (12-hr cooldown) ─────────────────
  const AUNZ_JOOBLE = [
    { keywords: 'engineering internship 2025', location: 'Australia' },
    { keywords: 'engineering internship', location: 'New Zealand' },
    { keywords: 'software engineering internship', location: 'Australia' },
    { keywords: 'engineering intern graduate', location: 'Sydney Melbourne Brisbane' },
  ];
  const AUNZ_ADZUNA = [
    { what: 'engineering internship', country: 'au' },
    { what: 'engineering internship', country: 'nz' },
  ];
  const aunzIdx = useRef(0);

  useEffect(() => {
    if (!authed) return;
    const poll = async () => {
      const fetches: Promise<LiveJob[]>[] = [];

      const joobleKey = import.meta.env.VITE_JOOBLE_KEY;
      if (joobleKey) {
        const q1 = AUNZ_JOOBLE[aunzIdx.current++ % AUNZ_JOOBLE.length];
        const q2 = AUNZ_JOOBLE[aunzIdx.current++ % AUNZ_JOOBLE.length];
        fetches.push(fetchJoobleJobs(joobleKey, q1.keywords, q1.location));
        fetches.push(fetchJoobleJobs(joobleKey, q2.keywords, q2.location));
      }

      const appId = import.meta.env.VITE_ADZUNA_APP_ID;
      const appKey = import.meta.env.VITE_ADZUNA_APP_KEY;
      if (appId && appKey) {
        const lastRun = parseInt(localStorage.getItem('adzuna_last_ts') ?? '0', 10);
        if (Date.now() - lastRun > 12 * 3_600_000) {
          localStorage.setItem('adzuna_last_ts', String(Date.now()));
          AUNZ_ADZUNA.forEach(q => fetches.push(fetchAdzunaJobs(appId, appKey, q.what, q.country)));
        }
      }

      if (fetches.length === 0) return;
      const results = await Promise.allSettled(fetches);
      const jobs = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      if (jobs.length > 0) processJobs(jobs);
    };
    const delay = setTimeout(poll, 25_000);
    const t = setInterval(poll, 5 * 60_000);
    return () => { clearTimeout(delay); clearInterval(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, processJobs]);

  // ── Watchdog: if no poll event in 45s, force an immediate JSearch poll ───
  const lastPollEventRef = useRef(Date.now());
  useEffect(() => {
    if (!authed) return;
    const onPoll = () => { lastPollEventRef.current = Date.now(); };
    window.addEventListener('livejobs:poll', onPoll);
    const watchdog = setInterval(() => {
      if (Date.now() - lastPollEventRef.current > 45_000) {
        window.dispatchEvent(new Event('livejobs:force-poll'));
      }
    }, 20_000);
    return () => { clearInterval(watchdog); window.removeEventListener('livejobs:poll', onPoll); };
  }, [authed]);

  const refresh = useCallback(() => setApps(loadApplications()), []);

  function openApply(internships: Internship[]) { setBulkQueue(internships); }
  function handleStatusChange(id: string, status: AppStatus) { updateStatus(id, status); refresh(); }

  if (!authed) return <AuthPage onAuth={() => setAuthed(true)} />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar page={page} onNav={setPage} onLogout={() => setAuthed(false)} />

      <main className="it-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {page === 'dashboard' && (
          <Dashboard
            internships={INTERNSHIPS}
            applications={applications}
            onApply={i => openApply([i])}
            onStatusChange={handleStatusChange}
            onNav={p => setPage(p as Page)}
          />
        )}
        {page === 'browse' && (
          <Browse
            internships={INTERNSHIPS}
            applications={applications}
            filters={filters}
            onFiltersChange={setFilters}
            onApply={i => openApply([i])}
            onBulkApply={openApply}
            onStatusChange={handleStatusChange}
          />
        )}
        {page === 'tracker' && (
          <Tracker
            internships={INTERNSHIPS}
            applications={applications}
            onApply={i => openApply([i])}
            onBulkApply={openApply}
            onStatusChange={handleStatusChange}
            onRefresh={refresh}
            onNav={p => setPage(p as Page)}
          />
        )}
        {page === 'live' && <LiveFeed />}
        {page === 'analytics' && (
          <Analytics internships={INTERNSHIPS} applications={applications} />
        )}
        {page === 'profile' && <Profile theme={theme} onThemeChange={setTheme} />}
      </main>

      <BottomNav page={page} onNav={setPage} />

      {bulkQueue.length > 0 && (
        <BulkApplyModal
          internships={bulkQueue}
          onClose={() => { setBulkQueue([]); refresh(); }}
          onDone={() => { setBulkQueue([]); refresh(); setPage('tracker'); }}
        />
      )}
    </div>
  );
}
