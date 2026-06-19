import { Trash2, ExternalLink, StickyNote } from 'lucide-react';
import type { Internship, ApplicationRecord, AppStatus } from '../types';
import { updateNotes, removeApplication } from '../utils/storage';

interface Props {
  internships: Internship[];
  applications: Record<string, ApplicationRecord>;
  onApply: (i: Internship) => void;
  onStatusChange: (id: string, status: AppStatus) => void;
  onRefresh: () => void;
}

const COLUMNS: { status: AppStatus; label: string; color: string; border: string }[] = [
  { status: 'saved',     label: 'Saved',      color: 'bg-slate-800',   border: 'border-slate-600' },
  { status: 'applied',   label: 'Applied',    color: 'bg-blue-900/40', border: 'border-blue-700' },
  { status: 'interview', label: 'Interview',  color: 'bg-amber-900/30',border: 'border-amber-600' },
  { status: 'offer',     label: 'Offer 🎉',   color: 'bg-emerald-900/30', border: 'border-emerald-600' },
  { status: 'rejected',  label: 'Rejected',   color: 'bg-red-900/20',  border: 'border-red-800' },
];

export default function Tracker({ internships, applications, onApply, onStatusChange, onRefresh }: Props) {
  const internshipMap = Object.fromEntries(internships.map(i => [i.id, i]));

  function handleRemove(id: string) {
    removeApplication(id);
    onRefresh();
  }

  function handleNoteChange(id: string, notes: string) {
    updateNotes(id, notes);
    onRefresh();
  }

  const totalActive = Object.values(applications).filter(a => ['applied', 'interview', 'offer'].includes(a.status)).length;

  if (Object.keys(applications).length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p className="text-xl font-bold text-slate-400 mb-2">No applications yet</p>
        <p className="text-sm mb-4">Save internships or click "One-Click Apply" on any card to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-lg">Application Tracker</h2>
        <span className="text-sm text-slate-400">{totalActive} active application{totalActive !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map(col => {
          const items = Object.values(applications).filter(a => a.status === col.status);
          return (
            <div key={col.status} className={`shrink-0 w-72 rounded-xl border ${col.border} ${col.color} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-white">{col.label}</h3>
                <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5 font-bold">{items.length}</span>
              </div>

              <div className="space-y-3">
                {items.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">None yet</p>
                )}
                {items.map(app => {
                  const intern = internshipMap[app.internship_id];
                  if (!intern) return null;
                  return (
                    <div key={app.internship_id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{intern.company}</p>
                          <p className="text-xs text-slate-400 truncate">{intern.role}</p>
                        </div>
                        <div className={`text-xs font-black rounded-full w-8 h-8 flex items-center justify-center shrink-0 ${
                          intern.composite_score >= 75 ? 'bg-emerald-900 text-emerald-400' :
                          intern.composite_score >= 65 ? 'bg-amber-900 text-amber-400' : 'bg-orange-900 text-orange-400'
                        }`}>
                          {intern.composite_score}
                        </div>
                      </div>

                      {app.applied_date && (
                        <p className="text-xs text-slate-500">Applied: {app.applied_date}</p>
                      )}

                      <textarea
                        className="w-full bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 p-2 resize-none focus:outline-none focus:border-amber-500 placeholder-slate-600"
                        rows={2}
                        placeholder="Notes..."
                        defaultValue={app.notes}
                        onBlur={e => handleNoteChange(app.internship_id, e.target.value)}
                      />

                      <div className="flex gap-1.5">
                        <select
                          value={app.status}
                          onChange={e => onStatusChange(app.internship_id, e.target.value as AppStatus)}
                          className="flex-1 bg-slate-700 border border-slate-600 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none"
                        >
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          onClick={() => onApply(intern)}
                          className="px-2 py-1 bg-slate-700 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 rounded transition-colors"
                          title="Open application"
                        >
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => handleRemove(app.internship_id)}
                          className="px-2 py-1 bg-slate-700 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
