'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { Users, Globe, Flame, Link2Off, Send } from 'lucide-react';
import { DashboardViewTab } from './Sidebar';

interface StatsOverviewProps {
  stats: DashboardStats;
  currentTab?: DashboardViewTab;
  onSelectTab?: (tab: DashboardViewTab) => void;
}

export function StatsOverview({ stats, currentTab, onSelectTab }: StatsOverviewProps) {
  const auditPercentage = stats.totalLeads > 0
    ? Math.round((stats.auditedLeads / stats.totalLeads) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* Total Leads */}
      <button
        onClick={() => onSelectTab && onSelectTab('all')}
        className={`relative text-left overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all group cursor-pointer ${
          currentTab === 'all'
            ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Leads</span>
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{stats.totalLeads}</span>
          <span className="text-[11px] text-slate-400">leads</span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="text-blue-400 font-medium">{stats.leadsWithWebsites} with site</span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-200">View all →</span>
        </div>
      </button>

      {/* Audited Sites */}
      <button
        onClick={() => onSelectTab && onSelectTab('audited')}
        className={`relative text-left overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all group cursor-pointer ${
          currentTab === 'audited'
            ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Audited Sites</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Globe className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{stats.auditedLeads}</span>
          <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
            {auditPercentage}%
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>SSL, speed & mobile</span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Filter →</span>
        </div>
      </button>

      {/* GMB Unlinked Sites (High Intent Finding) */}
      <button
        onClick={() => onSelectTab && onSelectTab('unlinked')}
        className={`relative text-left overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all group cursor-pointer ${
          currentTab === 'unlinked'
            ? 'bg-sky-950/40 border-sky-500/50 shadow-lg shadow-sky-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">GMB Unlinked</span>
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
            <Link2Off className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{stats.leadsWithUnlinkedWebsites || 0}</span>
          <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
            ⚡ High Leak
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Found via Web Results</span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Pitch →</span>
        </div>
      </button>

      {/* No Website (Hot) */}
      <button
        onClick={() => onSelectTab && onSelectTab('nowebsite')}
        className={`relative text-left overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all group cursor-pointer ${
          currentTab === 'nowebsite'
            ? 'bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">No Website</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{stats.leadsWithoutWebsites}</span>
          <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
            🔥 Redesign
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Needs new site build</span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Pitch →</span>
        </div>
      </button>

      {/* Outreach Sent */}
      <button
        onClick={() => onSelectTab && onSelectTab('emailed')}
        className={`relative text-left overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all group cursor-pointer ${
          currentTab === 'emailed'
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Outreach Sent</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Send className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{stats.emailsSent}</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
            Sent
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Click to review emails</span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Review →</span>
        </div>
      </button>
    </div>
  );
}
