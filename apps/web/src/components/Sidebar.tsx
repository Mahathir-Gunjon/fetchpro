'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Globe,
  Flame,
  Send,
  Trash,
  Plus,
  RotateCw,
  Trash2,
  Download,
  Chrome,
  CheckCircle2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';
import { AUTH_STORAGE_KEY } from '@/lib/auth';

export type DashboardViewTab = 'hot' | 'all' | 'audited' | 'nowebsite' | 'emailed' | 'trash';

interface SidebarProps {
  currentTab: DashboardViewTab;
  onTabChange: (tab: DashboardViewTab) => void;
  stats: DashboardStats;
  onAddLead: () => void;
  onOpenExtensionConfig: () => void;
  onResetDemo: () => void;
  onClearAllLeads: () => void;
  onExportCsv: () => void;
  isResetting?: boolean;
}

export function Sidebar({
  currentTab,
  onTabChange,
  stats,
  onAddLead,
  onOpenExtensionConfig,
  onResetDemo,
  onClearAllLeads,
  onExportCsv,
  isResetting,
}: SidebarProps) {
  const router = useRouter();

  const handleSignOut = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
    router.replace('/');
  };

  const navItems: {
    id: DashboardViewTab;
    label: string;
    icon: React.ReactNode;
    count: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'hot',
      label: '🔥 Hot Leads (Top 30%)',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      count: stats.hotLeadsCount || 0,
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'all',
      label: 'All Raw Leads',
      icon: <Users className="w-4 h-4" />,
      count: stats.totalLeads,
    },
    {
      id: 'audited',
      label: 'Audited Sites',
      icon: <Globe className="w-4 h-4" />,
      count: stats.auditedLeads,
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: 'nowebsite',
      label: 'No Website (Instant Hot)',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      count: stats.leadsWithoutWebsites,
      badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      id: 'emailed',
      label: 'Outreach Sent',
      icon: <Send className="w-4 h-4 text-emerald-400" />,
      count: stats.emailsSent,
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'trash',
      label: 'Trash / 100% OK',
      icon: <Trash className="w-4 h-4 text-slate-500" />,
      count: stats.trashLeadsCount || 0,
      badgeColor: 'text-slate-400 bg-slate-800/40 border-slate-700/40',
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col border-r border-slate-800/80 bg-slate-950/95 min-h-[calc(100vh-4rem)] p-4 space-y-6">
      {/* Top CTA */}
      <div className="space-y-2">
        <button
          onClick={onAddLead}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lead</span>
        </button>

        <button
          onClick={onOpenExtensionConfig}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-sky-300 bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/40 transition-all"
        >
          <Chrome className="w-3.5 h-3.5 text-sky-400" />
          <span>Chrome Extension</span>
        </button>
      </div>

      {/* Main Navigation Views */}
      <div className="space-y-1">
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Funnel Pipeline
        </span>
        <div className="pt-1.5 space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isActive
                      ? 'bg-white/20 text-white border-white/20'
                      : item.badgeColor || 'text-slate-400 bg-slate-900 border-slate-800'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Utilities & Actions */}
      <div className="space-y-1 pt-2 border-t border-slate-800/80">
        <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Quick Actions
        </span>
        <div className="pt-1.5 space-y-1">
          <button
            onClick={onExportCsv}
            disabled={stats.totalLeads === 0}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export to CSV</span>
          </button>

          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 disabled:opacity-40 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 text-blue-400 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Reloading...' : 'Load Sample Leads'}</span>
          </button>

          <button
            onClick={onClearAllLeads}
            disabled={stats.totalLeads === 0}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear All Leads</span>
          </button>
        </div>
      </div>

      {/* Footer Info & Sign out */}
      <div className="mt-auto pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>FetchPro Engine Live</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
