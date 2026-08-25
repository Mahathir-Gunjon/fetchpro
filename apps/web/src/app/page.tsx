'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Chrome,
  Globe,
  Sparkles,
  Send,
  ShieldCheck,
  Smartphone,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Database,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 sm:pt-28 sm:pb-36">
        {/* Glow Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/30 via-indigo-600/20 to-purple-600/30 blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-8 backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>All-in-One B2B Lead Extractor & Automated Audit SaaS</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Turn Google Maps Searches into{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              High-Paying Agency Clients
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Extract local business leads with our Manifest V3 Chrome Extension. Automatically audit their websites for SSL, mobile responsiveness, and outdated copyright dates—then send personalized <strong>Gemini AI</strong> cold emails in 1 click.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/30 hover:scale-[1.02] transition-all"
            >
              <span>Launch SaaS Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <Chrome className="w-4 h-4 text-sky-400" />
              <span>Chrome Extension Setup</span>
            </Link>
          </div>

          {/* Live Pipeline Visualizer */}
          <div className="mt-16 sm:mt-20 max-w-5xl mx-auto rounded-2xl bg-slate-900/70 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-500">LeadFlow Complete Automation Engine</span>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                ● Live Monorepo System
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 relative group hover:border-sky-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Chrome className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm flex items-center justify-between">
                  <span>1. Maps Scraper (MV3)</span>
                  <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded font-mono">apps/extension</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated auto-scroller extracts business names, ratings, review counts, phones, website links, and Google Maps coordinates.
                </p>
                <div className="pt-2 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="text-emerald-400">✓ Deduplication Set active</div>
                  <div className="text-emerald-400">✓ 1-Click Sync to /api/leads/sync</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 relative group hover:border-blue-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm flex items-center justify-between">
                  <span>2. Automated Audit Engine</span>
                  <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-mono">lib/audit.ts</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Scans target website for missing SSL certificates, mobile viewport tags, slow response latency, and backdated footer copyrights (e.g. © 2019).
                </p>
                <div className="pt-2 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="text-emerald-400">✓ Scrapes email via regex</div>
                  <div className="text-emerald-400">✓ Visual Health Score (0-100)</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 relative group hover:border-violet-500/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm flex items-center justify-between">
                  <span>3. AI Pitch & Outreach</span>
                  <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded font-mono">lib/gemini.ts</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Google Gemini models craft high-converting 3-4 sentence cold emails highlighting exact audit findings. Send via Resend in 1 click.
                </p>
                <div className="pt-2 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="text-emerald-400">✓ Gemini 2.0 Flash prompt</div>
                  <div className="text-emerald-400">✓ Resend 1-Click Dispatch</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineered for High-Conversion Web Agency Outreach
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Stop sending generic copy-paste emails. Our system finds genuine website flaws and turns them into irresistible pitch hooks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">SSL & Security Validation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Flags websites still loading over insecure HTTP or with broken SSL certificates—one of the highest converting audit hooks for local business owners.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Mobile Viewport Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identifies desktop-only websites missing modern viewport metadata, allowing you to pitch mobile-first responsiveness that doubles call bookings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Outdated Copyright Scanner</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scrapes footer copyright years (e.g. © 2018-2022) to prove to business owners that their digital storefront has been neglected and needs a revamp.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Tech Stack Fingerprinting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identifies whether the target site is built on WordPress, Wix, Squarespace, Shopify, or Webflow, plus analytics tracking like Google Tag Manager and Meta Pixel.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Google Gemini Prompt Engineering</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Combines business reputation stars and audit flaw metrics into a personalized, 3-4 sentence cold pitch with low-friction call-to-actions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">1-Click Resend Outreach</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send beautiful HTML transactional outreach emails directly from the dashboard, complete with delivery status tracking and CSV exports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">LeadFlow SaaS</span>
            <span>— Manifest V3 Lead Scraper & AI Audit Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-blue-400 hover:underline">
              Open Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
