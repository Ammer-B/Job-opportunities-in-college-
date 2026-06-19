import { MapPin, DollarSign, Calendar, Star, Briefcase, Clock } from 'lucide-react';
import type { Internship, ApplicationRecord } from '../types';
import { WINDOW_LABELS, INDUSTRY_LABELS } from '../data/internships';
import ScoreBar from './ScoreBar';

const REGION_COLORS = {
  texas:      { bg: 'bg-blue-900/40',  border: 'border-blue-700/50',  badge: 'bg-blue-800 text-blue-200',  dot: 'bg-blue-400' },
  california: { bg: 'bg-purple-900/40', border: 'border-purple-700/50', badge: 'bg-purple-800 text-purple-200', dot: 'bg-purple-400' },
  ksa:        { bg: 'bg-green-900/40', border: 'border-green-700/50', badge: 'bg-green-800 text-green-200',  dot: 'bg-green-400' },
};

const REGION_LABELS = { texas: 'Texas', california: 'California', ksa: 'Saudi Arabia 🇸🇦' };

const STATUS_COLORS: Record<string, string> = {
  saved:     'bg-slate-700 text-slate-300',
  applied:   'bg-blue-700 text-blue-200',
  interview: 'bg-amber-700 text-amber-200',
  offer:     'bg-emerald-700 text-emerald-200',
  rejected:  'bg-red-900 text-red-300',
};

interface Props {
  internship: Internship;
  application?: ApplicationRecord;
  onApply: (internship: Internship) => void;
  onStatusChange: (id: string, status: ApplicationRecord['status']) => void;
}

export default function InternshipCard({ internship, application, onApply, onStatusChange }: Props) {
  const rc = REGION_COLORS[internship.region];
  const { scores } = internship;

  return (
    <div className={`rounded-xl border ${rc.bg} ${rc.border} p-5 flex flex-col gap-4 hover:brightness-110 transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rc.badge}`}>
              {REGION_LABELS[internship.region]}
            </span>
            {internship.arabic_advantage && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-800 text-amber-200 font-medium">
                Arabic +
              </span>
            )}
            {internship.ksa_career_path && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 font-medium">
                KSA Career Path
              </span>
            )}
            {internship.research_focused && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-300 font-medium">
                Research
              </span>
            )}
          </div>
          <h3 className="font-bold text-white text-base leading-tight">{internship.company}</h3>
          <p className="text-slate-300 text-sm mt-0.5">{internship.role}</p>
        </div>

        {/* Composite Score Ring */}
        <div className="shrink-0 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg
            ${internship.composite_score >= 75 ? 'border-emerald-500 text-emerald-400' :
              internship.composite_score >= 65 ? 'border-amber-500 text-amber-400' :
              'border-orange-500 text-orange-400'}`}>
            {internship.composite_score}
          </div>
          <span className="text-xs text-slate-500 mt-1">Overall</span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1"><MapPin size={11} />{internship.location}</span>
        <span className="flex items-center gap-1"><DollarSign size={11} />{internship.pay_display}</span>
        <span className="flex items-center gap-1"><Clock size={11} />{internship.duration}</span>
        {internship.deadline && (
          <span className="flex items-center gap-1"><Calendar size={11} />Deadline: {internship.deadline}</span>
        )}
      </div>

      {/* Windows */}
      <div className="flex gap-1.5 flex-wrap">
        {internship.windows.map(w => (
          <span key={w} className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
            {WINDOW_LABELS[w]}
          </span>
        ))}
        {internship.industry.map(i => (
          <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {INDUSTRY_LABELS[i]}
          </span>
        ))}
      </div>

      {/* Score Bars */}
      <div className="space-y-2 border-t border-slate-700/60 pt-3">
        <ScoreBar label="Ease of Entry"    value={scores.ease_of_entry}      compact />
        <ScoreBar label="Commute"          value={scores.ease_of_commuting}  compact />
        <ScoreBar label="Pay Rate"         value={scores.pay_rate}           compact />
        <ScoreBar label="Callback %"       value={scores.callback_percentage} compact />
        <ScoreBar label="Future Benefits"  value={scores.future_benefits}    compact />
      </div>

      {/* Why good fit */}
      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700/60 pt-3">
        <Star size={10} className="inline mr-1 text-amber-400" />
        {internship.why_good_fit}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-700/60 pt-3">
        <button
          onClick={() => onApply(internship)}
          className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Briefcase size={14} />
          One-Click Apply
        </button>

        {application ? (
          <select
            value={application.status}
            onChange={e => onStatusChange(internship.id, e.target.value as ApplicationRecord['status'])}
            className={`px-2 py-2 rounded-lg text-xs font-semibold border-0 cursor-pointer ${STATUS_COLORS[application.status]}`}
          >
            <option value="saved">Saved</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        ) : (
          <button
            onClick={() => onStatusChange(internship.id, 'saved')}
            className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
          >
            Save
          </button>
        )}
      </div>
    </div>
  );
}
