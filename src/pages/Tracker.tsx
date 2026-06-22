import { useState, useEffect } from 'react';
import type { Internship, ApplicationRecord, AppStatus } from '../types';
import { updateStatus, removeApplication, updateNotes } from '../utils/storage';
import { logoColor, regionCode } from '../App';
import {
  getSavedLiveJobs, unsaveLiveJob,
  getLiveJobStatuses, setLiveJobStatus, removeLiveJobStatus,
  getAllLiveJobRatings,
  type LiveJob, type LiveAppStatus,
} from '../utils/jobsApi';
import { scoreColor } from '../utils/jobScore';

interface Props {
  internships: Internship[];
  applications: Record<string, ApplicationRecord>;
  onApply: (i: Internship) => void;
  onBulkApply: (internships: Internship[]) => void;
  onStatusChange: (id: string, status: AppStatus) => void;
  onRefresh: () => void;
  onNav: (page: string) => void;
}

const COLUMNS: { status: AppStatus; label: string; colorClass: string }[] = [
  { status: 'saved',     label: 'Saved',      colorClass: 'kc-saved' },
  { status: 'applied',   label: 'Applied',    colorClass: 'kc-applied' },
  { status: 'interview', label: 'Interview',  colorClass: 'kc-interview' },
  { status: 'offer',     label: 'Offer 🎉',   colorClass: 'kc-offer' },
  { status: 'rejected',  label: 'Rejected',   colorClass: 'kc-rejected' },
];

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 13, letterSpacing: -1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#f59e0b' : 'var(--bdr)' }}>★</span>
      ))}
    </span>
  );
}

