import { LayoutDashboard, Search, Kanban, User } from 'lucide-react';

type Page = 'dashboard' | 'browse' | 'tracker' | 'profile';

interface Props {
  page: Page;
  onNav: (p: Page) => void;
  appliedCount: number;
}

const NAV = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'browse'    as Page, label: 'Browse All',  icon: Search },
  { id: 'tracker'   as Page, label: 'My Tracker',  icon: Kanban },
  { id: 'profile'   as Page, label: 'Profile',     icon: User },
];

export default function Header({ page, onNav, appliedCount }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-slate-950 font-black text-sm">IT</span>
          </div>
          <span className="font-bold text-white hidden sm:block">InternTrack</span>
        </div>

        <nav className="flex items-center gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNav(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                page === id ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:block">{label}</span>
              {id === 'tracker' && appliedCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-xs font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {appliedCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
