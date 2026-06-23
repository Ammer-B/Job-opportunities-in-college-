import { useState, useEffect } from 'react';
import type { Internship, ApplicationRecord, FilterState, SortKey, JobType } from '../types';
import { updateStatus } from '../utils/storage';
import { logoColor, regionCode } from '../App';
import { getApiKey, fetchDailyBrowseJobs, LiveJob } from '../utils/jobsApi';
import { scoreJob, scoreColor } from '../utils/jobScore';
import { loadProfile } from '../utils/userProfile';

interface Props {
  internships: Internship[];
  applications: Record<string, ApplicationRecord>;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  onApply: (i: Internship) => void;
  onBulkApply: (internships: Internship[]) => void;
  onStatusChange: (id: string, status: ApplicationRecord['status']) => void;
}

type RegionFilter = 'all' | 'CA' | 'TX' | 'GCC' | 'AUNZ';
type RoleFilter   = 'all' | 'engineering' | 'data' | 'product' | 'business';
type JobTypeFilter = 'all' | 'intern' | 'full_time' | 'part_time' | 'remote' | 'hybrid' | 'on_site';

const ROLE_INDUSTRIES: Record<RoleFilter, string[]> = {
  all:         [],
  engineering: ['oil_gas','aerospace','manufacturing','mining'],
  data:        ['semiconductor','national_lab'],
  product:     [],
  business:    [],
};

const GCC_BROWSE_TERMS = [
  'saudi arabia','riyadh','jeddah','dammam','khobar',
  'united arab emirates','uae','dubai','abu dhabi','sharjah',
  'qatar','doha','kuwait','oman','muscat','bahrain','manama',
  'jordan','amman','egypt','cairo','mena','middle east',
  'morocco','lebanon','beirut','aramco','sabic','adnoc','qatarenergy',
];
const AUNZ_BROWSE_TERMS = [
  'australia','sydney','melbourne','brisbane','perth','adelaide','canberra',
  'new zealand','auckland','wellington','christchurch',
];

function matchesLiveRegion(job: LiveJob, region: RegionFilter): boolean {
  if (region === 'all') return true;
  const locOnly = job.location.toLowerCase();
  const broad   = (job.location + ' ' + job.title + ' ' + job.company).toLowerCase();
  if (region === 'CA') {
    return /\bcalifornia\b/.test(broad) || /\bca\b/.test(locOnly)
      || ['los angeles','san francisco','san jose','san diego','cupertino',
          'palo alto','silicon valley','santa clara','sunnyvale','oakland'].some(k => broad.includes(k));
  }
  if (region === 'TX') {
    return /\btexas\b/.test(broad) || /\btx\b/.test(locOnly)
      || ['houston','austin','dallas','san antonio','fort worth','plano','irving'].some(k => broad.includes(k));
  }
  if (region === 'GCC')  return GCC_BROWSE_TERMS.some(k => broad.includes(k));
  if (region === 'AUNZ') return AUNZ_BROWSE_TERMS.some(k => broad.includes(k)) || /\bau\b/.test(locOnly) || /\bnz\b/.test(locOnly);
  return true;
}

function matchesLiveRole(job: LiveJob, role: RoleFilter): boolean {
  if (role === 'all') return true;
  const t = job.title.toLowerCase();
  if (role === 'engineering') return ['engineer','engineering','mechanical','electrical','software','systems','petroleum','chemical','civil','materials'].some(k => t.includes(k));
  if (role === 'data')        return ['data','analytics','machine learning','ai','ml','scientist','analyst'].some(k => t.includes(k));
  if (role === 'product')     return ['product','ux','ui','design','researcher','user experience'].some(k => t.includes(k));
  if (role === 'business')    return ['business','finance','marketing','accounting','operations','management','economics'].some(k => t.includes(k));
  return true;
}

