import type { Internship, ApplicationRecord } from '../types';
import { logoColor, regionCode } from '../App';
import { getSavedLiveJobs, getAllLiveJobRatings, getLiveJobStatuses } from '../utils/jobsApi';

interface Props {
  internships: Internship[];
  applications: Record<string, ApplicationRecord>;
  onApply: (i: Internship) => void;
  onStatusChange: (id: string, status: ApplicationRecord['status']) => void;
  onNav: (page: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  saved: 'Saved', applied: 'Applied', interview: 'Interview', offer: 'Offer', rejected: 'Rejected',
};
const STATUS_CLASS: Record<string, string> = {
  saved: 'sp sp-saved', applied: 'sp sp-applied', interview: 'sp sp-interview',
  offer: 'sp sp-offer', rejected: 'sp sp-rejected',
};

export default function Dashboard({ internships, applications, onApply, onStatusChange, onNav }: Props) {
  const appList = Object.values(applications);
  const liveVals = Object.values(getLiveJobStatuses());
  const totalApplied  = appList.filter(a => ['applied','interview','offer','rejected'].includes(a.status)).length
    + liveVals.filter(s => ['applied','interview','offer','rejected'].includes(s)).length;
  const inPipeline    = appList.filter(a => ['applied','interview'].includes(a.status)).length
    + liveVals.filter(s => ['applied','interview'].includes(s)).length;
  const interviews    = appList.filter(a => a.status === 'interview').length
    + liveVals.filter(s => s === 'interview').length;
  const offers        = appList.filter(a => a.status === 'offer').length
    + liveVals.filter(s => s === 'offer').length;

  const weeklyGoal = 5;
  const weeklyDone = Math.min(
    appList.filter(a => ['applied','interview','offer'].includes(a.status)).length
      + liveVals.filter(s => ['applied','interview','offer'].includes(s)).length,
    weeklyGoal
  );
  const weeklyPct  = Math.round((weeklyDone / weeklyGoal) * 100);

  const recentApps = appList
    .filter(a => a.status !== 'saved')
    .slice(-5)
    .reverse()
    .map(a => {
      const i = internships.find(x => x.id === a.internship_id);
      if (!i) return null;
      const rc = regionCode(i.region);
      return { ...a, intern: i, rc };
    })
    .filter(Boolean) as Array<{ intern: Internship; status: string; rc: string }>;

  const iMap = Object.fromEntries(internships.map(i => [i.id, i]));

  const savedLiveJobs = Object.values(getSavedLiveJobs());
  const liveRatings   = getAllLiveJobRatings();
  const topLive = savedLiveJobs
    .sort((a, b) => (liveRatings[b.id] || 0) - (liveRatings[a.id] || 0) || b.fetchedAt - a.fetchedAt)
    .slice(0, 3);

  return (
    <div className="it-pad" style={{ padding: 36, maxWidth: 1000, margin: '0 auto' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 30, gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600, letterSpacing: '0.8px', marginBottom: 8, textTransform: 'uppercase' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 className="syne" style={{ fontWeight: 800, fontSize: 36, lineHeight: 1.08, margin: '0 0 8px', color: 'var(--t1)', letterSpacing: -0.5 }}>
            Good morning, <span style={{ color: 'var(--acc)' }}>Ammer</span> 🌱
          </h1>
          <p style={{ color: 'var(--t2)', fontSize: 15, margin: 0, fontWeight: 500 }}>
            {weeklyDone < weeklyGoal
              ? `You're ${weeklyGoal - weeklyDone} application${weeklyGoal - weeklyDone === 1 ? '' : 's'} away from this week's goal. Let's go.`
              : "You've hit your weekly goal! Keep the momentum going."}
          </p>
        </div>
        <div style={{ background: 'rgba(234,88,12,0.09)', border: '1px solid rgba(234,88,12,0.2)', borderRadius: 16, padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>🔥</span>
          <div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 26, color: '#ea580c', lineHeight: 1 }}>7</div>
            <div style={{ fontSize: 10, color: '#c2570e', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Day Streak</div>
          </div>
        </div>
      </div>

      {/* Weekly goal bar */}
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Weekly Goal</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>{weeklyDone} / {weeklyGoal} applications</span>
          </div>
          <div style={{ height: 7, background: 'rgba(45,28,16,0.07)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${weeklyPct}%`, background: 'linear-gradient(90deg,#e0322f,#f97316)', borderRadius: 100, transition: 'width 0.6s ease' }} />
          </div>
        </div>
        <div className="syne" style={{ fontWeight: 800, fontSize: 22, color: 'var(--acc)', flexShrink: 0 }}>{weeklyPct}%</div>
      </div>

      {/* Stats grid */}
      <div className="it-stats4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 30 }}>
        {[
          { value: totalApplied, label: 'Total Applied',  sub: `↑ ${Math.min(6, totalApplied)} this week`, color: 'var(--t1)', subColor: 'var(--acc)', highlight: false },
          { value: inPipeline,   label: 'In Pipeline',    sub: '↑ 3 updates',  color: '#2563eb', subColor: '#2563eb', highlight: false },
          { value: interviews,   label: 'Interviews',     sub: interviews > 0 ? '1 scheduled' : 'None yet', color: '#d97706', subColor: '#d97706', highlight: false },
          { value: offers,       label: 'Offers',         sub: offers > 0 ? '🎉 Keep it up!' : 'Keep going!', color: '#16893f', subColor: '#16893f', highlight: true },
        ].map(({ value, label, sub, color, subColor, highlight }) => (
          <div key={label} className="stat-card" style={highlight ? { background: 'linear-gradient(150deg,rgba(22,163,74,0.12),rgba(22,163,74,0.03))', border: '1px solid rgba(22,163,74,0.22)' } : {}}>
            <div className="syne" style={{ fontWeight: 800, fontSize: 40, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 8, fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 6, fontWeight: 700 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 30 }}>
        <h2 className="syne" style={{ fontWeight: 700, fontSize: 17, color: 'var(--t1)', margin: '0 0 14px' }}>Quick Actions</h2>
        <div className="it-qa" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { label: 'Search Internships', desc: `Browse ${internships.length}+ live openings across CA, TX & GCC`, bg: 'var(--acc)', textColor: '#fffaf2', descColor: 'rgba(255,250,242,0.78)', iconBg: 'rgba(255,255,255,0.18)', page: 'browse', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fffaf2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> },
            { label: 'Track Applications', desc: `Manage all ${totalApplied || 0} of your active applications`, bg: 'var(--surf)', textColor: 'var(--t1)', descColor: 'var(--t2)', iconBg: 'rgba(37,99,235,0.1)', page: 'tracker', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="7" rx="1"/></svg> },
            { label: 'View Analytics',     desc: 'See win rates, streaks and your earned badges', bg: 'var(--surf)', textColor: 'var(--t1)', descColor: 'var(--t2)', iconBg: 'rgba(124,58,237,0.1)', page: 'analytics', icon: <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg> },
          ].map(({ label, desc, bg, textColor, descColor, iconBg, page, icon }) => (
            <div
              key={label}
              className="qa-card"
              style={{ background: bg, border: bg === 'var(--surf)' ? '1px solid var(--bdr)' : 'none', borderRadius: 20, padding: 24 }}
              onClick={() => onNav(page)}
            >
              <div style={{ width: 46, height: 46, background: iconBg, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                {icon}
              </div>
              <div className="syne" style={{ fontWeight: 800, fontSize: 19, color: textColor, marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 13, color: descColor, fontWeight: 500, lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ marginBottom: topLive.length > 0 ? 30 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="syne" style={{ fontWeight: 700, fontSize: 17, color: 'var(--t1)', margin: 0 }}>Recent Activity</h2>
          <button className="btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => onNav('tracker')}>View all →</button>
        </div>
        <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
          {recentApps.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: 14 }}>
              No applications yet — <span style={{ color: 'var(--acc)', cursor: 'pointer', fontWeight: 600 }} onClick={() => onNav('browse')}>start browsing internships →</span>
            </div>
          ) : recentApps.map(({ intern, status, rc }) => (
            <div key={intern.id} className="activity-row">
              <div style={{ width: 40, height: 40, borderRadius: 11, background: logoColor(intern.company), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                {intern.company[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{intern.company}</div>
                <div style={{ fontSize: 12, color: 'var(--t2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{intern.role}</div>
              </div>
              <span className={`rp rp-${rc}`}>{rc}</span>
              <span className={STATUS_CLASS[status]}>{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Rated Live Jobs */}
      {topLive.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h2 className="syne" style={{ fontWeight: 700, fontSize: 17, color: 'var(--t1)', margin: '0 0 2px' }}>Top Saved Opportunities</h2>
              <p style={{ fontSize: 12, color: 'var(--t2)', margin: 0 }}>Your highest-rated live jobs</p>
            </div>
            <button className="btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => onNav('live')}>See live feed →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {topLive.map(job => {
              const rating = liveRatings[job.id] || 0;
              return (
                <div key={job.id} style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: logoColor(job.company || 'J'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                      {(job.company || 'J')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.company}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, letterSpacing: -1 }}>
                      {[1,2,3,4,5].map(i => (
                        <span key={i} style={{ color: i <= rating ? '#f59e0b' : 'var(--bdr)' }}>★</span>
                      ))}
                    </span>
                    {job.location && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{job.location}</span>}
                  </div>
                  <button
                    onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}
                    className="btn-acc"
                    style={{ width: '100%', fontSize: 12, padding: '8px' }}
                  >
                    Apply Now →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
