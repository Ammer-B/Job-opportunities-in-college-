import { TrendingUp, MapPin, DollarSign, Award, Zap } from 'lucide-react';
import type { Internship, ApplicationRecord } from '../types';
import { REGION_LABELS } from '../data/internships';
import InternshipCard from '../components/InternshipCard';

interface Props {
  internships: Internship[];
  applications: Record<string, ApplicationRecord>;
  onApply: (i: Internship) => void;
  onStatusChange: (id: string, status: ApplicationRecord['status']) => void;
  onNav: (page: 'browse') => void;
}

export default function Dashboard({ internships, applications, onApply, onStatusChange, onNav }: Props) {
  const sorted = [...internships].sort((a, b) => b.composite_score - a.composite_score);
  const top = sorted.slice(0, 6);

  const byRegion = internships.reduce<Record<string, number>>((acc, i) => {
    acc[i.region] = (acc[i.region] ?? 0) + 1;
    return acc;
  }, {});

  const avgPay = Math.round(internships.reduce((s, i) => s + i.pay_hourly_equiv, 0) / internships.length);
  const highestScore = sorted[0];
  const appliedCount = Object.values(applications).filter(a => a.status === 'applied' || a.status === 'interview' || a.status === 'offer').length;

  const ksaOpps = internships.filter(i => i.ksa_career_path || i.region === 'ksa');

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-amber-900/30 to-slate-900/30 border border-amber-700/30 rounded-2xl p-6">
        <h1 className="text-2xl font-black text-white">Welcome back, Ammer 👋</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Texas A&M MSE Junior · GPA 3.13 · Arabic Speaker · Target: Texas, California, Saudi Arabia
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-medium">
            Spring 2026 · Fall 2026 · Summer 2027
          </span>
          <span className="px-3 py-1 bg-green-800/40 text-green-300 rounded-full text-xs font-medium">
            🇸🇦 {ksaOpps.length} KSA Opportunities
          </span>
          <span className="px-3 py-1 bg-blue-800/40 text-blue-300 rounded-full text-xs font-medium">
            {appliedCount} Applications Active
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Total Opportunities', value: internships.length, color: 'text-amber-400' },
          { icon: MapPin,     label: 'Regions Covered',     value: Object.keys(byRegion).map(r => REGION_LABELS[r] || r).join(', '), color: 'text-blue-400', small: true },
          { icon: DollarSign, label: 'Avg Pay Equiv.',      value: `$${avgPay}/hr`,      color: 'text-emerald-400' },
          { icon: Award,      label: 'Top Score',           value: `${highestScore?.composite_score}/100`, color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color, small }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <Icon size={18} className={`${color} mb-2`} />
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`font-bold mt-0.5 ${color} ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Top Pick Call-out */}
      {highestScore && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Zap size={22} className="text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1">Top Recommendation</p>
            <h3 className="text-white font-bold">{highestScore.company} — {highestScore.role}</h3>
            <p className="text-slate-400 text-sm mt-1">{highestScore.why_good_fit}</p>
            <button
              onClick={() => onApply(highestScore)}
              className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-lg transition-colors"
            >
              Apply Now — Score {highestScore.composite_score}/100
            </button>
          </div>
        </div>
      )}

      {/* Top 6 cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Top Matches For You</h2>
          <button onClick={() => onNav('browse')} className="text-sm text-amber-400 hover:text-amber-300 font-medium">
            View all {internships.length} →
          </button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {top.map(i => (
            <InternshipCard
              key={i.id}
              internship={i}
              application={applications[i.id]}
              onApply={onApply}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