export default function Tracker({ internships, applications, onApply, onBulkApply, onStatusChange, onRefresh, onNav }: Props) {
  const [bulkMode,    setBulkMode]    = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savedLive,   setSavedLive]   = useState<LiveJob[]>(() => Object.values(getSavedLiveJobs()));
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveAppStatus>>({});
  const [liveRatings,  setLiveRatings]  = useState<Record<string, number>>({});
  const [openNotes,   setOpenNotes]   = useState<Set<string>>(new Set());

  useEffect(() => {
    setSavedLive(Object.values(getSavedLiveJobs()));
    setLiveStatuses(getLiveJobStatuses());
    setLiveRatings(getAllLiveJobRatings());
  }, []);

  function handleLiveStatus(id: string, status: LiveAppStatus) {
    setLiveJobStatus(id, status);
    setLiveStatuses(getLiveJobStatuses());
  }

  function handleLiveRemove(id: string) {
    unsaveLiveJob(id);
    removeLiveJobStatus(id);
    setSavedLive(Object.values(getSavedLiveJobs()));
  }

  const iMap  = Object.fromEntries(internships.map(i => [i.id, i]));
  const total  = Object.keys(applications).length;
  const active = Object.values(applications).filter(a => ['applied','interview','offer'].includes(a.status)).length;

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function exitBulkMode() { setBulkMode(false); setSelectedIds(new Set()); }

  function handleBulkApply() {
    const selected = [...selectedIds].map(id => iMap[id]).filter(Boolean);
    if (selected.length === 0) return;
    onBulkApply(selected);
    exitBulkMode();
  }

  if (total === 0 && savedLive.length === 0) {
    return (
      <div className="it-pad" style={{ padding: 36, maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 className="syne" style={{ fontWeight: 800, fontSize: 24, color: 'var(--t1)', margin: '0 0 8px' }}>No applications yet</h2>
          <p style={{ color: 'var(--t2)', fontSize: 15, margin: '0 0 24px' }}>Save or apply to internships to start tracking your pipeline.</p>
          <button className="btn-acc" onClick={() => onNav('browse')}>Browse Internships →</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: bulkMode && selectedIds.size > 0 ? 100 : 0 }}>
      {/* Header */}
      <div className="it-pad" style={{ padding: '36px 36px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="syne" style={{ fontWeight: 800, fontSize: 30, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: -0.5 }}>Application Pipeline</h1>
          <p style={{ color: 'var(--t2)', fontSize: 14, margin: 0, fontWeight: 500 }}>
            {bulkMode ? 'Select applications to bulk apply — tap the card to select' : 'Manage your internship applications from saved to offer'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {bulkMode ? (
            <>
              {selectedIds.size > 0 && (
                <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 500 }}>{selectedIds.size} selected</span>
              )}
              <button className="btn-ghost" onClick={exitBulkMode} style={{ color: 'var(--t3)' }}>Cancel</button>
            </>
          ) : (
            <>
              <div style={{ background: 'rgba(224,50,47,0.1)', border: '1px solid rgba(224,50,47,0.22)', borderRadius: 100, padding: '8px 16px', fontSize: 13, fontWeight: 700, color: 'var(--acc)' }}>
                {active} active
              </div>
              <button
                onClick={() => { setBulkMode(true); setSelectedIds(new Set()); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 10, fontSize: 13, fontWeight: 700, color: 'var(--t1)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Bulk Apply
              </button>
              <button className="btn-acc" onClick={() => onNav('browse')}>+ Add Application</button>
            </>
          )}
        </div>
      </div>

      {/* Kanban board */}
      <div className="it-kanban" style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '24px 36px', alignItems: 'flex-start' }}>
        {COLUMNS.map(col => {
          const items = Object.values(applications).filter(a => a.status === col.status);
          return (
            <div key={col.status} className={`it-kc ${col.colorClass}`} style={{ minWidth: 262, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Column header */}
              <div className="kc-hdr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', background: 'var(--surf)', border: '1px solid var(--bdr)', borderTop: '3px solid', borderRadius: 14, boxShadow: '0 1px 2px rgba(45,28,16,0.04)' }}>
                <span className="syne" style={{ fontWeight: 700, fontSize: 14 }}>{col.label}</span>
                <span className="kc-cnt" style={{ padding: '3px 11px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>{items.length}</span>
              </div>

              {/* Cards */}
              {items.length === 0 ? (
                <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>None yet</div>
              ) : items.map(app => {
                const i = iMap[app.internship_id];
                if (!i) return null;
                const rc = regionCode(i.region);
                const isSelected = selectedIds.has(app.internship_id);

                return (
                  <div
                    key={app.internship_id}
                    className="kcard"
                    onClick={bulkMode ? () => toggleSelect(app.internship_id) : undefined}
                    style={{ cursor: bulkMode ? 'pointer' : 'default', outline: bulkMode && isSelected ? '2px solid var(--acc)' : 'none', outlineOffset: 2 }}
                  >
                    {/* Selection indicator */}
                    {bulkMode && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSelected ? 'var(--acc)' : 'var(--bdr)'}`, background: isSelected ? 'var(--acc)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.1s' }}>
                          {isSelected && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: isSelected ? 'var(--acc)' : 'var(--t3)', fontWeight: 600 }}>
                          {isSelected ? 'Selected' : 'Tap to select'}
                        </span>
                      </div>
                    )}

                    {/* Company info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: logoColor(i.company), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        {i.company[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.company}</div>
                        <div style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.role}</div>
                      </div>
                    </div>

                    {/* Region + date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span className={`rp rp-${rc}`}>{rc}</span>
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                        {app.applied_date || app.saved_date || '—'}
                      </span>
                    </div>

                    {/* Status picker — hidden in bulk mode */}
                    {!bulkMode && (
                      <select
                        value={app.status}
                        onChange={e => { onStatusChange(app.internship_id, e.target.value as AppStatus); onRefresh(); }}
                        style={{ width: '100%', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '7px 10px', fontSize: 12, color: 'var(--t1)', fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', marginBottom: 8 }}
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    )}

                    {/* Actions — hidden in bulk mode */}
                    {!bulkMode && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => onApply(i)}
                          style={{ flex: 1, padding: '6px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 7, fontSize: 11, color: 'var(--t2)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}
                        >
                          Open →
                        </button>
                        <button
                          onClick={() => { removeApplication(app.internship_id); onRefresh(); }}
                          style={{ padding: '6px 10px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 7, fontSize: 11, color: 'var(--t3)', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Notes — hidden in bulk mode */}
                    {!bulkMode && (
                      <div style={{ marginTop: 2 }}>
                        <button
                          onClick={() => setOpenNotes(prev => {
                            const s = new Set(prev);
                            if (s.has(app.internship_id)) s.delete(app.internship_id); else s.add(app.internship_id);
                            return s;
                          })}
                          style={{ background: 'none', border: 'none', fontSize: 11, color: openNotes.has(app.internship_id) ? 'var(--acc)' : 'var(--t3)', cursor: 'pointer', padding: '3px 0', fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}
                        >
                          {openNotes.has(app.internship_id) ? '▼ Note' : `▶ Note${app.notes ? ' ●' : ''}`}
                        </button>
                        {openNotes.has(app.internship_id) && (
                          <textarea
                            defaultValue={app.notes || ''}
                            onBlur={e => { updateNotes(app.internship_id, e.target.value); onRefresh(); }}
                            placeholder="Add a note…"
                            rows={3}
                            style={{ width: '100%', marginTop: 4, padding: '6px 8px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 8, fontSize: 11, color: 'var(--t1)', fontFamily: "'DM Sans',sans-serif", resize: 'vertical', boxSizing: 'border-box' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Saved Live Jobs section ─────────────────────────────────────── */}
      {savedLive.length > 0 && (
        <div style={{ padding: '0 36px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <h2 className="syne" style={{ fontWeight: 800, fontSize: 20, color: 'var(--t1)', margin: 0 }}>Saved Live Jobs</h2>
            <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(22,163,74,0.12)', color: '#16893f', padding: '3px 10px', borderRadius: 100 }}>{savedLive.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {savedLive.map(job => {
              const status = liveStatuses[job.id] || 'saved';
              const rating = liveRatings[job.id] || 0;
              const color = logoColor(job.company || 'J');
              return (
                <div key={job.id} style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 14, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {(job.company || 'J')[0].toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 2 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 6 }}>{job.company}{job.location ? ` · ${job.location}` : ''}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      {job.salary && (
                        <span style={{ fontSize: 11, color: '#16893f', fontWeight: 600, background: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: 100 }}>{job.salary}</span>
                      )}
                      {rating > 0 && <StarDisplay rating={rating} />}
                      <span style={{ fontSize: 10, color: '#16893f', fontWeight: 700, background: 'rgba(22,163,74,0.08)', padding: '2px 7px', borderRadius: 100 }}>LIVE</span>
                      {job.score != null && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: scoreColor(job.score).bg, color: scoreColor(job.score).text, padding: '2px 8px', borderRadius: 100 }}>
                          {job.score}% match
                        </span>
                      )}
                    </div>
                    {job.score != null && (
                      <div style={{ height: 3, background: 'var(--bdr)', borderRadius: 100, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${job.score}%`, background: scoreColor(job.score).text, borderRadius: 100 }} />
                      </div>
                    )}
                  </div>
                  {/* Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
                    <select
                      value={status}
                      onChange={e => handleLiveStatus(job.id, e.target.value as LiveAppStatus)}
                      style={{ background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'var(--t1)', fontFamily: "'DM Sans',sans-serif", cursor: 'pointer' }}
                    >
                      <option value="saved">Saved</option>
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => window.open(job.url, '_blank', 'noopener,noreferrer')}
                        style={{ padding: '6px 12px', background: 'var(--acc)', border: 'none', borderRadius: 7, fontSize: 11, color: '#fffaf2', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}
                      >
                        Apply →
                      </button>
                      <button
                        onClick={() => handleLiveRemove(job.id)}
                        style={{ padding: '6px 10px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 7, fontSize: 11, color: 'var(--t3)', cursor: 'pointer' }}
                      >✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating bulk action panel — top right, as designed */}
      {bulkMode && selectedIds.size > 0 && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 150, background: 'var(--surf)', border: '1px solid rgba(224,50,47,0.22)', borderRadius: 18, padding: '18px 22px', boxShadow: '0 12px 40px rgba(42,28,20,0.18)', minWidth: 240, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 16, color: 'var(--t1)', lineHeight: 1.2 }}>
              Apply to {selectedIds.size} Application{selectedIds.size !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}>
              Cover letters ready · Opens each site
            </div>
          </div>
          <button className="btn-acc" style={{ padding: '11px 18px' }} onClick={handleBulkApply}>
            Start Applying →
          </button>
          <button className="btn-ghost" style={{ padding: '8px', fontSize: 12, color: 'var(--t3)' }} onClick={exitBulkMode}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
