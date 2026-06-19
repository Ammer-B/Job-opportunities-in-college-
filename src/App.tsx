import { useState, useCallback } from 'react';
import type { Internship, ApplicationRecord, FilterState, AppStatus } from './types';
import { INTERNSHIPS } from './data/internships';
import { loadApplications, saveApplication, updateStatus } from './utils/storage';
import Header from './components/Header';
import ApplyModal from './components/ApplyModal';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Tracker from './pages/Tracker';
import Profile from './pages/Profile';

type Page = 'dashboard' | 'browse' | 'tracker' | 'profile';

const DEFAULT_FILTERS: FilterState = {
  regions: [],
  industries: [],
  windows: [],
  min_composite: 0,
  search: '',
  sort_by: 'composite',
  show_ksa_path_only: false,
};

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [applyTarget, setApplyTarget] = useState<Internship | null>(null);
  const [applications, setApplications] = useState<Record<string, ApplicationRecord>>(loadApplications);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const refreshApps = useCallback(() => {
    setApplications(loadApplications());
  }, []);

  function handleApply(internship: Internship) {
    setApplyTarget(internship);
  }

  function handleApplied(id: string) {
    updateStatus(id, 'applied');
    refreshApps();
  }

  function handleStatusChange(id: string, status: AppStatus) {
    updateStatus(id, status);
    refreshApps();
  }

  const appliedCount = Object.values(applications).filter(
    a => ['applied', 'interview', 'offer'].includes(a.status)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <Header page={page} onNav={setPage} appliedCount={appliedCount} />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {page === 'dashboard' && (
          <Dashboard
            internships={INTERNSHIPS}
            applications={applications}
            onApply={handleApply}
            onStatusChange={handleStatusChange}
            onNav={(p) => setPage(p)}
          />
        )}
        {page === 'browse' && (
          <Browse
            internships={INTERNSHIPS}
            applications={applications}
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApply}
            onStatusChange={handleStatusChange}
          />
        )}
        {page === 'tracker' && (
          <Tracker
            internships={INTERNSHIPS}
            applications={applications}
            onApply={handleApply}
            onStatusChange={handleStatusChange}
            onRefresh={refreshApps}
          />
        )}
        {page === 'profile' && <Profile />}
      </main>

      {applyTarget && (
        <ApplyModal
          internship={applyTarget}
          onClose={() => setApplyTarget(null)}
          onApplied={handleApplied}
        />
      )}
    </div>
  );
}
