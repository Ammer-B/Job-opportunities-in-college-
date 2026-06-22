import { SlidersHorizontal, X } from 'lucide-react';
import type { FilterState, Region, Industry, InternshipWindow, SortKey } from '../types';
import { REGION_LABELS, INDUSTRY_LABELS, WINDOW_LABELS } from '../data/internships';

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  total: number;
  visible: number;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left w-full ${
        active
          ? 'bg-orange-500 text-slate-950'
          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterSidebar({ filters, onChange, total, visible }: Props) {
  const toggleRegion   = (r: Region)           => onChange({ ...filters, regions:    filters.regions.includes(r)    ? filters.regions.filter(x => x !== r)    : [...filters.regions, r] });
  const toggleIndustry = (i: Industry)          => onChange({ ...filters, industries: filters.industries.includes(i) ? filters.industries.filter(x => x !== i) : [...filters.industries, i] });
  const toggleWindow   = (w: InternshipWindow)  => onChange({ ...filters, windows:    filters.windows.includes(w)    ? filters.windows.filter(x => x !== w)    : [...filters.windows, w] });

  const hasFilters = filters.regions.length > 0 || filters.industries.length > 0 ||
    filters.windows.length > 0 || filters.min_composite > 0 || filters.search || filters.show_ksa_path_only;

  const clear = () => onChange({ regions: [], industries: [], windows: [], min_composite: 0, search: '', sort_by: 'composite', show_ksa_path_only: false });

  return (
    <aside className="w-60 shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 h-fit sticky top-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-orange-400" />
          <span className="font-semibold text-sm">Filters</span>
        </div>
        {hasFilters && (
          <button onClick={clear} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Showing <span className="text-orange-400 font-semibold">{visible}</span> of {total}
      </p>

      <div>
        <input
          type="text"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="Search company, role, skill..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
        />
      </div>

      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">Sort By</label>
        <select
          value={filters.sort_by}
          onChange={e => onChange({ ...filters, sort_by: e.target.value as SortKey })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500"
        >
          <option value="composite">Composite Score</option>
          <option value="pay_rate">Pay Rate</option>
          <option value="ease_of_entry">Ease of Entry</option>
          <option value="future_benefits">Future Benefits</option>
          <option value="callback_percentage">Callback %</option>
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">Region</label>
        <div className="flex flex-col gap-1.5">
          {(Object.keys(REGION_LABELS) as Region[]).map(r => (
            <Toggle key={r} label={REGION_LABELS[r]} active={filters.regions.includes(r)} onClick={() => toggleRegion(r)} />
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">Industry</label>
        <div className="flex flex-col gap-1.5">
          {(Object.keys(INDUSTRY_LABELS) as Industry[]).map(i => (
            <Toggle key={i} label={INDUSTRY_LABELS[i]} active={filters.industries.includes(i)} onClick={() => toggleIndustry(i)} />
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">Internship Window</label>
        <div className="flex flex-col gap-1.5">
          {(Object.keys(WINDOW_LABELS) as InternshipWindow[]).map(w => (
            <Toggle key={w} label={WINDOW_LABELS[w]} active={filters.windows.includes(w)} onClick={() => toggleWindow(w)} />
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">
          Min Score: <span className="text-orange-400 font-bold">{filters.min_composite}</span>
        </label>
        <input
          type="range" min={0} max={90} step={5}
          value={filters.min_composite}
          onChange={e => onChange({ ...filters, min_composite: Number(e.target.value) })}
          className="w-full accent-orange-500"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.show_ksa_path_only}
          onChange={e => onChange({ ...filters, show_ksa_path_only: e.target.checked })}
          className="accent-orange-500 w-4 h-4"
        />
        <span className="text-xs text-slate-400">KSA career path only</span>
      </label>
    </aside>
  );
}
