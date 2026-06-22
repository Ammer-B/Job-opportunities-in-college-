import { useState } from 'react';
import { X, ExternalLink, Copy, CheckCircle, Mail, FileText } from 'lucide-react';
import type { Internship } from '../types';
import { generateCoverLetter, generateEmailSubject } from '../utils/coverLetter';
import ScoreBar from './ScoreBar';

interface Props {
  internship: Internship;
  onClose: () => void;
  onApplied: (id: string) => void;
}

export default function ApplyModal({ internship, onClose, onApplied }: Props) {
  const [tab, setTab] = useState<'overview' | 'letter'>('overview');
  const [copied, setCopied] = useState(false);
  const [markedApplied, setMarkedApplied] = useState(false);

  const coverLetter = generateCoverLetter(internship);
  const subject = generateEmailSubject(internship);

  function copyLetter() {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openApplication() {
    window.open(internship.application_url, '_blank', 'noopener,noreferrer');
    setTimeout(() => {
      onApplied(internship.id);
      setMarkedApplied(true);
    }, 800);
  }

  function openEmailDraft() {
    const body = encodeURIComponent(coverLetter);
    const subj = encodeURIComponent(subject);
    const to = internship.recruiter_email ? encodeURIComponent(internship.recruiter_email) : '';
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subj}&body=${body}`,
      '_blank', 'noopener,noreferrer'
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">{internship.company}</h2>
            <p className="text-slate-400 text-sm mt-0.5">{internship.role} · {internship.location}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors mt-0.5">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-700">
          {(['overview', 'letter'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium transition-colors capitalize ${
                tab === t ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'overview' ? 'Overview & Scores' : 'Cover Letter'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'overview' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Score Breakdown</h3>
                <div className="space-y-3">
                  <ScoreBar label="Ease of Entry"    value={internship.scores.ease_of_entry} />
                  <ScoreBar label="Ease of Commuting" value={internship.scores.ease_of_commuting} />
                  <ScoreBar label="Pay Rate"         value={internship.scores.pay_rate} />
                  <ScoreBar label="Callback %"       value={internship.scores.callback_percentage} />
                  <ScoreBar label="Future Benefits"  value={internship.scores.future_benefits} />
                </div>
                <div className="mt-4 p-3 rounded-lg bg-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-300">Composite Score</span>
                  <span className={`text-2xl font-black ${
                    internship.composite_score >= 75 ? 'text-emerald-400' :
                    internship.composite_score >= 65 ? 'text-orange-400' : 'text-orange-400'
                  }`}>{internship.composite_score}/100</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">About this Role</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{internship.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Requirements</h3>
                <ul className="space-y-1">
                  {internship.requirements.map((r, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <CheckCircle size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-red-900/30 border border-red-700/40">
                <h3 className="text-sm font-semibold text-orange-300 mb-2">Why You're a Strong Fit</h3>
                <p className="text-sm text-orange-200/80 leading-relaxed">{internship.why_good_fit}</p>
              </div>

              {internship.relocation_provided && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle size={14} />
                  Relocation / housing / flights provided
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-300">Auto-Generated Cover Letter</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Tailored to your resume + this specific role</p>
                </div>
                <button
                  onClick={copyLetter}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
                >
                  {copied ? <CheckCircle size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs text-slate-300 bg-slate-800 rounded-lg p-4 whitespace-pre-wrap leading-relaxed font-mono border border-slate-700 max-h-96 overflow-y-auto">
                {coverLetter}
              </pre>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700 flex gap-3 flex-wrap">
          {internship.recruiter_email && (
            <button
              onClick={openEmailDraft}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
            >
              <Mail size={15} />
              Draft in Gmail
            </button>
          )}
          <button
            onClick={() => setTab('letter')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            <FileText size={15} />
            Cover Letter
          </button>
          <button
            onClick={openApplication}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors ${
              markedApplied
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-orange-500 hover:bg-orange-400 text-slate-950'
            }`}
          >
            {markedApplied
              ? <><CheckCircle size={15} /> Marked as Applied</>
              : <><ExternalLink size={15} /> Open Application Portal</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
