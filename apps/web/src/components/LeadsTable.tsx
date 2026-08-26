'use client';

import React, { useState, useMemo } from 'react';
import { Lead } from '@/lib/types';
import { DashboardViewTab } from './Sidebar';
import {
  Search,
  RotateCw,
  ExternalLink,
  Mail,
  Trash2,
  Sparkles,
  Phone,
  Flame,
  CheckSquare,
  Square,
  FileText,
  Copy,
  Check,
  Download,
  Filter,
  MapPin,
} from 'lucide-react';

interface LeadsTableProps {
  leads: Lead[];
  onOpenAudit: (lead: Lead) => void;
  onOpenPitchEditor: (lead: Lead) => void;
  onOpenWhyPicked?: (lead: Lead) => void;
  onRunAudit: (leadId: string) => void;
  onRunBatchAudit?: (leadIds: string[]) => void;
  onDeleteLead: (leadId: string) => void;
  onDeleteMultipleLeads?: (leadIds: string[]) => void;
  onExportCsv: () => void;
  onAddLead: () => void;
  auditingId: string | null;
  auditingIds?: Set<string>;
  isBatchAuditing?: boolean;
  activeTab?: DashboardViewTab;
  onTabChange?: (tab: DashboardViewTab) => void;
}

export function LeadsTable({
  leads,
  onOpenAudit,
  onOpenPitchEditor,
  onRunAudit,
  onRunBatchAudit,
  onDeleteLead,
  onDeleteMultipleLeads,
  onExportCsv,
  onAddLead,
  auditingId,
  auditingIds = new Set(),
  isBatchAuditing = false,
  activeTab = 'hot',
  onTabChange,
}: LeadsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique categories for dropdown filter
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.category && l.category.trim()) {
        set.add(l.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [leads]);

  // Filter leads based on active tab, search query, and category
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Tab filter
      if (activeTab === 'hot') {
        const isQualified =
          lead.is_qualified === true ||
          lead.status === 'hot_lead' ||
          (typeof lead.opportunity_score === 'number' && lead.opportunity_score >= 40) ||
          !lead.website_url;
        if (!isQualified) return false;
      } else if (activeTab === 'all') {
        // All raw leads
      } else if (activeTab === 'audited') {
        if (!lead.audit_data && lead.status !== 'audited') return false;
      } else if (activeTab === 'nowebsite') {
        if (!!lead.website_url) return false;
      } else if (activeTab === 'emailed') {
        if (lead.status !== 'emailed') return false;
      } else if (activeTab === 'trash') {
        const isTrash =
          lead.status === 'trash' ||
          (typeof lead.opportunity_score === 'number' &&
            lead.opportunity_score <= 15 &&
            lead.audit_data?.healthScore &&
            lead.audit_data.healthScore >= 85);
        if (!isTrash) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'ALL') {
        if (!lead.category || lead.category.trim().toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        lead.business_name.toLowerCase().includes(q) ||
        (lead.category && lead.category.toLowerCase().includes(q)) ||
        (lead.address && lead.address.toLowerCase().includes(q)) ||
        (lead.website_url && lead.website_url.toLowerCase().includes(q)) ||
        (lead.phone && lead.phone.toLowerCase().includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q))
      );
    });
  }, [leads, activeTab, selectedCategory, searchQuery]);

  // Handle Select All
  const isAllSelected = filteredLeads.length > 0 && filteredLeads.every((l) => selectedIds.has(l.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      filteredLeads.forEach((l) => next.add(l.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectLead = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected lead(s)?`)) {
      if (onDeleteMultipleLeads) {
        onDeleteMultipleLeads(Array.from(selectedIds));
      } else {
        selectedIds.forEach((id) => onDeleteLead(id));
      }
      setSelectedIds(new Set());
    }
  };

  const handleBulkAuditClick = () => {
    const eligibleIds = filteredLeads
      .filter((l) => selectedIds.has(l.id) && !!(l.website_url || l.gmb_website_url))
      .map((l) => l.id);

    if (eligibleIds.length === 0) {
      alert('None of the selected leads have website URLs to audit.');
      return;
    }

    if (onRunBatchAudit) {
      onRunBatchAudit(eligibleIds);
    } else {
      eligibleIds.forEach((id) => onRunAudit(id));
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const qualifiedCount = leads.filter(
    (l) =>
      l.is_qualified === true ||
      l.status === 'hot_lead' ||
      (l.opportunity_score && l.opportunity_score >= 40) ||
      !l.website_url
  ).length;

  const tabLabels: { id: DashboardViewTab; label: string; count: number; hot?: boolean }[] = [
    { id: 'all', label: 'All Leads', count: leads.length },
    { id: 'hot', label: '🔥 Qualified Leads', count: qualifiedCount, hot: true },
    { id: 'audited', label: 'Audited Sites', count: leads.filter((l) => !!l.audit_data).length },
    { id: 'nowebsite', label: 'No Website', count: leads.filter((l) => !l.website_url && !l.gmb_website_url).length },
    { id: 'emailed', label: 'Outreach Sent', count: leads.filter((l) => l.status === 'emailed').length },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar: Dual Tabs, Category Dropdown, Search, CSV Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800/80 shadow-md">
        {/* Dual Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {tabLabels.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? tab.hot
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-500/25'
                    : 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right Filter Actions: Category, Search, CSV Export */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Category Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, domain, city..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Export to CSV Button */}
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700/80 transition-colors shrink-0"
            title="Export full leads pipeline to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-blue-950/90 border border-blue-500/40 rounded-2xl animate-in fade-in slide-in-from-top-1 text-xs shadow-xl">
          <div className="flex items-center gap-2 text-blue-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span>{selectedIds.size} lead(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkAuditClick}
              disabled={isBatchAuditing}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-md"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isBatchAuditing ? 'animate-spin' : ''}`} />
              <span>{isBatchAuditing ? 'Auditing Selected...' : 'Run Audit on Selected'}</span>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBatchAuditing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Modern Lead Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-200"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Business Info</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Social Footprint</th>
                <th className="py-3.5 px-4">Website & Health</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                        <Flame className="w-6 h-6 text-amber-400" />
                      </div>
                      <h3 className="text-sm font-bold text-white">No leads match filter</h3>
                      <p className="text-xs text-slate-400">
                        {searchQuery || selectedCategory !== 'ALL'
                          ? 'Try resetting the search or category filters.'
                          : 'Deep Harvester is ready. Extract leads from Google Maps or add manually.'}
                      </p>
                      <button
                        onClick={onAddLead}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-md transition-all"
                      >
                        + Add First Lead
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);
                  const isAuditing = auditingId === lead.id || auditingIds.has(lead.id);
                  const hasNoWebsite = !lead.website_url && !lead.gmb_website_url && !lead.discovered_website;
                  const socials = lead.social_profiles || lead.socials || lead.audit_data?.socials;
                  const oppScore =
                    typeof lead.opportunity_score === 'number'
                      ? lead.opportunity_score
                      : hasNoWebsite
                      ? 95
                      : 0;
                  const isHot = lead.is_qualified || lead.status === 'hot_lead' || oppScore >= 40;
                  const score = lead.audit_data?.healthScore;
                  const pageSpeedScore = lead.audit_data?.pageSpeed?.score;
                  const targetWebsite = lead.website_url || lead.gmb_website_url || lead.discovered_website;

                  return (
                    <tr
                      key={lead.id}
                      className={`group transition-colors ${
                        isSelected
                          ? 'bg-blue-950/35'
                          : isHot
                          ? 'bg-amber-950/10 hover:bg-amber-950/20'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleSelectLead(lead.id)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Business Info: Name, Category, Location */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 max-w-[240px]">
                          <div className="flex items-center gap-2">
                            {isHot && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 shrink-0">
                                🔥 Opp: {oppScore}
                              </span>
                            )}
                            <span
                              className="font-bold text-white text-sm tracking-tight group-hover:text-blue-400 transition-colors truncate"
                              title={lead.business_name}
                            >
                              {lead.business_name}
                            </span>
                            {lead.maps_url && (
                              <a
                                href={lead.maps_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-slate-300 shrink-0"
                                title="Open in Google Maps"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-slate-400 text-[11px] flex-wrap">
                            {lead.category && (
                              <span className="font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.2 rounded-md">
                                {lead.category}
                              </span>
                            )}
                            {lead.rating ? (
                              <span className="font-semibold text-amber-400 flex items-center gap-0.5">
                                ★ {lead.rating}
                              </span>
                            ) : null}
                            {lead.reviews_count ? (
                              <span>({lead.reviews_count} reviews)</span>
                            ) : null}
                          </div>

                          {lead.address && (
                            <div
                              className="flex items-center gap-1 text-[11px] text-slate-400 truncate"
                              title={lead.address}
                            >
                              <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                              <span className="truncate">{lead.address}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Contact: Phone & Email (with copy icons) */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5 max-w-[180px]">
                          {lead.phone ? (
                            <div className="flex items-center justify-between gap-1 text-slate-300 font-mono text-xs">
                              <div className="flex items-center gap-1.5 truncate">
                                <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span className="truncate">{lead.phone}</span>
                              </div>
                              <button
                                onClick={() => copyText(lead.phone!, `phone_${lead.id}`)}
                                className="text-slate-400 hover:text-white p-0.5"
                                title="Copy phone"
                              >
                                {copiedId === `phone_${lead.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No phone listed</span>
                          )}

                          {lead.email || lead.audit_data?.extractedEmails?.[0] ? (
                            <div className="flex items-center justify-between gap-1 text-sky-400 font-mono text-xs">
                              <div className="flex items-center gap-1.5 truncate">
                                <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                                <span
                                  className="truncate"
                                  title={lead.email || lead.audit_data?.extractedEmails?.[0]}
                                >
                                  {lead.email || lead.audit_data?.extractedEmails?.[0]}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  copyText(
                                    lead.email || lead.audit_data?.extractedEmails?.[0]!,
                                    `email_${lead.id}`
                                  )
                                }
                                className="text-slate-400 hover:text-white p-0.5 shrink-0"
                                title="Copy email"
                              >
                                {copiedId === `email_${lead.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px] block">No email found</span>
                          )}
                        </div>
                      </td>

                      {/* Social Footprint Badges */}
                      <td className="py-4 px-4">
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
                                className="px-2 py-1 rounded-md bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 font-semibold text-[10px] border border-blue-500/25 transition-colors"
                                title="Facebook Profile"
                              >
                                FB
                              </a>
                            )}
                            {socials.instagram && (
                              <a
                                href={socials.instagram}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-md bg-pink-600/15 hover:bg-pink-600/30 text-pink-400 font-semibold text-[10px] border border-pink-500/25 transition-colors"
                                title="Instagram Profile"
                              >
                                IG
                              </a>
                            )}
                            {socials.yelp && (
                              <a
                                href={socials.yelp}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-md bg-rose-600/15 hover:bg-rose-600/30 text-rose-400 font-semibold text-[10px] border border-rose-500/25 transition-colors"
                                title="Yelp Listing"
                              >
                                Yelp
                              </a>
                            )}
                            {socials.mapquest && (
                              <a
                                href={socials.mapquest}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-md bg-amber-600/15 hover:bg-amber-600/30 text-amber-400 font-semibold text-[10px] border border-amber-500/25 transition-colors"
                                title="MapQuest Listing"
                              >
                                MQ
                              </a>
                            )}
                            {socials.tiktok && (
                              <a
                                href={socials.tiktok}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-md bg-teal-600/15 hover:bg-teal-600/30 text-teal-300 font-semibold text-[10px] border border-teal-500/25 transition-colors"
                                title="TikTok Profile"
                              >
                                TikTok
                              </a>
                            )}
                            {socials.linkedin && (
                              <a
                                href={socials.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded-md bg-sky-600/15 hover:bg-sky-600/30 text-sky-400 font-semibold text-[10px] border border-sky-500/25 transition-colors"
                                title="LinkedIn Profile"
                              >
                                IN
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Zero social presence</span>
                        )}
                      </td>

                      {/* Website & Colored Circular Health Gauge */}
                      <td className="py-4 px-4">
                        {hasNoWebsite ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <span>No Website</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            {/* Circular Score Gauge */}
                            <button
                              onClick={() => onOpenAudit(lead)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs border shadow-md transition-transform hover:scale-105 cursor-pointer ${
                                typeof score === 'number'
                                  ? score < 50
                                    ? 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-rose-500/10'
                                    : score < 75
                                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-amber-500/10'
                                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                              title="Click to view detailed audit breakdown"
                            >
                              {score !== undefined ? score : '—'}
                            </button>

                            <div className="flex flex-col gap-1 truncate max-w-[170px]">
                              <a
                                href={targetWebsite!}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-300 hover:text-blue-400 underline decoration-slate-700 truncate font-mono text-[11px]"
                              >
                                {targetWebsite!
                                  .replace(/^https?:\/\/(www\.)?/, '')
                                  .replace(/\/$/, '')}
                              </a>
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                {typeof pageSpeedScore === 'number' ? (
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-bold ${
                                      pageSpeedScore < 50
                                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                        : pageSpeedScore <= 70
                                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    }`}
                                  >
                                    Speed {pageSpeedScore}
                                  </span>
                                ) : isAuditing ? (
                                  <span className="text-indigo-400 font-semibold animate-pulse">
                                    Auditing...
                                  </span>
                                ) : null}

                                {lead.audit_data?.copyright?.isOutdated && (
                                  <span className="text-rose-400 font-medium">
                                    © {lead.audit_data.copyright.detectedYear}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons: "View Audit" & "1-Click Outreach" */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1. "View Audit" Button */}
                          <button
                            onClick={() => onOpenAudit(lead)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-sm transition-all"
                            title="Open Slide-Over Audit Breakdown"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                            <span>View Audit</span>
                          </button>

                          {/* 2. "1-Click Outreach" Button */}
                          <button
                            onClick={() => onOpenPitchEditor(lead)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 transition-all"
                            title="1-Click Outreach Email Composer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>1-Click Outreach</span>
                          </button>

                          {/* Delete Lead Button */}
                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
