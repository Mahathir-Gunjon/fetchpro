'use client';

import React, { useState, useMemo } from 'react';
import { Lead } from '@/lib/types';
import { HealthScoreBadge } from './HealthScoreBadge';
import { DashboardViewTab } from './Sidebar';
import {
  Search,
  RotateCw,
  ExternalLink,
  Mail,
  Trash2,
  CheckCircle2,
  Sparkles,
  Phone,
  Flame,
  CheckSquare,
  Square,
  ChevronDown,
  Download,
  Share2,
} from 'lucide-react';

interface LeadsTableProps {
  leads: Lead[];
  onOpenAudit: (lead: Lead) => void;
  onOpenPitchEditor: (lead: Lead) => void;
  onRunAudit: (leadId: string) => void;
  onDeleteLead: (leadId: string) => void;
  onDeleteMultipleLeads?: (leadIds: string[]) => void;
  onExportCsv: () => void;
  onAddLead: () => void;
  auditingId: string | null;
  activeTab?: DashboardViewTab;
  onTabChange?: (tab: DashboardViewTab) => void;
}

export function LeadsTable({
  leads,
  onOpenAudit,
  onOpenPitchEditor,
  onRunAudit,
  onDeleteLead,
  onDeleteMultipleLeads,
  onExportCsv,
  onAddLead,
  auditingId,
  activeTab = 'all',
  onTabChange,
}: LeadsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter leads based on active tab and search query
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Tab filter
      if (activeTab === 'audited' && lead.status !== 'audited' && lead.status !== 'emailed') return false;
      if (activeTab === 'nowebsite' && !!lead.website_url) return false;
      if (activeTab === 'emailed' && lead.status !== 'emailed') return false;
      if (activeTab === 'critical' && (lead.audit_data?.healthScore === undefined || lead.audit_data.healthScore >= 50)) return false;

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        lead.business_name.toLowerCase().includes(q) ||
        (lead.website_url && lead.website_url.toLowerCase().includes(q)) ||
        (lead.phone && lead.phone.toLowerCase().includes(q)) ||
        (lead.email && lead.email.toLowerCase().includes(q))
      );
    });
  }, [leads, activeTab, searchQuery]);

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

  const handleBulkAudit = () => {
    const eligible = filteredLeads.filter((l) => selectedIds.has(l.id) && !!l.website_url);
    if (eligible.length === 0) {
      alert('None of the selected leads have website URLs to audit.');
      return;
    }
    eligible.forEach((l) => onRunAudit(l.id));
  };

  const tabLabels: { id: DashboardViewTab; label: string; count: number }[] = [
    { id: 'all', label: 'All Leads', count: leads.length },
    { id: 'audited', label: 'Audited Sites', count: leads.filter((l) => l.status === 'audited' || l.status === 'emailed').length },
    { id: 'nowebsite', label: 'No Website (Hot)', count: leads.filter((l) => !l.website_url).length },
    { id: 'emailed', label: 'Outreach Sent', count: leads.filter((l) => l.status === 'emailed').length },
    { id: 'critical', label: 'Score < 50', count: leads.filter((l) => l.audit_data?.healthScore !== undefined && l.audit_data.healthScore < 50).length },
  ];

  return (
    <div className="space-y-4">
      {/* Top Filter Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {tabLabels.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, website..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Bulk Action Banner if rows selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-950/70 border border-blue-500/40 rounded-xl animate-in fade-in slide-in-from-top-1 text-xs">
          <div className="flex items-center gap-2 text-blue-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span>{selectedIds.size} lead(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkAudit}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            >
              Run Audit
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
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
                <th className="py-3.5 px-4">Business & Google Rating</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Socials</th>
                <th className="py-3.5 px-4">Website & Audit Health</th>
                <th className="py-3.5 px-4">Status & Outreach</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-400">
                        <Flame className="w-6 h-6 text-amber-400" />
                      </div>
                      <h3 className="text-sm font-bold text-white">No leads in this view</h3>
                      <p className="text-xs text-slate-400">
                        {searchQuery
                          ? `No leads matched "${searchQuery}". Try a different term.`
                          : 'Extract leads from Google Maps using your Chrome extension or click Add Lead.'}
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
                  const isAuditing = auditingId === lead.id;
                  const hasNoWebsite = !lead.website_url;
                  const socials = lead.socials || lead.audit_data?.socials;

                  return (
                    <tr
                      key={lead.id}
                      className={`group transition-colors ${
                        isSelected ? 'bg-blue-950/30' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
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

                      {/* Business Name & Maps */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm tracking-tight group-hover:text-blue-400 transition-colors">
                              {lead.business_name}
                            </span>
                            {lead.maps_url && (
                              <a
                                href={lead.maps_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-slate-300"
                                title="Open in Google Maps"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                            {lead.rating ? (
                              <span className="font-semibold text-amber-400 flex items-center gap-0.5">
                                ★ {lead.rating}
                              </span>
                            ) : null}
                            {lead.reviews_count ? (
                              <span>({lead.reviews_count} reviews)</span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {lead.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No phone</span>
                          )}
                          {lead.email ? (
                            <div className="flex items-center gap-1.5 text-sky-400 font-mono truncate max-w-[160px]" title={lead.email}>
                              <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                              <span>{lead.email}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Social Media Profiles */}
                      <td className="py-3.5 px-4">
                        {socials && (socials.facebook || socials.instagram || socials.linkedin || socials.twitter || socials.youtube || socials.tiktok) ? (
                          <div className="flex items-center gap-1.5">
                            {socials.facebook && (
                              <a
                                href={socials.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="w-6 h-6 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 flex items-center justify-center font-bold text-[10px] transition-colors"
                                title="Facebook Page"
                              >
                                fb
                              </a>
                            )}
                            {socials.instagram && (
                              <a
                                href={socials.instagram}
                                target="_blank"
                                rel="noreferrer"
                                className="w-6 h-6 rounded-lg bg-pink-600/20 hover:bg-pink-600/40 text-pink-400 flex items-center justify-center font-bold text-[10px] transition-colors"
                                title="Instagram Profile"
                              >
                                ig
                              </a>
                            )}
                            {socials.linkedin && (
                              <a
                                href={socials.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="w-6 h-6 rounded-lg bg-sky-600/20 hover:bg-sky-600/40 text-sky-400 flex items-center justify-center font-bold text-[10px] transition-colors"
                                title="LinkedIn Profile"
                              >
                                in
                              </a>
                            )}
                            {socials.twitter && (
                              <a
                                href={socials.twitter}
                                target="_blank"
                                rel="noreferrer"
                                className="w-6 h-6 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[10px] transition-colors"
                                title="X / Twitter"
                              >
                                𝕏
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Website & Audit Score */}
                      <td className="py-3.5 px-4">
                        {hasNoWebsite ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                            <Flame className="w-3 h-3 text-amber-400" />
                            <span>Needs New Website</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <HealthScoreBadge
                              score={lead.audit_data?.healthScore}
                              onClick={() => onOpenAudit(lead)}
                            />
                            <div className="flex flex-col gap-0.5 truncate max-w-[170px]">
                              <a
                                href={lead.website_url!}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-300 hover:text-blue-400 underline decoration-slate-700 truncate font-mono text-[11px]"
                              >
                                {lead.website_url!.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                              </a>
                              {lead.audit_data?.ssl ? (
                                <span className={`text-[10px] font-semibold ${lead.audit_data.ssl.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {lead.audit_data.ssl.valid ? '✓ SSL Active' : '✗ No SSL'}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status & Outreach */}
                      <td className="py-3.5 px-4">
                        {lead.status === 'emailed' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Outreach Sent</span>
                            </span>
                            {lead.emailed_at && (
                              <span className="text-[10px] text-slate-400">
                                {new Date(lead.emailed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : lead.status === 'audited' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                            <span>Audited</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-400 bg-slate-800/60 border border-slate-700/60">
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Re-Audit Button (if website exists) */}
                          {lead.website_url ? (
                            <button
                              onClick={() => onRunAudit(lead.id)}
                              disabled={isAuditing}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-40"
                              title="Run Instant Audit"
                            >
                              <RotateCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-indigo-400' : ''}`} />
                            </button>
                          ) : null}

                          {/* AI Pitch / Outreach Button */}
                          <button
                            onClick={() => onOpenPitchEditor(lead)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-colors"
                            title="Generate AI Cold Pitch"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{lead.status === 'emailed' ? 'Review Pitch' : 'Pitch'}</span>
                          </button>

                          {/* Delete Lead Button */}
                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Lead"
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
