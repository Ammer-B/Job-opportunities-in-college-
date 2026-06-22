interface ScoreBarProps {
  label: string;
  value: number;
  compact?: boolean;
}

function scoreColor(v: number) {
  if (v >= 75) return 'bg-white';
  if (v >= 55) return 'bg-orange-500';
  return 'bg-red-500';
}

function scoreTextColor(v: number) {
  if (v >= 75) return 'text-white';
  if (v >= 55) return 'text-orange-400';
  return 'text-red-400';
}

export default function ScoreBar({ label, value, compact = false }: ScoreBarProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-400 w-24 shrink-0 truncate">{label}</span>
        <div className="flex-1 bg-slate-700 rounded-full h-1.5 min-w-0">
          <div className={`h-1.5 rounded-full transition-all ${scoreColor(value)}`} style={{ width: `${value}%` }} />
        </div>
        <span className={`text-xs font-semibold w-7 text-right shrink-0 ${scoreTextColor(value)}`}>{value}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={`text-xs font-bold ${scoreTextColor(value)}`}>{value}/100</span>
      </div>
      <div className="bg-slate-700 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${scoreColor(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
