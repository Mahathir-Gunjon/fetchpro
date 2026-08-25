'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Chrome, Plus, RotateCw, LogOut, Shield } from 'lucide-react';
import { AUTH_STORAGE_KEY } from '@/lib/auth';

interface NavbarProps {
  onAddLead?: () => void;
  onOpenExtensionConfig?: () => void;
  onResetDemo?: () => void;
  isResetting?: boolean;
}

export function Navbar({ onAddLead, onOpenExtensionConfig, onResetDemo, isResetting }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
    router.replace('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                FetchPro
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onOpenExtensionConfig && (
            <button
              onClick={onOpenExtensionConfig}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-300 bg-sky-950/50 hover:bg-sky-900/50 border border-sky-800/50 hover:border-sky-700 transition-all shadow-sm"
            >
              <Chrome className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Scraper Extension</span>
            </button>
          )}

          {onAddLead && (
            <button
              onClick={onAddLead}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 transition-colors"
            title="Sign Out of FetchPro"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
