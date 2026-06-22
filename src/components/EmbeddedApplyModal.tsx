import { useState, useRef, useEffect } from 'react';
import { X, ExternalLink, Copy, CheckCircle, Mail, AlertTriangle, Maximize2, RefreshCw, ChevronLeft } from 'lucide-react';
import type { Internship } from '../types';
import { generateCoverLetter, generateEmailSubject } from '../utils/coverLetter';
import ScoreBar from './ScoreBar';

interface Props {
  internship: Internship;
  onClose: () => void;
  onApplied: (id: string) => void;
}

type Tab = 'letter' | 'scores' | 'fit';
type MobileView = 'info' | 'site';

const REGION_DOT: Record<string, string> = {
  texas: 'bg-blue-400',
  california: 'bg-purple-400',
  ksa: 'bg-green-400',
  uae: 'bg-emerald-400',
  qatar: 'bg-red-400',
  kuwait: 'bg-yellow-400',
  bahrain: 'bg-rose-400',
  oman: 'bg-teal-400',
  australia: 'bg-orange-400',
  new_zealand: 'bg-sky-400',
};

export default function EmbeddedApplyModal({ internship, onClose, onApplied }: Props) {
  const [tab, setTab]               = useState<Tab>('letter');
  const [copied, setCopied]         = useState(false);
  const [markedApplied, setMarked]  = useState(false);
  const [showHint, setShowHint]     = useState(false);
  const [iframeKey, setIframeKey]   = useState(0);
  const [mobileView, setMobileView] = useState<MobileView>('info');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>();

  const coverLetter = generateCoverLetter(internship);
  const subject = generateEmailSubject(internship);

  useEffect(() => {
    hintTimer.current = setTimeout(() => setShowHint(true), 5000);
    return () => clearTimeout(hintTimer.current);
  }, [iframeKey]);

  function handleIframeLoad() {
    clearTimeout(hintTimer.current);
    try {
      void iframeRef.current?.contentDocument?.title;
      setShowHint(true);
    } catch {
      setShowHint(false);
    }
  }

  function copyLetter() {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function openInNewTab() {
    window.open(internship.application_url, '_blank', 'noopener,noreferrer');
  }

  function openInWindow() {
    const w = Math.min(1050, window.screen.width - 60);
    const h = Math.min(920, window.screen.height - 80);
    const left = Math.max(0, window.screen.width - w - 20);
    window.open(
      internship.application_url,
      `apply_${internship.id}`,
      `width=${w},height=${h},left=${left},top=40,resizable=yes,scrollbars=yes,toolbar=yes,location=yes`
    );
  }

  function openGmail() {
    const body = encodeURIComponent(coverLetter);
    const subj = encodeURIComponent(subject);
    const to   = internship.recruiter_email ? encodeURIComponent(internship.recruiter_email) : '';
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subj}&body=${body}`,
      '_blank', 'noopener,noreferrer'
    );
  }

  function markApplied() {
    onApplied(internship.id);
    setMarked(true);
  }

  function reload() {
    setShowHint(false);
    setIframeKey(k => k + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="h-12 flex items-center gap-2 px-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${REGION_DOT[internship.region]}`} />
        <span className="font-bold text-white text-sm truncate max-w-[120px] sm:max-w-xs">{internship.company}</span>
        <span className="text-slate-500 text-xs hidden md:block truncate">— {internship.role}</span>
        <span className={`text-xs font-black px-2 py-0.5 rounded-full shrink-0 ${
          internship.composite_score >= 75 ? 'bg-emerald-900 text-emerald-400' :
          internship.composite_score >= 65 ? 'bg-red-900 text-orange-400' : 'bg-orange-900 text-orange-400'
        }`}>{internship.composite_score}</span>

        <div className="ml-auto flex items-center gap-1 shrink-0">
          {internship.recruiter_email && (
            <button onClick={openGmail}
              className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-white text-xs font-medium transition-colors">
              <Mail size={12} /> <span className="hidden lg:inline">Gmail Draft</span>
            </button>
          )}
          <button onClick={reload}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
            title="Reload site">
            <RefreshCw size={12} />
          </button>
          <button onClick={openInNewTab}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors">
            <ExternalLink size={12} /> <span className="hidden sm:inline">New Tab</span>
          </button>
          <button onClick={openInWindow}
            className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors">
            <Maximize2 size={12} /> Side Window
          </button>
          <button onClick={markApplied}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              markedApplied ? 'bg-emerald-600 text-white' : 'bg-orange-500 hover:bg-orange-400 text-slate-950'
            }`}>
            {markedApplied ? <><CheckCircle size={12} /> <span className="hidden sm:inline">Applied!</span></> : '✓ Apply'}
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 ml-1 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Info panel — full-screen on mobile, fixed sidebar on desktop */}
        <div className={`${mobileView === 'info' ? 'flex' : 'hidden'} md:flex flex-col border-r border-slate-800 bg-slate-900 overflow-hidden flex-1 md:flex-none md:w-72 md:shrink-0`}>
          {/* Tabs */}
          <div className="flex border-b border-slate-700 shrink-0">
            {(['letter', 'scores', 'fit'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  tab === t ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-400 hover:text-slate-200'
                }`}>
                {t === 'letter' ? 'Cover Letter' : t === 'scores' ? 'Scores' : 'Why You Fit'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {tab === 'letter' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Paste into the application:</p>
                  <button onClick={copyLetter}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 shrink-0 transition-colors">
                    {copied
                      ? <><CheckCircle size={11} className="text-emerald-400" /> Copied!</>
                      : <><Copy size={11} /> Copy All</>}
                  </button>
                </div>
                <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono bg-slate-800 rounded-lg p-3 border border-slate-700 select-all cursor-text">
                  {coverLetter}
                </pre>
              </div>
            )}

            {tab === 'scores' && (
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <ScoreBar label="Ease of Entry"    value={internship.scores.ease_of_entry} />
                  <ScoreBar label="Commute"          value={internship.scores.ease_of_commuting} />
                  <ScoreBar label="Pay Rate"         value={internship.scores.pay_rate} />
                  <ScoreBar label="Callback %"       value={internship.scores.callback_percentage} />
                  <ScoreBar label="Future Benefits"  value={internship.scores.future_benefits} />
                </div>
                <div className="p-3 rounded-lg bg-slate-800 flex justify-between items-center">
                  <span className="text-sm text-slate-300 font-semibold">Overall</span>
                  <span className={`text-2xl font-black ${
                    internship.composite_score >= 75 ? 'text-emerald-400' :
                    internship.composite_score >= 65 ? 'text-orange-400' : 'text-orange-400'
                  }`}>{internship.composite_score}/100</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div><p className="text-xs text-slate-500 mb-1">Pay</p><p className="text-slate-200">{internship.pay_display}</p></div>
                  <div><p className="text-xs text-slate-500 mb-1">Duration</p><p className="text-slate-200">{internship.duration}</p></div>
                  {internship.deadline && (
                    <div><p className="text-xs text-slate-500 mb-1">Deadline</p><p className="text-orange-300 font-medium">{internship.deadline}</p></div>
                  )}
                  {internship.relocation_provided && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs pt-1">
                      <CheckCircle size={13} /> Relocation / housing provided
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'fit' && (
              <div className="p-4 space-y-4">
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/40">
                  <p className="text-xs text-orange-200 leading-relaxed">{internship.why_good_fit}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2">Requirements you meet:</p>
                  <ul className="space-y-1.5">
                    {internship.requirements.map((r, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                        <CheckCircle size={11} className="text-emerald-400 mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2">Key skills to mention:</p>
                  <div className="flex flex-wrap gap-1">
                    {internship.key_skills.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">{s}</span>
                    ))}
                  </div>
                </div>
                {internship.arabic_advantage && (
                  <div className="p-3 rounded-lg bg-green-900/30 border border-green-700/40">
                    <p className="text-xs text-green-300">Arabic fluency is a significant advantage — mention it.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile: switch to site view */}
          <div className="md:hidden px-4 py-3 border-t border-slate-700 shrink-0">
            <button
              onClick={() => setMobileView('site')}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-sm rounded-xl transition-colors">
              Open Career Site →
            </button>
          </div>
        </div>

        {/* Career site panel */}
        <div className={`${mobileView === 'site' ? 'flex' : 'hidden'} md:flex flex-1 relative flex-col min-w-0 bg-white`}>

          {/* Mobile back bar */}
          <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
            <button
              onClick={() => setMobileView('info')}
              className="flex items-center gap-1 text-xs text-orange-400 font-medium">
              <ChevronLeft size={14} /> Back to Info
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={reload} className="text-slate-400 hover:text-white"><RefreshCw size={13} /></button>
              <button onClick={openInNewTab} className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded-lg">
                <ExternalLink size={11} /> New Tab
              </button>
            </div>
          </div>

          {/* "Not loading?" hint */}
          {showHint && (
            <div className="absolute top-12 md:top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-4 py-3 bg-slate-800/95 border border-slate-600 rounded-xl shadow-2xl backdrop-blur max-w-[90vw]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-400 shrink-0" />
                <span className="text-xs text-slate-300">Site blocked in-app?</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={openInWindow}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold rounded-lg transition-colors">
                  <Maximize2 size={11} /> Side Window
                </button>
                <button onClick={openInNewTab}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-200 text-xs rounded-lg transition-colors">
                  <ExternalLink size={11} /> New Tab
                </button>
                <button onClick={() => setShowHint(false)} className="text-slate-500 hover:text-slate-300">
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={internship.application_url}
            className="flex-1 w-full border-0"
            onLoad={handleIframeLoad}
            title={`${internship.company} Career Portal`}
            allow="forms"
          />
        </div>
      </div>
    </div>
  );
}
