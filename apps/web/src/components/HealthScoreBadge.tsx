import React from 'react';

interface HealthScoreBadgeProps {
  score?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
}

export function HealthScoreBadge({ score, size = 'md', showLabel = true, onClick }: HealthScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50 ${
          onClick ? 'cursor-pointer hover:bg-slate-700/80 transition-colors' : ''
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        Unaudited
      </span>
    );
  }

  let colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  let dotColor = 'bg-rose-500';
  let qualityText = 'Critical';

  if (score >= 80) {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    dotColor = 'bg-emerald-400';
    qualityText = 'Excellent';
  } else if (score >= 50) {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    dotColor = 'bg-amber-400';
    qualityText = 'Fair / Fixes Needed';
  }

  if (size === 'sm') {
    return (
      <span
        onClick={onClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${colorClasses} ${
          onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
        {score}
      </span>
    );
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${colorClasses} ${
        onClick ? 'cursor-pointer hover:opacity-90 hover:scale-[1.02] transition-all' : ''
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></span>
      <span>{score}/100</span>
      {showLabel && <span className="opacity-75 text-[11px] font-normal">({qualityText})</span>}
    </span>
  );
}
