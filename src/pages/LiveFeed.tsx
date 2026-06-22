import { useState, useEffect, useRef } from 'react';
import {
  LiveJob,
  getApiKey, saveApiKey, clearApiKey,
  getSavedLiveJobs, saveLiveJob, unsaveLiveJob,
  getAllLiveJobRatings, setLiveJobRating,
} from '../utils/jobsApi';
import { getMinScore, setMinScore, scoreColor } from '../utils/jobScore';
import { logoColor } from '../App';

type RegionFilter = 'all' | 'CA' | 'TX' | 'GCC' | 'AUNZ';
type TypeFilter   = 'all' | 'engineering' | 'data';
type FeedStatus   = 'idle' | 'loading' | 'connected' | 'error';

const SESSION_KEY = 'intern_live_session_v1';

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const GCC_MENA_TERMS = [
  'saudi arabia','riyadh','jeddah','dammam','khobar',
  'united arab emirates','uae','dubai','abu dhabi','sharjah',
  'qatar','doha','kuwait','oman','muscat','bahrain','manama',
  'jordan','amman','egypt','cairo','mena','middle east',
  'morocco','lebanon','beirut','aramco','sabic','adnoc','qatarenergy',
];

const AUNZ_CITY_TERMS = [
  'australia','sydney','melbourne','brisbane','perth','adelaide','canberra',
  'new zealand','auckland','wellington','christchurch',
];

function matchesRegion(job: LiveJob, region: RegionFilter): boolean {
  if (region === 'all') return true;
  // Only search location + title + company — not description (reduces false positives)
  const locOnly = job.location.toLowerCase();
  const broad   = (job.location + ' ' + job.title + ' ' + job.company).toLowerCase();

  if (region === 'CA') {
    return /\bcalifornia\b/.test(broad)
      || /\bca\b/.test(locOnly)
      || ['los angeles','san francisco','san jose','san diego','cupertino',
          'palo alto','silicon valley','santa clara','sunnyvale','oakland',
          'fremont','irvine','long beach','san bernardino'].some(k => broad.includes(k));
  }
  if (region === 'TX') {
    return /\btexas\b/.test(broad)
      || /\btx\b/.test(locOnly)
      || ['houston','austin','dallas','san antonio','fort worth',
          'plano','irving','arlington','el paso','corpus christi'].some(k => broad.includes(k));
  }
  if (region === 'GCC') {
    return GCC_MENA_TERMS.some(k => broad.includes(k));
  }
  if (region === 'AUNZ') {
    return AUNZ_CITY_TERMS.some(k => broad.includes(k))
      || /\bau\b/.test(locOnly)
      || /\bnz\b/.test(locOnly);
  }
  return true;
}

function matchesType(job: LiveJob, type: TypeFilter): boolean {
  if (type === 'all') return true;
  const t = job.title.toLowerCase();
  if (type === 'engineering') return ['engineer','engineering','mechanical','electrical','software','systems','petroleum','chemical','civil','materials'].some(k => t.includes(k));
  if (type === 'data')        return ['data','analytics','machine learning','ai','ml','scientist','analyst'].some(k => t.includes(k));
  return true;
}

// ── Score badge ────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <span style={{ fontSize: 11, fontWeight: 800, background: c.bg, color: c.text, padding: '3px 9px', borderRadius: 100, flexShrink: 0, letterSpacing: 0.3 }}>
      {score}% match
    </span>
  );
}

// ── Star rating ────────────────────────────────────────────────────────────
function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onClick={() => onRate?.(i === rating ? 0 : i)}
          onMouseEnter={() => onRate && setHovered(i)}
          onMouseLeave={() => onRate && setHovered(0)}
          style={{ fontSize: 15, cursor: onRate ? 'pointer' : 'default', color: i <= (hovered || rating) ? '#f59e0b' : 'var(--bdr)', transition: 'color 0.1s', userSelect: 'none', lineHeight: 1 }}
        >★</span>
      ))}
      {rating > 0 && <span style={{ fontSize: 10, color: 'var(--t3)', marginLeft: 4, fontWeight: 600 }}>{rating}/5</span>}
    </div>
  );
}

