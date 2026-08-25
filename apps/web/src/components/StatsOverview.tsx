'use client';

import React from 'react';
import { DashboardStats } from '@/lib/types';
import { Users, Globe, Activity, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

interface StatsOverviewProps {
  stats: DashboardStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const auditPercentage = stats.totalLeads > 0
    ? Math.round((stats.auditedLeads / stats.totalLeads) * 100)
    : 0;

  const emailRate = stats.totalLeads > 0
    ? Math.round((stats.emailsSent / stats.totalLeads) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Leads */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-sm hover:border-slate-700/80 transition-all group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Leads</span>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">{stats.totalLeads}</span>
          <span className="text-xs text-slate-400">businesses</span>
        </div>
        <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
          <span className="text-blue-400 font-medium">{stats.leadsWithWebsites} with website</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium">{stats.leadsWithPhones} with phone</span>
        </div>
      </div>

      {/* Audited Websites */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-sm hover:border-slate-700/80 transition-all group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Audited Sites</span>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Globe className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">{stats.auditedLeads}</span>
          <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            {auditPercentage}% audited
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Scanned for SSL, speed, mobile & backdated dates
        </div>
      </div>

      {/* Average Health Score */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-sm hover:border-slate-700/80 transition-all group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Health Score</span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">{stats.averageHealthScore}</span>
          <span className="text-xs text-slate-400">/ 100</span>
          {stats.averageHealthScore < 60 ? (
            <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
              High Redesign Potential
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Moderate Quality
            </span>
          )}
        </div>
        <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.averageHealthScore >= 80
                ? 'bg-emerald-500'
                : stats.averageHealthScore >= 50
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, stats.averageHealthScore))}%` }}
          />
        </div>
      </div>

      {/* Outreach Sent */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-sm hover:border-slate-700/80 transition-all group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Outreach Sent</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Send className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">{stats.emailsSent}</span>
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Resend API Active
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Personalized AI cold pitches delivered
        </div>
      </div>
    </div>
  );
}
