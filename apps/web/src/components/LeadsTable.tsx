'use client';

import React, { useState, useMemo } from 'react';
import { Lead } from '@/lib/types';
import {
  ExternalLink,
  Search,
  CheckSquare,
  Square,
  Globe,
  Phone,
  Mail,
  Flame,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Sparkles,
  Download,
  Trash2,
  Share2,
  Copy,
  Check,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { DashboardViewTab } from './Sidebar';

interface LeadsTableProps {
  leads: Lead[];
  onOpenAudit: (lead: Lead) => void;
  onOpenPitchEditor: (lead: Lead) => void;
  onOpenWhyPicked: (lead: Lead) => void;
  onRunAudit: (leadId: string) => void;
  onRunBatchAudit?: (leadIds: string[]) => void;
  onDeleteLead?: (leadId: string) => void;
  onDeleteMultipleLeads?: (leadIds: string[]) => void;
  onExportCsv?: () => void;
  onAddLead?: () => void;
  auditingId?: string | null;
  auditingIds?: Set<string>;
  isBatchAuditing?: boolean;
  activeTab?: DashboardViewTab;
  onTabChange?: (tab: DashboardViewTab) => void;
}

type QuickFilterType = 'all' | 'no_website' | 'backdated' | 'slow_speed';

export function LeadsTable({
  leads,
  onOpenAudit,
  onOpenPitchEditor,
  onOpenWhyPicked,
  onRunAudit,
  onRunBatchAudit,
  onDeleteLead,
  onDeleteMultipleLeads,
  onExportCsv,
  onAddLead,
  auditingId,
  auditingIds,
  isBatchAuditing,
  activeTab = 'all',
  onTabChange,
}: LeadsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Distinct categories for dropdown filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Filtered Leads according to Dual Tabs, Quick Filters, Category, and Search Query
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Dual Tab Filter
      if (activeTab === 'hot') {
        const isQualified =
          lead.is_qualified === true ||
          lead.status === 'hot_lead' ||
          (lead.opportunity_score && lead.opportunity_score >= 40) ||
          (!lead.website_url && !lead.gmb_website_url);
        if (!isQualified) return false;
      } else if (activeTab === 'audited') {
        const isAudited =
          lead.status === 'audited' ||
          lead.status === 'emailed' ||
          lead.status === 'hot_lead' ||
          !!lead.audit_data;
        if (!isAudited) return false;
      } else if (activeTab === 'emailed') {
        if (lead.status !== 'emailed') return false;
      } else if (activeTab === 'nowebsite') {
        if (lead.website_url || lead.gmb_website_url) return false;
      }

      // 2. Sub-Quick Filters
      if (quickFilter === 'no_website') {
        if (lead.website_url || lead.gmb_website_url) return false;
      } else if (quickFilter === 'backdated') {
        const year = lead.audit_data?.copyright?.detectedYear;
        if (!year || year > 2022) return false;
      } else if (quickFilter === 'slow_speed') {
        const speed = lead.audit_data?.pageSpeed?.score;
        if (speed === undefined || speed >= 50) return false;
      }

      // 3. Category Filter
      if (selectedCategory !== 'all' && lead.category !== selectedCategory) {
        return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = lead.business_name.toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q);
        const matchEmail = lead.email?.toLowerCase().includes(q);
        const matchDomain = (lead.website_url || lead.gmb_website_url || lead.discovered_website)
          ?.toLowerCase()
          .includes(q);
        const matchAddress = lead.address?.toLowerCase().includes(q);
        const matchCategory = lead.category?.toLowerCase().includes(q);

        if (!matchName && !matchPhone && !matchEmail && !matchDomain && !matchAddress && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [leads, activeTab, quickFilter, selectedCategory, searchQuery]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBatchAuditClick = () => {
    if (!onRunBatchAudit || selectedIds.size === 0) return;
    onRunBatchAudit(Array.from(selectedIds));
  };

  const handleBatchDeleteClick = () => {
    if (!onDeleteMultipleLeads || selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected lead(s)?`)) {
      onDeleteMultipleLeads(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col w-full">
      {/* 1. Header & Dual-Tab Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col gap-4">
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Dual Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 w-fit">
            <button
              onClick={() => onTabChange && onTabChange('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>All Pipeline Leads</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => onTabChange && onTabChange('hot')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'hot'
                  ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/25 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-950" />
              <span>🔥 Qualified & Audited Leads</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/30 text-slate-950 font-mono">
                {
                  leads.filter(
                    (l) =>
                      l.is_qualified === true ||
                      l.status === 'hot_lead' ||
                      (l.opportunity_score && l.opportunity_score >= 40) ||
                      (!l.website_url && !l.gmb_website_url)
                  ).length
                }
              </span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleBatchAuditClick}
                  disabled={isBatchAuditing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-sm shadow-indigo-600/25"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isBatchAuditing ? 'Auditing...' : `Run Audit (${selectedIds.size})`}
                  </span>
                </button>

                <button
                  onClick={handleBatchDeleteClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedIds.size})</span>
                </button>
              </>
            )}

            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Deep Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by business name, city, phone, domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setQuickFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  quickFilter === 'all'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setQuickFilter('no_website')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  quickFilter === 'no_website'
                    ? 'bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                No Website
              </button>
              <button
                onClick={() => setQuickFilter('backdated')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  quickFilter === 'backdated'
                    ? 'bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Backdated Site
              </button>
              <button
                onClick={() => setQuickFilter('slow_speed')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  quickFilter === 'slow_speed'
                    ? 'bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Poor Speed (&lt;50)
              </button>
            </div>

            {/* Category Dropdown */}
            {categories.length > 0 && (
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Filter by business category"
                  className="appearance-none pl-3 pr-8 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Responsive Modern Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider select-none">
              <th className="py-3.5 px-4 w-10">
                <button
                  onClick={handleSelectAll}
                  aria-label="Select all leads"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {selectedIds.size > 0 && selectedIds.size === filteredLeads.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3.5 px-4 min-w-[220px]">Business</th>
              <th className="py-3.5 px-4 min-w-[200px]">Website Health</th>
              <th className="py-3.5 px-4 min-w-[160px]">Social Footprint</th>
              <th className="py-3.5 px-4 min-w-[180px]">Contact Info</th>
              <th className="py-3.5 px-4 text-right min-w-[190px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-slate-400">
                  <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200 text-sm">No leads match your filter</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try resetting your search query or trigger the Chrome Harvester to scrape fresh leads from Google Maps.
                      </p>
                    </div>
                    {onAddLead && (
                      <button
                        onClick={onAddLead}
                        className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm"
                      >
                        + Add Lead Manually
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const isSelected = selectedIds.has(lead.id);
                const isAuditing = auditingId === lead.id || auditingIds?.has(lead.id);
                const targetUrl =
                  lead.gmb_website_url || lead.website_url || lead.discovered_website;
                const socials = lead.social_profiles || lead.socials || {};
                const healthScore = lead.audit_data?.healthScore;
                const copyrightYear = lead.audit_data?.copyright?.detectedYear;
                const hasSsl = lead.audit_data?.ssl?.valid;
                const pageSpeedScore = lead.audit_data?.pageSpeed?.score;

                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-slate-800/40 transition-colors group ${
                      isSelected ? 'bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-4 px-4 align-top">
                      <button
                        onClick={() => toggleSelect(lead.id)}
                        aria-label={`Select ${lead.business_name}`}
                        className="text-slate-500 hover:text-white transition-colors mt-0.5"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Business Info */}
                    <td className="py-4 px-4 align-top space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-100 text-sm tracking-tight">
                          {lead.business_name}
                        </span>
                        {lead.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                            {lead.category}
                          </span>
                        )}
                        {lead.is_qualified && (
                          <button
                            onClick={() => onOpenWhyPicked(lead)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                          >
                            <Flame className="w-3 h-3" />
                            <span>High Intent</span>
                          </button>
                        )}
                      </div>

                      {/* Reviews & Rating */}
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        {lead.rating > 0 && (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            ★ {lead.rating.toFixed(1)}
                          </span>
                        )}
                        {lead.reviews_count > 0 && (
                          <span>({lead.reviews_count} reviews)</span>
                        )}
                        {lead.maps_url && (
                          <a
                            href={lead.maps_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-0.5 ml-1"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      {lead.address && (
                        <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                          {lead.address}
                        </p>
                      )}
                    </td>

                    {/* Website Health */}
                    <td className="py-4 px-4 align-top space-y-2">
                      {targetUrl ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a
                              href={targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:text-blue-300 font-medium text-xs truncate max-w-[170px] inline-block"
                            >
                              {targetUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                            </a>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                          </div>

                          {/* Circular Speed Score Badge + SSL + Copyright */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {pageSpeedScore !== undefined ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                                  pageSpeedScore < 50
                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                    : pageSpeedScore < 75
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    pageSpeedScore < 50
                                      ? 'bg-rose-400'
                                      : pageSpeedScore < 75
                                      ? 'bg-amber-400'
                                      : 'bg-emerald-400'
                                  }`}
                                ></span>
                                Speed: {pageSpeedScore}/100
                              </span>
                            ) : healthScore !== undefined ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                                  healthScore < 50
                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                    : healthScore < 75
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                Health: {healthScore}/100
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                                Un-audited
                              </span>
                            )}

                            {hasSsl !== undefined && (
                              <span
                                title={hasSsl ? 'Valid HTTPS SSL Certificate' : 'Insecure HTTP (No SSL)'}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                  hasSsl
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                }`}
                              >
                                {hasSsl ? (
                                  <ShieldCheck className="w-3 h-3" />
                                ) : (
                                  <ShieldAlert className="w-3 h-3" />
                                )}
                                <span>{hasSsl ? 'SSL' : 'No SSL'}</span>
                              </span>
                            )}

                            {copyrightYear && (
                              <span
                                title={`Detected Copyright: ${copyrightYear}`}
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                  copyrightYear <= 2022
                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>© {copyrightYear}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/10">
                            <span>NO WEBSITE (HIGH OPPORTUNITY)</span>
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Candidate for high-converting custom website design.
                          </p>
                        </div>
                      )}
                    </td>

                    {/* Social Footprint */}
                    <td className="py-4 px-4 align-top">
                      {socials &&
                      (socials.facebook ||
                        socials.instagram ||
                        socials.yelp ||
                        socials.tiktok ||
                        socials.mapquest ||
                        socials.yellowpages ||
                        socials.linkedin ||
                        socials.twitter_x) ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {socials.facebook && (
                            <a
                              href={socials.facebook}
                              target="_blank"
                              rel="noreferrer"
                              title={`Facebook: ${socials.facebook}`}
                              className="px-2 py-1 rounded-md bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 border border-blue-600/25 text-[10px] font-bold transition-colors"
                            >
                              FB
                            </a>
                          )}
                          {socials.instagram && (
                            <a
                              href={socials.instagram}
                              target="_blank"
                              rel="noreferrer"
                              title={`Instagram: ${socials.instagram}`}
                              className="px-2 py-1 rounded-md bg-pink-600/15 hover:bg-pink-600/30 text-pink-400 border border-pink-600/25 text-[10px] font-bold transition-colors"
                            >
                              IG
                            </a>
                          )}
                          {socials.yelp && (
                            <a
                              href={socials.yelp}
                              target="_blank"
                              rel="noreferrer"
                              title={`Yelp: ${socials.yelp}`}
                              className="px-2 py-1 rounded-md bg-red-600/15 hover:bg-red-600/30 text-red-400 border border-red-600/25 text-[10px] font-bold transition-colors"
                            >
                              Yelp
                            </a>
                          )}
                          {socials.mapquest && (
                            <a
                              href={socials.mapquest}
                              target="_blank"
                              rel="noreferrer"
                              title={`MapQuest: ${socials.mapquest}`}
                              className="px-2 py-1 rounded-md bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/25 text-[10px] font-bold transition-colors"
                            >
                              MQ
                            </a>
                          )}
                          {socials.yellowpages && (
                            <a
                              href={socials.yellowpages}
                              target="_blank"
                              rel="noreferrer"
                              title={`YellowPages: ${socials.yellowpages}`}
                              className="px-2 py-1 rounded-md bg-yellow-600/15 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-600/25 text-[10px] font-bold transition-colors"
                            >
                              YP
                            </a>
                          )}
                          {socials.tiktok && (
                            <a
                              href={socials.tiktok}
                              target="_blank"
                              rel="noreferrer"
                              title={`TikTok: ${socials.tiktok}`}
                              className="px-2 py-1 rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600 text-[10px] font-bold transition-colors"
                            >
                              TikTok
                            </a>
                          )}
                          {socials.linkedin && (
                            <a
                              href={socials.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              title={`LinkedIn: ${socials.linkedin}`}
                              className="px-2 py-1 rounded-md bg-sky-600/15 hover:bg-sky-600/30 text-sky-400 border border-sky-600/25 text-[10px] font-bold transition-colors"
                            >
                              IN
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          No direct socials detected
                        </span>
                      )}
                    </td>

                    {/* Contact Info */}
                    <td className="py-4 px-4 align-top space-y-1.5">
                      {lead.phone ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs">{lead.phone}</span>
                          <button
                            onClick={() => handleCopy(lead.phone!, `phone_${lead.id}`)}
                            title="Copy phone"
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                          >
                            {copiedField === `phone_${lead.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">No phone</span>
                      )}

                      {lead.email || lead.audit_data?.extractedEmails?.[0] ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs truncate max-w-[140px]">
                            {lead.email || lead.audit_data?.extractedEmails?.[0]}
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(
                                (lead.email || lead.audit_data?.extractedEmails?.[0])!,
                                `email_${lead.id}`
                              )
                            }
                            title="Copy email"
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                          >
                            {copiedField === `email_${lead.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : null}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 align-top text-right space-y-1.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Audit Report Button */}
                        <button
                          onClick={() => onOpenAudit(lead)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-all shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Audit Report</span>
                        </button>

                        {/* 2. Quick Email Button */}
                        <button
                          onClick={() => onOpenPitchEditor(lead)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-sm shadow-blue-600/20"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Quick Email</span>
                        </button>

                        {/* Delete single lead */}
                        {onDeleteLead && (
                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            title="Delete Lead"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* On-Demand Re-audit action */}
                      {targetUrl && (
                        <div>
                          <button
                            onClick={() => onRunAudit(lead.id)}
                            disabled={isAuditing}
                            className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600 disabled:opacity-50"
                          >
                            {isAuditing ? 'Auditing...' : 'Re-run full audit'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Footer Stats Bar */}
      <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          Showing <strong className="text-white">{filteredLeads.length}</strong> of{' '}
          <strong className="text-white">{leads.length}</strong> total pipeline prospects
        </span>
        <div className="flex items-center gap-3">
          <span>Dual-Engine: Chrome Harvester + Server Audit Engine</span>
        </div>
      </div>
    </div>
  );
}