function matchesLiveJobType(job: LiveJob, jobType: JobTypeFilter): boolean {
  if (jobType === 'all') return true;
  const t = (job.title + ' ' + (job.location || '')).toLowerCase();
  if (jobType === 'intern') return t.includes('intern');
  if (jobType === 'full_time') return t.includes('full-time') || t.includes('full time');
  if (jobType === 'part_time') return t.includes('part-time') || t.includes('part time');
  if (jobType === 'remote') return t.includes('remote');
  if (jobType === 'hybrid') return t.includes('hybrid');
  if (jobType === 'on_site') return t.includes('on-site') || t.includes('on site') || t.includes('onsite') || t.includes('in-office') || t.includes('in office');
  return true;
}

function applyFilters(internships: Internship[], search: string, region: RegionFilter, role: RoleFilter, jobType: JobTypeFilter, sort: SortKey): Internship[] {
  let r = internships;

  if (region !== 'all') r = r.filter(i => regionCode(i.region) === region);

  if (role !== 'all' && ROLE_INDUSTRIES[role].length > 0) {
    r = r.filter(i => i.industry.some(ind => ROLE_INDUSTRIES[role].includes(ind)));
  }

  if (jobType !== 'all') {
r = r.filter(i => i.job_type && i.job_type.includes(jobType as JobType));
}

if (search.trim()) {
    const q = search.toLowerCase();
    r = r.filter(i =>
      i.company.toLowerCase().includes(q) ||
      i.role.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      i.key_skills.some(s => s.toLowerCase().includes(q))
    );
  }

  const key: Record<SortKey, (i: Internship) => number> = {
    composite:           i => i.composite_score,
    pay_rate:            i => i.scores.pay_rate,
    ease_of_entry:       i => i.scores.ease_of_entry,
    future_benefits:     i => i.scores.future_benefits,
    callback_percentage: i => i.scores.callback_percentage,
  };
  return [...r].sort((a, b) => key[sort](b) - key[sort](a));
}

const REGION_TABS: { id: RegionFilter; label: string }[] = [
  { id: 'all',  label: 'All Regions' },
  { id: 'CA',   label: '🌉 California' },
  { id: 'TX',   label: '⭐ Texas' },
  { id: 'GCC',  label: '🌙 GCC' },
  { id: 'AUNZ', label: '🦘 AU / NZ' },
];
const ROLE_TABS: { id: RoleFilter; label: string }[] = [
  { id: 'all',         label: 'All Roles' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'data',        label: 'Data' },
  { id: 'product',     label: 'Product' },
  { id: 'business',    label: 'Business' },
];

