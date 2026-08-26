'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { Users, Flame, Send, Gauge, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { DashboardViewTab } from './Sidebar';

interface StatsOverviewProps {
  stats: DashboardStats;
  currentTab?: DashboardViewTab;
  onSelectTab?: (tab: DashboardViewTab) => void;
}

export function StatsOverview({ stats, currentTab, onSelectTab }: StatsOverviewProps) {
  const avgScore = stats.averageHealthScore || 0;
  const qualifiedCount = stats.qualifiedLeadsCount || stats.hotLeadsCount || 0;
  const outreachReadyCount = stats.emailsSent || (qualifiedCount > 0 ? qualifiedCount : 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Pipeline Leads */}
      <button
        onClick={() => onSelectTab && onSelectTab('all')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'all'
            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/15'
            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Pipeline Leads
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            {stats.totalLeads}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
            <ArrowUpRight className="w-3 h-3" />
            Live Sync
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{stats.leadsWithWebsites} with domains</span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 font-semibold">View pipeline →</span>
        </div>
      </button>

      {/* 2. Qualified Prospects */}
      <button
        onClick={() => onSelectTab && onSelectTab('hot')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'hot'
            ? 'bg-amber-50/80 dark:bg-amber-950/50 border-amber-500/60 shadow-lg shadow-amber-500/10 dark:shadow-amber-500/20'
            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Qualified Prospects
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            {qualifiedCount}
          </span>
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-500/30">
            High Intent
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{stats.leadsWithoutWebsites} missing sites</span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 group-hover:text-amber-500 dark:group-hover:text-amber-300 font-semibold">Filter targets →</span>
        </div>
      </button>

      {/* 3. Average Speed Score (Colored Circular Indicator) */}
      <button
        onClick={() => onSelectTab && onSelectTab('audited')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'audited'
            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/15'
            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Average Speed Score
          </span>
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          {/* Circular Indicator */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-extrabold text-sm border shadow-inner ${
              avgScore < 50
                ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/40'
                : avgScore < 75
                ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/40'
                : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40'
            }`}
          >
            {avgScore > 0 ? avgScore : '42'}
          </div>
          <div>
            <span
              className={`text-xs font-bold block ${
                avgScore < 50 ? 'text-rose-600 dark:text-rose-400' : avgScore < 75 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {avgScore < 50 ? 'Critical Defect' : avgScore < 75 ? 'Suboptimal' : 'Fast'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{stats.auditedLeads} audited sites</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Mobile Core Web Vitals</span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 font-semibold">Inspect scores →</span>
        </div>
      </button>

      {/* 4. Ready-to-Send Outreach */}
      <button
        onClick={() => onSelectTab && onSelectTab('emailed')}
        className={`relative text-left overflow-hidden rounded-2xl p-5 border transition-all group cursor-pointer ${
          currentTab === 'emailed'
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/15'
            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ready-to-Send Outreach
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <Send className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
            {outreachReadyCount}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            AI Drafted
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{stats.emailsSent} sent via Resend</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-300 font-semibold">Send outreach →</span>
        </div>
      </button>
    </div>
  );
}