// ── Job card ───────────────────────────────────────────────────────────────
function JobCard({ job, isNew, isSaved, rating, onSave, onRate }: {
  job: LiveJob; isNew: boolean; isSaved: boolean; rating: number;
  onSave: (j: LiveJob) => void; onRate: (j: LiveJob, r: number) => void;
}) {
  const color = logoColor(job.company || 'J');
  const hasScore = job.score !== undefined;
  return (
    <div
      className={isNew ? 'live-new' : ''}
      style={{ background: 'var(--surf)', border: `1px solid ${isNew ? 'rgba(22,163,74,0.35)' : 'var(--bdr)'}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: isNew ? '0 4px 16px rgba(22,163,74,0.1)' : '0 1px 2px rgba(45,28,16,0.04)', transition: 'border-color 0.8s, box-shadow 0.8s' }}
    >
      {/* Company row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
          {(job.company || 'J')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.company}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.25, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {isNew && <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(22,163,74,0.12)', color: '#16893f', padding: '3px 8px', borderRadius: 100, letterSpacing: 0.5 }}>NEW</span>}
          {hasScore && <ScoreBadge score={job.score!} />}
        </div>
      </div>

      {/* Compat bar */}
      {hasScore && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 3, background: 'rgba(45,28,16,0.07)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${job.score}%`, background: scoreColor(job.score!).text, borderRadius: 100, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {job.location && (
          <span style={{ fontSize: 11, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {job.location}
          </span>
        )}
        {job.salary && <span style={{ fontSize: 11, color: '#16893f', fontWeight: 600, background: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: 100 }}>{job.salary}</span>}
        <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>{timeAgo(job.postedAt)}</span>
      </div>

      {/* Description */}
      {job.description && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {job.description}
        </p>
      )}

      {/* Star rating — visible when saved */}
      {isSaved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid var(--bdr)' }}>
          <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>Rate this role:</span>
          <StarRating rating={rating} onRate={r => onRate(job, r)} />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onSave(job)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: isSaved ? 'rgba(224,50,47,0.08)' : 'var(--elev)', border: `1px solid ${isSaved ? 'rgba(224,50,47,0.25)' : 'var(--bdr)'}`, borderRadius: 9, fontSize: 12, fontWeight: 600, color: isSaved ? 'var(--acc)' : 'var(--t2)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
          {isSaved ? 'Saved' : 'Save'}
        </button>
        <button
          onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}
          className="btn-acc"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          Apply Now
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── API setup screen ───────────────────────────────────────────────────────
function SetupScreen({ onConnect }: { onConnect: (k: string) => void }) {
  const [key, setKey] = useState('');
  const [err, setErr] = useState(false);
  const tryConnect = () => {
    if (!key.trim()) { setErr(true); return; }
    setErr(false);
    onConnect(key.trim());
  };
  return (
    <div style={{ maxWidth: 540, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, background: 'rgba(224,50,47,0.1)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1" fill="var(--acc)"/>
        </svg>
      </div>
      <h2 className="syne" style={{ fontWeight: 800, fontSize: 26, color: 'var(--t1)', margin: '0 0 10px' }}>Connect Live Jobs</h2>
      <p style={{ color: 'var(--t2)', fontSize: 14, lineHeight: 1.65, margin: '0 0 32px' }}>
        Pulls real internship listings from LinkedIn, Indeed & Glassdoor every 20 seconds via JSearch on RapidAPI — and keeps searching even when you're on other pages.
      </p>
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 16, padding: 24, textAlign: 'left' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8 }}>Your RapidAPI Key</div>
        <input
          className="field"
          value={key}
          onChange={e => { setKey(e.target.value); if (err) setErr(false); }}
          placeholder="Paste your x-rapidapi-key here"
          onKeyDown={e => e.key === 'Enter' && tryConnect()}
          style={err ? { borderColor: 'var(--acc)' } : undefined}
        />
        {err && <p style={{ color: 'var(--acc)', fontSize: 12, margin: '8px 0 0', fontWeight: 600 }}>Please paste your RapidAPI key to continue.</p>}
        <button className="btn-acc" style={{ width: '100%', marginTop: 14, padding: '12px' }} onClick={tryConnect}>
          Connect & Start Live Feed →
        </button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 16, lineHeight: 1.5 }}>
        Stored locally — never leaves your browser.
      </p>
    </div>
  );
}

// ── Main LiveFeed component ────────────────────────────────────────────────
export default function LiveFeed() {
  const [apiKey,  setApiKey]  = useState(getApiKey);

  // Load persisted jobs from sessionStorage (kept alive by App's background poller)
  const [jobs,    setJobs]    = useState<LiveJob[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '[]'); } catch { return []; }
  });
  const [drip,    setDrip]    = useState<LiveJob[]>([]);
  const [newIds,  setNewIds]  = useState<Set<string>>(new Set());
  const [saved,   setSaved]   = useState(getSavedLiveJobs);
  const [ratings, setRatings] = useState(getAllLiveJobRatings);
  const [status,  setStatus]  = useState<FeedStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [region,  setRegion]  = useState<RegionFilter>(() => (sessionStorage.getItem('lf_region') as RegionFilter) ?? 'all');
  const [type,    setType]    = useState<TypeFilter>(() => (sessionStorage.getItem('lf_type') as TypeFilter) ?? 'all');
  const [searchQ, setSearchQ] = useState('');
  const [minScore, setMinScoreState] = useState(getMinScore);
  const [totalFetched, setTotalFetched] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '[]').length; } catch { return 0; }
  });
  const [, setTick] = useState(0);

  const lastPoll = useRef<number>(Date.now());

  const countdown = Math.max(0, 20 - Math.floor((Date.now() - lastPoll.current) / 1000));

  // 1s tick for countdown
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Listen to App's background poller events
  useEffect(() => {
    const onNew = (e: Event) => {
      const fresh = (e as CustomEvent<LiveJob[]>).detail;
      const threshold = getMinScore();
      const passed = fresh.filter(j => (j.score ?? 0) >= threshold);
      if (passed.length > 0) {
        setDrip(prev => [...prev, ...passed]);
        setTotalFetched((c: number) => c + passed.length);
      }
    };
    const onStatus = (e: Event) => {
      const s = (e as CustomEvent<string>).detail;
      if (s === 'connected') { setStatus('connected'); setErrorMsg(''); }
      else if (s.startsWith('error:')) { setStatus('error'); setErrorMsg(s.slice(6)); }
      // 'loading' intentionally ignored — prevents yellow "Fetching…" flash
    };
    const onPoll = (e: Event) => {
      lastPoll.current = (e as CustomEvent<number>).detail;
    };
    window.addEventListener('livejobs:new',    onNew);
    window.addEventListener('livejobs:status', onStatus);
    window.addEventListener('livejobs:poll',   onPoll);
    return () => {
      window.removeEventListener('livejobs:new',    onNew);
      window.removeEventListener('livejobs:status', onStatus);
      window.removeEventListener('livejobs:poll',   onPoll);
    };
  }, []);

  // Drip: release 3 jobs every 700ms
  useEffect(() => {
    if (drip.length === 0) return;
    const t = setTimeout(() => {
      const batch = drip.slice(0, 3);
      const rest  = drip.slice(3);
      const ids   = batch.map(j => j.id);
      setJobs(prev => [...batch, ...prev].slice(0, 200));
      setNewIds(prev => new Set([...prev, ...ids]));
      setDrip(rest);
      setTimeout(() => setNewIds(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s; }), 4000);
    }, 700);
    return () => clearTimeout(t);
  }, [drip]);

  function handleConnect(k: string) {
    saveApiKey(k);
    setApiKey(k);
    // Trigger immediate poll from App's background poller
    window.dispatchEvent(new Event('livejobs:force-poll'));
  }

  function handleDisconnect() {
    clearApiKey();
    setApiKey('');
    setJobs([]);
    setDrip([]);
    setStatus('idle');
    sessionStorage.removeItem(SESSION_KEY);
  }

  function handleSave(job: LiveJob) {
    if (saved[job.id]) { unsaveLiveJob(job.id); } else { saveLiveJob(job); }
    setSaved(getSavedLiveJobs());
  }

  function handleRate(job: LiveJob, r: number) {
    setLiveJobRating(job.id, r);
    setRatings(getAllLiveJobRatings());
  }

  function handleMinScore(v: number) {
    setMinScore(v);
    setMinScoreState(v);
  }

  const filtered = jobs
    .filter(j => (j.score ?? 0) >= minScore)
    .filter(j => matchesRegion(j, region) && matchesType(j, type))
    .filter(j => !searchQ.trim() || (j.title + ' ' + j.company + ' ' + j.location).toLowerCase().includes(searchQ.toLowerCase()));

  if (!apiKey) return <SetupScreen onConnect={handleConnect} />;

  const dotColor = status === 'connected' ? '#16a34a' : status === 'error' ? 'var(--acc)' : 'var(--t3)';
  const dotLabel = status === 'connected' ? 'Live' : status === 'error' ? 'Error' : 'Connecting…';

  const errorHuman =
    errorMsg === 'invalid_key'    ? 'Invalid API key — check your RapidAPI dashboard.' :
    errorMsg === 'quota_exceeded' ? 'Monthly quota reached. Try again next month.' :
    `API error: ${errorMsg}`;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px 60px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 className="syne" style={{ fontWeight: 800, fontSize: 28, color: 'var(--t1)', margin: 0, letterSpacing: -0.4 }}>Live Jobs</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 100, padding: '4px 12px' }}>
              <div className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: dotColor }}>{dotLabel}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>searching in background</span>
          </div>
          <p style={{ color: 'var(--t2)', fontSize: 13, margin: '0 0 4px' }}>
            {totalFetched > 0
              ? `${totalFetched} fetched · ${filtered.length} matching · next in ${countdown}s`
              : 'Scanning 4+ job boards — no API limits…'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>
            Sources: RemoteOK · Remotive · The Muse · Jobicy
            {getApiKey() ? ' · JSearch' : ''}
            {import.meta.env.VITE_JOOBLE_KEY ? ' · Jooble' : ''}
            {(import.meta.env.VITE_ADZUNA_APP_ID && import.meta.env.VITE_ADZUNA_APP_KEY) ? ' · Adzuna' : ''}
          </p>
        </div>
        <button onClick={handleDisconnect} style={{ fontSize: 12, color: 'var(--t3)', background: 'none', border: '1px solid var(--bdr)', borderRadius: 9, padding: '7px 12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          Disconnect
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <input className="field" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search jobs, companies or locations…" style={{ paddingLeft: 38, fontSize: 13 }} />
      </div>

      {/* Error banner */}
      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(224,50,47,0.07)', border: '1px solid rgba(224,50,47,0.22)', borderRadius: 12, marginBottom: 14, color: 'var(--acc)', fontSize: 13, fontWeight: 500 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {errorHuman}
          {errorMsg === 'invalid_key' && <button onClick={handleDisconnect} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--acc)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Re-enter key →</button>}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, padding: '16px', background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 14 }}>
        {/* Region */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.5px', textTransform: 'uppercase', width: 60, flexShrink: 0 }}>Region</span>
          {(['all','CA','TX','GCC','AUNZ'] as RegionFilter[]).map(r => (
            <button key={r} className={`ftab${region === r ? ' active' : ''}`} onClick={() => { sessionStorage.setItem('lf_region', r); setRegion(r); }} style={{ padding: '5px 12px', fontSize: 12 }}>
              {r === 'all' ? 'All' : r === 'CA' ? '🌉 CA' : r === 'TX' ? '⭐ TX' : r === 'GCC' ? '🌙 GCC / MENA' : '🦘 AU / NZ'}
            </button>
          ))}
        </div>
        <div style={{ width: '100%', height: 1, background: 'var(--bdr)' }} />
        {/* Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.5px', textTransform: 'uppercase', width: 60, flexShrink: 0 }}>Type</span>
          {(['all','engineering','data'] as TypeFilter[]).map(t => (
            <button key={t} className={`ftab${type === t ? ' active' : ''}`} onClick={() => { sessionStorage.setItem('lf_type', t); setType(t); }} style={{ padding: '5px 12px', fontSize: 12 }}>
              {t === 'all' ? 'All Roles' : t === 'engineering' ? 'Engineering' : 'Data / AI'}
            </button>
          ))}
        </div>
        <div style={{ width: '100%', height: 1, background: 'var(--bdr)' }} />
        {/* Min compatibility slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', letterSpacing: '0.5px', textTransform: 'uppercase', flexShrink: 0 }}>Min Match</span>
          <input
            type="range" min={0} max={80} step={5} value={minScore}
            onChange={e => handleMinScore(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--acc)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: minScore > 0 ? 'var(--acc)' : 'var(--t3)', minWidth: 38, textAlign: 'right' }}>
            {minScore > 0 ? `${minScore}%` : 'Off'}
          </span>
        </div>
        {minScore > 0 && (
          <div style={{ fontSize: 11, color: 'var(--t2)', padding: '6px 10px', background: 'rgba(224,50,47,0.06)', borderRadius: 8 }}>
            Showing only jobs with ≥{minScore}% compatibility with your profile. <button onClick={() => handleMinScore(0)} style={{ background: 'none', border: 'none', color: 'var(--acc)', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: 0, fontFamily: "'DM Sans',sans-serif" }}>Clear filter</button>
          </div>
        )}
      </div>

      {/* Feed — newest at top */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {status === 'loading' && jobs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--t2)', fontSize: 14 }}>
              <div className="live-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
              Scanning LinkedIn, Indeed & Glassdoor for you…
            </div>
          </div>
        )}

        {filtered.length === 0 && jobs.length > 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t2)', fontSize: 14 }}>
            {minScore > 0
              ? `No jobs at ≥${minScore}% match yet — lower the slider or wait for more results.`
              : 'No results match your filters. Try widening the region or role type.'}
          </div>
        )}

        {filtered.map(job => (
          <JobCard
            key={job.id} job={job}
            isNew={newIds.has(job.id)} isSaved={!!saved[job.id]}
            rating={ratings[job.id] ?? 0}
            onSave={handleSave} onRate={handleRate}
          />
        ))}

        {jobs.length > 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--t3)', fontSize: 12 }}>
            {drip.length > 0 ? `${drip.length} more arriving…` : `Next batch in ${countdown}s`}
          </div>
        )}
      </div>
    </div>
  );
}
