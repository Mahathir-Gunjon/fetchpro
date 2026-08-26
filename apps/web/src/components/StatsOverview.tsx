'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { Users, Flame, Send, Activity, ArrowUpRight, Sparkles } from 'lucide-react';
import { DashboardViewTab } from './Sidebar';

interface StatsOverviewProps {
  stats: DashboardStats;
  currentTab?: DashboardViewTab;
  onSelectTab?: (tab: DashboardViewTab) => void;
}

export function StatsOverview({ stats, currentTab, onSelectTab }: StatsOverviewProps) {
  const avgScore = stats.averageHealthScore || 0;
  const qualifiedCount = stats.qualifiedLeadsCount || stats.hotLeadsCount || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Leads Extracted */}
      <button
        onClick={() => onSelectTab && onSelectTab('all')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'all'
            ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Leads Extracted
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {stats.totalLeads}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
            <ArrowUpRight className="w-3 h-3" />
            +100% Live
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>{stats.leadsWithWebsites} with domains</span>
          <span className="text-[11px] text-blue-400 group-hover:text-blue-300">View pipeline →</span>
        </div>
      </button>

      {/* 2. Qualified Opportunities */}
      <button
        onClick={() => onSelectTab && onSelectTab('hot')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'hot'
            ? 'bg-amber-950/50 border-amber-500/60 shadow-lg shadow-amber-500/15'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Qualified Opportunities
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {qualifiedCount}
          </span>
          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
            High Intent
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Outdated / Slow / No site</span>
          <span className="text-[11px] text-amber-400 group-hover:text-amber-300">Filter targets →</span>
        </div>
      </button>

      {/* 3. Outreach Sent */}
      <button
        onClick={() => onSelectTab && onSelectTab('emailed')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'emailed'
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Outreach Sent
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Send className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {stats.emailsSent}
          </span>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Resend Dispatched
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>Emails delivered</span>
          <span className="text-[11px] text-emerald-400 group-hover:text-emerald-300">Review sent →</span>
        </div>
      </button>

      {/* 4. Average Lead Health Score */}
      <button
        onClick={() => onSelectTab && onSelectTab('audited')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'audited'
            ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Average Health Score
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {avgScore > 0 ? avgScore : '42'}
            <span className="text-base font-normal text-slate-400">/100</span>
          </span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
              avgScore < 50
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : avgScore < 75
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {avgScore < 50 ? 'High Defect' : avgScore < 75 ? 'Moderate' : 'Healthy'}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
          <span>{stats.auditedLeads} sites audited</span>
          <span className="text-[11px] text-indigo-400 group-hover:text-indigo-300">Inspect scores →</span>
        </div>
      </button>
    </div>
  );
}
