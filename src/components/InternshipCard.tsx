import { MapPin, DollarSign, Calendar, Star, Briefcase, Clock } from 'lucide-react';
import type { Internship, ApplicationRecord } from '../types';
import { WINDOW_LABELS, INDUSTRY_LABELS, REGION_LABELS } from '../data/internships';
import ScoreBar from './ScoreBar';

const REGION_STYLE: Record<string, { bg: string; border: string; badge: string }> = {
  texas:       { bg: 'bg-blue-900/40',    border: 'border-blue-700/50',    badge: 'bg-blue-800 text-blue-200'      },
  california:  { bg: 'bg-purple-900/40',  border: 'border-purple-700/50',  badge: 'bg-purple-800 text-purple-200'  },
  ksa:         { bg: 'bg-green-900/40',   border: 'border-green-700/50',   badge: 'bg-green-800 text-green-200'    },
  uae:         { bg: 'bg-emerald-900/40', border: 'border-emerald-700/50', badge: 'bg-emerald-800 text-emerald-200'},
  qatar:       { bg: 'bg-red-900/40',     border: 'border-red-700/50',     badge: 'bg-red-800 text-red-200'        },
  kuwait:      { bg: 'bg-yellow-900/40',  border: 'border-yellow-700/50',  badge: 'bg-yellow-800 text-yellow-200'  },
  bahrain:     { bg: 'bg-rose-900/40',    border: 'border-rose-700/50',    badge: 'bg-rose-800 text-rose-200'      },
  oman:        { bg: 'bg-teal-900/40',    border: 'border-teal-700/50',    badge: 'bg-teal-800 text-teal-200'      },
  australia:   { bg: 'bg-orange-900/40',  border: 'border-orange-700/50',  badge: 'bg-orange-800 text-orange-200'  },
  new_zealand: { bg: 'bg-sky-900/40',     border: 'border-sky-700/50',     badge: 'bg-sky-800 text-sky-200'        },
};

const STATUS_COLORS: Record<string, string> = {
  saved:     'bg-slate-700 text-slate-300',
  applied:   'bg-sky-800 text-sky-200',
  interview: 'bg-orange-700 text-white',
  offer:     'bg-emerald-700 text-emerald-200',
  rejected:  'bg-red-900 text-red-300',
};

interface Props {
  internship: Internship;
  application?: ApplicationRecord;
  onApply: (i: Internship) => void;
  onStatusChange: (id: string, status: ApplicationRecord['status']) => void;
}

export default function InternshipCard({ internship, application, onApply, onStatusChange }: Props) {
  const rc = REGION_STYLE[internship.region];

  return (
    <div className={`rounded-xl border ${rc.bg} ${rc.border} p-5 flex flex-col gap-4 hover:brightness-110 transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rc.badge}`}>
              {REGION_LABELS[internship.region]}
            </span>
            {internship.arabic_advantage && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-800 text-orange-200 font-medium">Arabic +</span>
            )}
            {internship.ksa_career_path && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 font-medium">KSA Path</span>
            )}
            {internship.research_focused && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-300 font-medium">Research</span>
            )}
          </div>
          <h3 className="font-bold text-white text-base leading-tight">{internship.company}</h3>
          <p className="text-slate-300 text-sm mt-0.5">{internship.role}</p>
        </div>

        <div className="shrink-0 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-black text-lg ${
            internship.composite_score >= 75 ? 'border-white text-white' :
            internship.composite_score >= 55 ? 'border-orange-500 text-orange-400' :
            'border-red-500 text-red-400'
          }`}>
            {internship.composite_score}
          </div>
          <span className="text-xs text-slate-500 mt-1">Score</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1"><MapPin size={11} />{internship.location}</span>
        <span className="flex items-center gap-1"><DollarSign size={11} />{internship.pay_display}</span>
        <span className="flex items-center gap-1"><Clock size={11} />{internship.duration}</span>
        {internship.deadline && (
          <span className="flex items-center gap-1"><Calendar size={11} />Due: {internship.deadline}</span>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {internship.windows.map(w => (
          <span key={w} className="text-xs px-2 py-0.5 rounded bg-sky-900/50 text-sky-300 font-medium">{WINDOW_LABELS[w]}</span>
        ))}
        {internship.industry.map(i => (
          <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">{INDUSTRY_LABELS[i]}</span>
        ))}
      </div>

      <div className="space-y-2 border-t border-slate-700/60 pt-3">
        <ScoreBar label="Ease of Entry"   value={internship.scores.ease_of_entry}      compact />
        <ScoreBar label="Commute"         value={internship.scores.ease_of_commuting}  compact />
        <ScoreBar label="Pay Rate"        value={internship.scores.pay_rate}           compact />
        <ScoreBar label="Callback %"      value={internship.scores.callback_percentage} compact />
        <ScoreBar label="Future Benefits" value={internship.scores.future_benefits}    compact />
      </div>

      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700/60 pt-3">
        <Star size={10} className="inline mr-1 text-orange-400" />
        {internship.why_good_fit}
      </p>

      <div className="flex items-center gap-2 border-t border-slate-700/60 pt-3">
        <button
          onClick={() => onApply(internship)}
          className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-sm transition-colors flex items-center justify-center gap-2"
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