export default function Browse({ internships, applications, onApply, onBulkApply, onStatusChange }: Props) {
  const [search,      setSearch]      = useState('');
  const [regionTab,   setRegionTab]   = useState<RegionFilter>(() => (sessionStorage.getItem('br_region') as RegionFilter) ?? 'all');
  const [roleTab,     setRoleTab]     = useState<RoleFilter>(() => (sessionStorage.getItem('br_role') as RoleFilter) ?? 'all');
  const [savedSet,    setSavedSet]    = useState<Set<string>>(
  const [jobTypeTab, setJobTypeTab] = useState<JobTypeFilter>(() => (sessionStorage.getItem('br_jobtype') as JobTypeFilter) ?? 'all');
    () => new Set(Object.entries(applications).filter(([,a]) => a.status === 'saved').map(([id]) => id))
  );
  const [bulkMode,    setBulkMode]    = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [liveJobs,    setLiveJobs]    = useState<LiveJob[]>([]);

  const visible = applyFilters(internships, search, regionTab, roleTab, jobTypeTab, 'composite');

  useEffect(() => {
    const profile = loadProfile();
    fetchDailyBrowseJobs(getApiKey())
      .then(jobs => {
        const scored = jobs
          .map(j => ({ ...j, score: scoreJob(j, { skills: profile.skills ?? [], major: profile.major ?? '' }) }))
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        setLiveJobs(scored);
      })
      .catch(() => {/* network error */});
  }, []);

  function toggleSave(id: string) {
    const next = new Set(savedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      updateStatus(id, 'saved');
      next.add(id);
    }
    setSavedSet(next);
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function enterBulkMode() { setBulkMode(true); setSelectedIds(new Set()); }
  function exitBulkMode()  { setBulkMode(false); setSelectedIds(new Set()); }

  function handleBulkApply() {
    const selected = visible.filter(i => selectedIds.has(i.id));
    if (selected.length === 0) return;
    onBulkApply(selected);
    exitBulkMode();
  }

  return (
    <div className="it-pad" style={{ padding: 36, maxWidth: 1120, margin: '0 auto', paddingBottom: bulkMode && selectedIds.size > 0 ? 100 : 36 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="syne" style={{ fontWeight: 800, fontSize: 30, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: -0.5 }}>Find Internships</h1>
          <p style={{ color: 'var(--t2)', fontSize: 14, margin: 0, fontWeight: 500 }}>{internships.length}+ openings across California, Texas &amp; the GCC region</p>
        </div>
        {bulkMode ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Tap Apply on each card to select'}
            </span>
            <button className="btn-ghost" onClick={exitBulkMode} style={{ color: 'var(--t3)' }}>Cancel</button>
          </div>
        ) : (
          <button
            onClick={enterBulkMode}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--t1)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Bulk Apply
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none', display: 'flex' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <input
          className="search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by role, company or location…"
        />
      </div>

      {/* Region tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {REGION_TABS.map(t => (
          <button key={t.id} className={`ftab${regionTab === t.id ? ' active' : ''}`} onClick={() => { sessionStorage.setItem('br_region', t.id); setRegionTab(t.id); }}>{t.label}</button>
        ))}
      </div>

      {/* Role tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
        {ROLE_TABS.map(t => (
          <button key={t.id} className={`ftab${roleTab === t.id ? ' active' : ''}`} onClick={() => { sessionStorage.setItem('br_role', t.id); setRoleTab(t.id); }}>{t.label}</button>
        ))}
      </div>

      <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16, fontWeight: 500 }}>
        <span style={{ color: 'var(--acc)', fontWeight: 700 }}>{visible.length}</span> internships found
      </div>

      {/* Job cards grid */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t2)', fontSize: 15 }}>
          No internships match your filters. Try widening your search.
        </div>
      ) : (
        <div className="it-jobs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 16 }}>
          {visible.map(i => {
            const app     = applications[i.id];
            const isSaved = savedSet.has(i.id);
            const rc      = regionCode(i.region);
            const applied = app && app.status !== 'saved';
            const matchPct = i.composite_score;
            const isSelected = selectedIds.has(i.id);

            return (
              <div
                key={i.id}
                className="job-card"
                style={{ outline: bulkMode && isSelected ? '2px solid var(--acc)' : 'none', outlineOffset: 2 }}
              >
                {/* Company + save */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 11, background: logoColor(i.company), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, flexShrink: 0 }}>
                      {i.company[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.company}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.25, marginTop: 2 }}>{i.role}</div>
                    </div>
                  </div>
                  {!bulkMode && (
                    <button
                      onClick={() => toggleSave(i.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isSaved ? 'var(--acc)' : 'var(--t3)', padding: 4, transition: 'color 0.15s', flexShrink: 0 }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className={`rp rp-${rc}`}>{rc}</span>
                  <span style={{ fontSize: 12, color: 'var(--t2)' }}>{i.location}</span>
                  <span style={{ fontSize: 11, background: 'rgba(45,28,16,0.05)', color: 'var(--t2)', padding: '3px 9px', borderRadius: 100, fontWeight: 600 }}>{i.duration}</span>
                  {i.ksa_career_path && <span style={{ fontSize: 10, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', padding: '3px 8px', borderRadius: 100, fontWeight: 800, letterSpacing: 0.5 }}>KSA PATH</span>}
                </div>

                {/* Pay + match */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="syne" style={{ fontWeight: 700, fontSize: 17, color: 'var(--t1)' }}>{i.pay_display.split('(')[0].trim()}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 4, width: 54, background: 'rgba(45,28,16,0.08)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${matchPct}%`, background: 'var(--acc)', borderRadius: 100 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--acc)' }}>{matchPct}% match</span>
                  </div>
                </div>

                {/* CTA: apply or select */}
                {bulkMode ? (
                  <button
                    onClick={() => toggleSelect(i.id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: isSelected ? 'var(--acc)' : 'var(--elev)',
                      border: `1px solid ${isSelected ? 'var(--acc2)' : 'var(--bdr)'}`,
                      borderRadius: 9,
                      color: isSelected ? 'var(--on-acc)' : 'var(--t1)',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans',sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isSelected ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Selected
                      </>
                    ) : 'Apply'}
                  </button>
                ) : (
                  <button
                    className={applied ? 'btn-applied' : 'btn-acc'}
                    style={{ width: '100%' }}
                    onClick={() => applied ? onStatusChange(i.id, 'applied') : onApply(i)}
                  >
                    {applied ? `✓ ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}` : 'Apply Now'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Live Opportunities (daily rotation from API) ────────────────────── */}
      {liveJobs.length > 0 && !bulkMode && (
        <div style={{ marginTop: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 className="syne" style={{ fontWeight: 800, fontSize: 22, color: 'var(--t1)', margin: 0, letterSpacing: -0.3 }}>Live Opportunities</h2>
                <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(22,163,74,0.12)', color: '#16893f', padding: '3px 10px', borderRadius: 100, letterSpacing: 0.4 }}>
                  {liveJobs.length} TODAY
                </span>
              </div>
              <p style={{ color: 'var(--t2)', fontSize: 13, margin: '4px 0 0', fontWeight: 500 }}>
                Sourced from RemoteOK · Remotive · Jooble · The Muse &amp; more · refreshes every 24h
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
            {liveJobs
              .filter(j => matchesLiveRegion(j, regionTab) && matchesLiveRole(j, roleTab) && matchesLiveJobType(j, jobTypeTab))
              .map(j => {
                const color = logoColor(j.company || 'J');
                return (
                  <div key={j.id} style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 16, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 1px 2px rgba(45,28,16,0.04)', transition: 'all 0.18s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 28px rgba(45,28,16,0.1)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(224,50,47,0.25)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 2px rgba(45,28,16,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--bdr)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                        {(j.company || 'J')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.company}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.title}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(22,163,74,0.1)', color: '#16893f', padding: '2px 7px', borderRadius: 100 }}>LIVE</span>
                        {j.score !== undefined && <span style={{ fontSize: 10, fontWeight: 800, background: scoreColor(j.score!).bg, color: scoreColor(j.score!).text, padding: '2px 7px', borderRadius: 100 }}>{j.score}% match</span>}
                      </div>
                    </div>
                    {j.score !== undefined && (
                      <div style={{ height: 3, background: 'rgba(45,28,16,0.07)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${j.score}%`, background: scoreColor(j.score).text, borderRadius: 100, transition: 'width 0.4s ease' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {j.location && <span style={{ fontSize: 11, color: 'var(--t2)' }}>📍 {j.location}</span>}
                      {j.salary && <span style={{ fontSize: 11, color: '#16893f', fontWeight: 600, background: 'rgba(22,163,74,0.08)', padding: '2px 8px', borderRadius: 100 }}>{j.salary}</span>}
                    </div>
                    <button
                      className="btn-acc"
                      style={{ width: '100%' }}
                      onClick={() => window.open(j.url, '_blank', 'noopener,noreferrer')}
                    >
                      Apply Now →
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Floating bulk action bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 150, display: 'flex', alignItems: 'center', gap: 14, background: 'var(--t1)', borderRadius: 100, padding: '14px 22px', boxShadow: '0 8px 32px rgba(42,28,20,0.35)', pointerEvents: 'auto' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>
            {selectedIds.size}
          </div>
          <span style={{ color: '#fffaf2', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {selectedIds.size === 1 ? '1 application selected' : `${selectedIds.size} applications selected`}
          </span>
          <button
            onClick={handleBulkApply}
            style={{ background: 'var(--acc)', border: 'none', borderRadius: 100, padding: '9px 20px', color: '#fffaf2', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: "'Syne',sans-serif", whiteSpace: 'nowrap', letterSpacing: 0.2 }}
          >
            Apply to {selectedIds.size} →
          </button>
        </div>
      )}
    </div>
  );
}
