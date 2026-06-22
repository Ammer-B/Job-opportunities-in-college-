import type { Internship, ApplicationRecord } from '../types';
import { regionCode } from '../App';

interface Props {
  internships: Internship[];
  applications: Record<string, ApplicationRecord>;
}

const BADGES = [
  { icon: '🚀', label: 'First Apply',  desc: 'Sent first application',  earned: true },
  { icon: '🔥', label: '7-Day Streak', desc: 'Applied 7 days in a row',  earned: true },
  { icon: '🎯', label: 'Sniper',       desc: '80%+ match rate',          earned: true },
  { icon: '📬', label: 'Inbox Hero',   desc: 'Got 3+ callbacks',         earned: true },
  { icon: '💼', label: 'Offer Zone',   desc: 'Received an offer',        earned: false },
  { icon: '🏆', label: 'Top Hunter',   desc: '25+ applications sent',    earned: false },
];

export default function Analytics({ internships, applications }: Props) {
  const appList = Object.values(applications);
  const total      = appList.length;
  const applied    = appList.filter(a => ['applied','interview','offer','rejected'].includes(a.status)).length;
  const interviews = appList.filter(a => a.status === 'interview').length;
  const offers     = appList.filter(a => a.status === 'offer').length;
  const rejected   = appList.filter(a => a.status === 'rejected').length;

  const responseRate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;
  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

  // Funnel data
  const funnel = [
    { label: 'Applied',   value: applied,    pct: 100 },
    { label: 'Response',  value: interviews + offers + rejected, pct: applied > 0 ? Math.round(((interviews + offers + rejected) / applied) * 100) : 0 },
    { label: 'Interview', value: interviews, pct: applied > 0 ? Math.round((interviews / applied) * 100) : 0 },
    { label: 'Offer',     value: offers,     pct: applied > 0 ? Math.round((offers / applied) * 100) : 0 },
  ];

  // Regional breakdown
  const regionMap: Record<string, number> = {};
  appList.forEach(a => {
    const i = internships.find(x => x.id === a.internship_id);
    if (!i) return;
    const rc = regionCode(i.region);
    regionMap[rc] = (regionMap[rc] ?? 0) + 1;
  });
  const regionRows = [
    { code: 'CA',  name: 'California', count: regionMap['CA'] ?? 0 },
    { code: 'TX',  name: 'Texas',      count: regionMap['TX'] ?? 0 },
    { code: 'GCC', name: 'GCC',        count: regionMap['GCC'] ?? 0 },
  ];
  const maxRegion = Math.max(...regionRows.map(r => r.count), 1);

  // Heatmap — 12 weeks × 7 days = 84 cells, fill pseudo-randomly from applied count
  const heatCells = Array.from({ length: 84 }, (_, idx) => {
    const seed = (idx * 7 + 13) % 17;
    const level = applied === 0 ? 0 : seed < 3 ? 3 : seed < 6 ? 2 : seed < 9 ? 1 : 0;
    const colors = ['#ece2d2', '#f3aa9c', '#e8675a', '#d62f2c'];
    return colors[level];
  });

  const earnedCount = BADGES.filter(b => b.earned).length;

  return (
    <div className="it-pad" style={{ padding: 36, maxWidth: 1000, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 26, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="syne" style={{ fontWeight: 800, fontSize: 30, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: -0.5 }}>Analytics</h1>
          <p style={{ color: 'var(--t2)', fontSize: 14, margin: 0, fontWeight: 500 }}>Your internship hunt, by the numbers</p>
        </div>
        {/* Level card */}
        <div className="stat-card" style={{ minWidth: 200, padding: '12px 20px' }}>
          <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Intern Hunter</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="syne" style={{ fontWeight: 800, fontSize: 18, color: 'var(--acc)' }}>Lvl 3</div>
            <div style={{ flex: 1, height: 5, background: 'rgba(45,28,16,0.07)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '62%', background: 'var(--acc)', borderRadius: 100 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>1,240 XP</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="it-stats4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { value: applied,        label: 'Applications', color: 'var(--t1)', highlight: false },
          { value: `${responseRate}%`, label: 'Response Rate', color: '#2563eb',  highlight: false },
          { value: `${interviewRate}%`, label: 'Interview Rate', color: '#d97706',  highlight: false },
          { value: offers,         label: 'Offers',        color: '#16893f',   highlight: true },
        ].map(({ value, label, color, highlight }) => (
          <div key={label} className="stat-card" style={{ textAlign: 'center', ...(highlight ? { background: 'linear-gradient(150deg,rgba(22,163,74,0.12),rgba(22,163,74,0.03))', border: '1px solid rgba(22,163,74,0.22)' } : {}) }}>
            <div className="syne" style={{ fontWeight: 800, fontSize: 42, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 8, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Funnel + Regions */}
      <div className="it-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Funnel */}
        <div className="stat-card" style={{ padding: 24 }}>
          <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: '0 0 20px' }}>Application Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {funnel.map(step => (
              <div key={step.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>{step.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }}>{step.value}</span>
                </div>
                <div style={{ height: 7, background: 'rgba(45,28,16,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${step.pct}%`, background: 'var(--acc)', borderRadius: 100, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional breakdown */}
        <div className="stat-card" style={{ padding: 24 }}>
          <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: '0 0 20px' }}>Regional Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
            {regionRows.map(r => (
              <div key={r.code}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`rp rp-${r.code}`}>{r.code}</span>
                    <span style={{ fontSize: 13, color: 'var(--t1)', fontWeight: 600 }}>{r.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{r.count}</span>
                </div>
                <div style={{ height: 7, background: 'rgba(45,28,16,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((r.count / maxRegion) * 100)}%`, background: r.code === 'CA' ? '#2563eb' : r.code === 'TX' ? '#0d8478' : '#7c3aed', borderRadius: 100 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="stat-card" style={{ padding: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: 0 }}>Application Activity · Last 12 Weeks</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>Less</span>
            {['#ece2d2','#f3aa9c','#e8675a','#d62f2c'].map(c => (
              <div key={c} style={{ width: 11, height: 11, borderRadius: 3, background: c }} />
            ))}
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>More</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 4 }}>
          {heatCells.map((color, idx) => (
            <div key={idx} style={{ aspectRatio: '1', borderRadius: 3, background: color }} />
          ))}
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 className="syne" style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', margin: '0 0 16px' }}>
          Achievements · {earnedCount} of {BADGES.length} unlocked
        </h3>
        <div className="it-badges" style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
          {BADGES.map(b => (
            <div key={b.label} className={`badge-card ${b.earned ? 'badge-earned' : 'badge-locked'}`}>
              <div style={{ fontSize: 30, lineHeight: 1 }}>{b.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>{b.label}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.3 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
