import type { Internship, ApplicationRecord, FilterState, SortKey } from '../types';
import InternshipCard from '../components/InternshipCard';
import FilterSidebar from '../components/FilterSidebar';

interface Props {
  internships: Internship[];
  applications: Record<string, ApplicationRecord>;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  onApply: (i: Internship) => void;
  onStatusChange: (id: string, status: ApplicationRecord['status']) => void;
}

function applyFilters(internships: Internship[], filters: FilterState): Internship[] {
  let result = internships;

  if (filters.regions.length > 0) result = result.filter(i => filters.regions.includes(i.region));
  if (filters.industries.length > 0) result = result.filter(i => i.industry.some(ind => filters.industries.includes(ind)));
  if (filters.windows.length > 0) result = result.filter(i => i.windows.some(w => filters.windows.includes(w)));
  if (filters.min_composite > 0) result = result.filter(i => i.composite_score >= filters.min_composite);
  if (filters.show_ksa_path_only) result = result.filter(i => i.ksa_career_path || i.region === 'ksa');

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(i =>
      i.company.toLowerCase().includes(q) ||
      i.role.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      i.key_skills.some(s => s.toLowerCase().includes(q)) ||
      i.industry.some(s => s.toLowerCase().includes(q))
    );
  }

  const scoreKey: Record<SortKey, (i: Internship) => number> = {
    composite:          i => i.composite_score,
    pay_rate:           i => i.scores.pay_rate,
    ease_of_entry:      i => i.scores.ease_of_entry,
    future_benefits:    i => i.scores.future_benefits,
    callback_percentage: i => i.scores.callback_percentage,
  };
  result = [...result].sort((a, b) => scoreKey[filters.sort_by](b) - scoreKey[filters.sort_by](a));

  return result;
}

export default function Browse({ internships, applications, filters, onFiltersChange, onApply, onStatusChange }: Props) {
  const visible = applyFilters(internships, filters);

  return (
    <div className="flex gap-6 items-start">
      <FilterSidebar filters={filters} onChange={onFiltersChange} total={internships.length} visible={visible.length} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white text-lg">
            All Opportunities
            <span className="ml-2 text-sm font-normal text-slate-400">({visible.length} shown)</span>
          </h2>
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg font-medium mb-2">No results match your filters</p>
            <p className="text-sm">Try adjusting your filters or clearing them.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map(i => (
              <InternshipCard
                key={i.id}
                internship={i}
                application={applications[i.id]}
                onApply={onApply}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
