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
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
        active ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterSidebar({ filters, onChange, total, visible }: Props) {
  function toggleRegion(r: Region) {
    const next = filters.regions.includes(r) ? filters.regions.filter(x => x !== r) : [...filters.regions, r];
    onChange({ ...filters, regions: next });
  }

  function toggleIndustry(i: Industry) {
    const next = filters.industries.includes(i) ? filters.industries.filter(x => x !== i) : [...filters.industries, i];
    onChange({ ...filters, industries: next });
  }

  function toggleWindow(w: InternshipWindow) {
    const next = filters.windows.includes(w) ? filters.windows.filter(x => x !== w) : [...filters.windows, w];
    onChange({ ...filters, windows: next });
  }

  function clearAll() {
    onChange({ regions: [], industries: [], windows: [], min_composite: 0, search: '', sort_by: 'composite', show_ksa_path_only: false });
  }

  const hasFilters = filters.regions.length > 0 || filters.industries.length > 0 || filters.windows.length > 0 ||
    filters.min_composite > 0 || filters.search || filters.show_ksa_path_only;

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6 h-fit sticky top-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-amber-400" />
          <span className="font-semibold text-sm">Filters</span>
        </div>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div className="text-xs text-slate-500">
        Showing <span className="text-amber-400 font-semibold">{visible}</span> of {total} opportunities
      </div>

      {/* Search */}
      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">Search</label>
        <input
          type="text"
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder="Company, role, skill..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">Sort By</label>
        <select
          value={filters.sort_by}
          onChange={e => onChange({ ...filters, sort_by: e.target.value as SortKey })}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
        >
          <option value="composite">Composite Score</option>
          <option value="pay_rate">Pay Rate</option>
          <option value="ease_of_entry">Ease of Entry</option>
          <option value="future_benefits">Future Benefits</option>
          <option value="callback_percentage">Callback %</option>
        </select>
      </div>

      {/* Region */}
      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">Region</label>
        <div className="flex flex-col gap-1.5">
          {(Object.keys(REGION_LABELS) as Region[]).map(r => (
            <Toggle key={r} label={REGION_LABELS[r]} active={filters.regions.includes(r)} onClick={() => toggleRegion(r)} />
          ))}
        </div>
      </div>

      {/* Industry */}
      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">Industry</label>
        <div className="flex flex-col gap-1.5">
          {(Object.keys(INDUSTRY_LABELS) as Industry[]).map(i => (
            <Toggle key={i} label={INDUSTRY_LABELS[i]} active={filters.industries.includes(i)} onClick={() => toggleIndustry(i)} />
          ))}
        </div>
      </div>

      {/* Window */}
      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">Internship Window</label>
        <div className="flex flex-col gap-1.5">
          {(Object.keys(WINDOW_LABELS) as InternshipWindow[]).map(w => (
            <Toggle key={w} label={WINDOW_LABELS[w]} active={filters.windows.includes(w)} onClick={() => toggleWindow(w)} />
          ))}
        </div>
      </div>

      {/* Min composite */}
      <div>
        <label className="text-xs text-slate-400 font-medium block mb-2">
          Min Score: <span className="text-amber-400 font-bold">{filters.min_composite}</span>
        </label>
        <input
          type="range"
          min={0}
          max={90}
          step={5}
          value={filters.min_composite}
          onChange={e => onChange({ ...filters, min_composite: Number(e.target.value) })}
          className="w-full accent-amber-500"
        />
      </div>

      {/* KSA path toggle */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.show_ksa_path_only}
            onChange={e => onChange({ ...filters, show_ksa_path_only: e.target.checked })}
            className="accent-amber-500 w-4 h-4"
          />
          <span className="text-xs text-slate-400">KSA career path only</span>
        </label>
      </div>
    </aside>
  );
}
