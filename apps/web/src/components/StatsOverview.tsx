'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { Users, Globe, Flame, Send, Activity } from 'lucide-react';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Leads */}
      <button
        onClick={() => onSelectTab && onSelectTab('all')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'all'
            ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Leads</span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">{stats.totalLeads}</span>
          <span className="text-xs text-slate-400">prospects</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span className="text-blue-400 font-medium">{stats.leadsWithWebsites} with website</span>
          <span className="text-[11px] text-slate-400 group-hover:text-slate-200">View all →</span>
        </div>
      </button>

      {/* Audited Sites */}
      <button
        onClick={() => onSelectTab && onSelectTab('audited')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'audited'
            ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Audited Sites</span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">{stats.auditedLeads}</span>
          <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            {auditPercentage}% audited
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>SSL, speed & mobile scanned</span>
          <span className="text-[11px] text-slate-400 group-hover:text-slate-200">Filter →</span>
        </div>
      </button>

      {/* No Website (Hot) */}
      <button
        onClick={() => onSelectTab && onSelectTab('nowebsite')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'nowebsite'
            ? 'bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">No Website (Hot)</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">{stats.leadsWithoutWebsites}</span>
          <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            🔥 High Conversion
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Ready for complete site build</span>
          <span className="text-[11px] text-slate-400 group-hover:text-slate-200">Pitch →</span>
        </div>
      </button>

      {/* Outreach Sent */}
      <button
        onClick={() => onSelectTab && onSelectTab('emailed')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'emailed'
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outreach Sent</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Send className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">{stats.emailsSent}</span>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Delivered
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Click to review emails</span>
          <span className="text-[11px] text-slate-400 group-hover:text-slate-200">Review →</span>
        </div>
      </button>
    </div>
  );
}
