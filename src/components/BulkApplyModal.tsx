import { useState, useEffect } from 'react';
import type { Internship } from '../types';
import { generateCoverLetter, generateEmailSubject } from '../utils/coverLetter';
import { updateStatus } from '../utils/storage';

interface Props {
  internships: Internship[];
  onClose: () => void;
  onDone: () => void;
}

type StepStatus = 'pending' | 'done' | 'skipped';

export default function BulkApplyModal({ internships, onClose, onDone }: Props) {
  const [current, setCurrent] = useState(0);
  const [statuses, setStatuses] = useState<StepStatus[]>(() => internships.map(() => 'pending'));
  const [copied, setCopied] = useState(false);
  const [showLetter, setShowLetter] = useState(true);

  const intern = internships[current];
  const coverLetter = intern ? generateCoverLetter(intern) : '';
  const emailSubject = intern ? generateEmailSubject(intern) : '';
  const doneCount = statuses.filter(s => s === 'done').length;
  const allFinished = statuses.every(s => s !== 'pending');

  useEffect(() => { setCopied(false); }, [current]);

  function markStatus(idx: number, st: StepStatus) {
    setStatuses(prev => {
      const next = [...prev];
      next[idx] = st;
      return next;
    });
  }

  function handleApply() {
    updateStatus(intern.id, 'applied');
    markStatus(current, 'done');
    window.open(intern.application_url, '_blank', 'noopener,noreferrer');
    advanceOrFinish();
  }

  function handleSkip() {
    markStatus(current, 'skipped');
    advanceOrFinish();
  }

  function advanceOrFinish() {
    const nextIdx = current + 1;
    if (nextIdx < internships.length) {
      setCurrent(nextIdx);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(coverLetter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleEmailApply() {
    if (!intern.recruiter_email) return;
    const body = encodeURIComponent(coverLetter);
    const subj = encodeURIComponent(emailSubject);
    window.open(`mailto:${intern.recruiter_email}?subject=${subj}&body=${body}`, '_blank');
    updateStatus(intern.id, 'applied');
    markStatus(current, 'done');
    advanceOrFinish();
  }

  const progressPct = Math.round(((statuses.filter(s => s !== 'pending').length) / internships.length) * 100);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,28,20,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--surf)', borderRadius: 22, width: '100%', maxWidth: 880, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(42,28,20,0.22)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 18, color: 'var(--t1)' }}>
              Bulk Apply — {internships.length} Application{internships.length !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 2 }}>
              {doneCount} applied · {statuses.filter(s => s === 'skipped').length} skipped · {statuses.filter(s => s === 'pending').length} remaining
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--bdr)', background: 'transparent', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'rgba(45,28,16,0.07)', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#e0322f,#f97316)', transition: 'width 0.4s ease' }} />
        </div>

        {allFinished ? (
          /* Done screen */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <div className="syne" style={{ fontWeight: 800, fontSize: 26, color: 'var(--t1)', marginBottom: 8 }}>You're done!</div>
            <div style={{ fontSize: 15, color: 'var(--t2)', marginBottom: 32, maxWidth: 360 }}>
              Applied to <strong style={{ color: 'var(--acc)' }}>{doneCount}</strong> internship{doneCount !== 1 ? 's' : ''}. Check your pipeline to track responses.
            </div>
            <button className="btn-acc" style={{ padding: '13px 32px', fontSize: 15 }} onClick={onDone}>View My Pipeline →</button>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Left: application list */}
            <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--bdr)', overflowY: 'auto', padding: '12px 8px' }}>
              {internships.map((i, idx) => {
                const st = statuses[idx];
                const isActive = idx === current;
                return (
                  <div
                    key={i.id}
                    onClick={() => setCurrent(idx)}
                    style={{ padding: '10px 12px', borderRadius: 10, marginBottom: 4, cursor: 'pointer', background: isActive ? 'rgba(224,50,47,0.08)' : 'transparent', border: `1px solid ${isActive ? 'rgba(224,50,47,0.2)' : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: st === 'done' ? '#16a34a' : st === 'skipped' ? 'var(--t3)' : isActive ? 'var(--acc)' : 'rgba(45,28,16,0.15)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? 'var(--acc)' : 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.company}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.role}</div>
                    </div>
                    {st === 'done' && <span style={{ fontSize: 13 }}>✓</span>}
                    {st === 'skipped' && <span style={{ fontSize: 11, color: 'var(--t3)' }}>—</span>}
                  </div>
                );
              })}
            </div>

            {/* Right: current application */}
            {intern && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Application header */}
                <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--bdr)', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div className="syne" style={{ fontWeight: 800, fontSize: 20, color: 'var(--t1)' }}>{intern.company}</div>
                      <div style={{ fontSize: 14, color: 'var(--t2)', marginTop: 2 }}>{intern.role} · {intern.location}</div>
                      {intern.recruiter_email && (
                        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>📧 {intern.recruiter_email}</div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', flexShrink: 0 }}>
                      {current + 1} / {internships.length}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <button className="btn-acc" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }} onClick={handleApply}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      Open & Mark Applied
                    </button>
                    {intern.recruiter_email && (
                      <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleEmailApply}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Email Recruiter
                      </button>
                    )}
                    <button
                      onClick={handleCopy}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: copied ? 'rgba(22,163,74,0.1)' : 'var(--elev)', border: `1px solid ${copied ? 'rgba(22,163,74,0.25)' : 'var(--bdr)'}`, borderRadius: 9, color: copied ? '#16893f' : 'var(--t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      {copied ? 'Copied!' : 'Copy Cover Letter'}
                    </button>
                    <button className="btn-ghost" style={{ marginLeft: 'auto', color: 'var(--t3)' }} onClick={handleSkip}>Skip →</button>
                  </div>
                </div>

                {/* Cover letter */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0 10px' }}>
                    <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Cover Letter</div>
                    <button onClick={() => setShowLetter(v => !v)} style={{ fontSize: 12, color: 'var(--t2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                      {showLetter ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showLetter && (
                    <pre style={{ margin: 0, padding: '18px 20px', background: 'var(--elev)', border: '1px solid var(--bdr)', borderRadius: 12, fontSize: 12.5, lineHeight: 1.7, color: 'var(--t1)', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {coverLetter}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
