'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { Users, Globe, Flame, Send, Sparkles } from 'lucide-react';
import { DashboardViewTab } from './Sidebar';

interface StatsOverviewProps {
  stats: DashboardStats;
  currentTab?: DashboardViewTab;
  onSelectTab?: (tab: DashboardViewTab) => void;
}

export function StatsOverview({ stats, currentTab, onSelectTab }: StatsOverviewProps) {
  const auditPercentage =
    stats.totalLeads > 0 ? Math.round((stats.auditedLeads / stats.totalLeads) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Hot Leads (Top 20-30%) */}
      <button
        onClick={() => onSelectTab && onSelectTab('hot')}
        className={`relative text-left overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all group cursor-pointer ${
          currentTab === 'hot'
            ? 'bg-amber-950/50 border-amber-500/60 shadow-lg shadow-amber-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
            🔥 Hot Leads (Top 30%)
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {stats.hotLeadsCount || 0}
          </span>
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
            High Priority
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Target agency outreach</span>
          <span className="text-[10px] text-amber-400 group-hover:text-amber-300">Pitch now →</span>
        </div>
      </button>

      {/* 2. Total Ingested Leads */}
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
          <span className="text-[11px] text-slate-400">raw</span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="text-blue-400 font-medium">{stats.leadsWithWebsites} with sites</span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-200">View all →</span>
        </div>
      </button>

      {/* 3. Audited Sites */}
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
          <span>PageSpeed & Schema</span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Filter →</span>
        </div>
      </button>

      {/* 4. No Website (Instant Hot) */}
      <button
        onClick={() => onSelectTab && onSelectTab('nowebsite')}
        className={`relative text-left overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all group cursor-pointer ${
          currentTab === 'nowebsite'
            ? 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">No Website</span>
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{stats.leadsWithoutWebsites}</span>
          <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
            New Site
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Complete site build pitch</span>
          <span className="text-[10px] text-slate-400 group-hover:text-slate-200">Pitch →</span>
        </div>
      </button>

      {/* 5. Outreach Sent */}
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
            Delivered
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
