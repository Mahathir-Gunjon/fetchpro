'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Chrome, Plus, RotateCw, Database, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onAddLead?: () => void;
  onOpenExtensionConfig?: () => void;
  onResetDemo?: () => void;
  isResetting?: boolean;
}

export function Navbar({ onAddLead, onOpenExtensionConfig, onResetDemo, isResetting }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                LeadFlow
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                SaaS v1.0
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-slate-800/80 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Overview
            </Link>
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              Leads Dashboard
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onResetDemo && (
            <button
              onClick={onResetDemo}
              disabled={isResetting}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
              title="Reset sample leads with rich mock audit data"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isResetting ? 'Reloading...' : 'Reload Demo Leads'}</span>
            </button>
          )}

          {onOpenExtensionConfig && (
            <button
              onClick={onOpenExtensionConfig}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-300 bg-sky-950/50 hover:bg-sky-900/50 border border-sky-800/50 hover:border-sky-700 transition-all shadow-sm"
            >
              <Chrome className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Chrome Extension</span>
            </button>
          )}

          {onAddLead && (
            <button
              onClick={onAddLead}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
