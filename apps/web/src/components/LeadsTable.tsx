'use client';

import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus } from '@/lib/types';
import { HealthScoreBadge } from './HealthScoreBadge';
import {
  Search,
  Filter,
  Download,
  RotateCw,
  ExternalLink,
  Sparkles,
  Mail,
  Send,
  Trash2,
  Phone,
  CheckCircle2,
  Clock,
  Globe,
  MapPin,
  AlertCircle,
  Copy,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';

interface LeadsTableProps {
  leads: Lead[];
  onOpenAudit: (lead: Lead) => void;
  onOpenPitchEditor: (lead: Lead) => void;
  onRunAudit: (leadId: string) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  onExportCsv: () => void;
  onAddLead: () => void;
  auditingId: string | null;
}

export function LeadsTable({
  leads,
  onOpenAudit,
  onOpenPitchEditor,
  onRunAudit,
  onDeleteLead,
  onExportCsv,
  onAddLead,
  auditingId,
}: LeadsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'score' | 'rating' | 'reviews'>('created_at');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        // Status filter
        if (statusFilter !== 'all' && lead.status !== statusFilter) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = lead.business_name.toLowerCase().includes(q);
          const matchPhone = (lead.phone || '').toLowerCase().includes(q);
          const matchEmail = (lead.email || '').toLowerCase().includes(q);
          const matchWeb = (lead.website_url || '').toLowerCase().includes(q);
          return matchName || matchPhone || matchEmail || matchWeb;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'score') {
          const scoreA = a.audit_data?.healthScore ?? -1;
          const scoreB = b.audit_data?.healthScore ?? -1;
          diff = scoreA - scoreB;
        } else if (sortBy === 'rating') {
          diff = (a.rating || 0) - (b.rating || 0);
        } else if (sortBy === 'reviews') {
          diff = (a.reviews_count || 0) - (b.reviews_count || 0);
        } else {
          // created_at
          diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [leads, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-4">
      {/* Table Top Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by business, phone, email, website..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {(['all', 'pending', 'audited', 'emailed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none px-3.5 py-2 pr-8 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="created_at">Sort: Newest First</option>
              <option value="score">Sort: Health Score</option>
              <option value="rating">Sort: Google Rating</option>
              <option value="reviews">Sort: Review Count</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 disabled:opacity-50 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Business / Location</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Website</th>
                <th className="py-3.5 px-4">Health Score</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">AI Cold Pitch</th>
                <th className="py-3.5 px-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-white">No Leads Matching Query</h3>
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Try clearing your filters or search terms.'
                          : 'Scrape Google Maps with the Chrome extension or add a manual lead.'}
                      </p>
                      <button
                        onClick={onAddLead}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/25 transition-all"
                      >
                        + Add First Lead
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isCurrentlyAuditing = auditingId === lead.id;
                  const isEmailed = lead.status === 'emailed';
                  const isAudited = lead.status === 'audited';

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Business Name & Rating */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <div className="font-semibold text-white text-sm flex items-center gap-1.5 group-hover:text-blue-300 transition-colors">
                            <span>{lead.business_name}</span>
                            {lead.maps_url && (
                              <a
                                href={lead.maps_url}
                                target="_blank"
                                rel="noreferrer"
                                title="Open on Google Maps"
                                className="text-slate-500 hover:text-blue-400"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {lead.rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                ★ {lead.rating}
                                {lead.reviews_count > 0 && (
                                  <span className="text-[10px] text-amber-500 font-normal">
                                    ({lead.reviews_count})
                                  </span>
                                )}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              {new Date(lead.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info (Phone / Email) */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          {lead.phone ? (
                            <button
                              onClick={() => handleCopy(lead.phone!, `phone-${lead.id}`)}
                              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-mono group/btn"
                              title="Click to copy phone"
                            >
                              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{lead.phone}</span>
                              <span className="text-[9px] text-slate-400 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                {copiedId === `phone-${lead.id}` ? '✓' : 'copy'}
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No phone</span>
                          )}

                          {lead.email ? (
                            <button
                              onClick={() => handleCopy(lead.email!, `email-${lead.id}`)}
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono truncate max-w-[180px] group/btn"
                              title="Click to copy email"
                            >
                              <Mail className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                              <span className="text-[9px] text-slate-400 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                                {copiedId === `email-${lead.id}` ? '✓' : 'copy'}
                              </span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Email not scraped</span>
                          )}
                        </div>
                      </td>

                      {/* Website */}
                      <td className="py-4 px-4">
                        {lead.website_url ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={lead.website_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-sky-400 hover:text-sky-300 hover:underline truncate max-w-[150px] inline-block font-mono"
                            >
                              {lead.website_url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            </a>
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No website found</span>
                        )}
                      </td>

                      {/* Health Score */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => onOpenAudit(lead)}
                          className="hover:scale-105 transition-transform text-left"
                          title="View complete audit metrics"
                        >
                          <HealthScoreBadge
                            score={lead.audit_data?.healthScore}
                            size="sm"
                            showLabel={false}
                          />
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isEmailed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Emailed
                          </span>
                        ) : isAudited ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                            <Globe className="w-3 h-3" />
                            Audited
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* AI Pitch Preview */}
                      <td className="py-4 px-4 max-w-xs">
                        {lead.ai_pitch ? (
                          <button
                            onClick={() => onOpenPitchEditor(lead)}
                            className="text-left w-full group/pitch"
                          >
                            <p className="text-xs text-slate-300 line-clamp-2 group-hover/pitch:text-violet-300 transition-colors">
                              "{lead.ai_pitch.slice(0, 110)}..."
                            </p>
                            <span className="text-[10px] font-semibold text-violet-400 flex items-center gap-1 mt-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              Edit / Send Pitch
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenPitchEditor(lead)}
                            className="text-xs text-slate-400 hover:text-violet-400 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-violet-400" />
                            <span>Generate Pitch</span>
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Run Audit */}
                          <button
                            onClick={() => onRunAudit(lead.id)}
                            disabled={isCurrentlyAuditing || !lead.website_url}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 disabled:opacity-30 transition-colors"
                            title={isCurrentlyAuditing ? 'Auditing...' : 'Run website audit'}
                          >
                            <RotateCw className={`w-4 h-4 ${isCurrentlyAuditing ? 'animate-spin text-blue-400' : ''}`} />
                          </button>

                          {/* Open AI Pitch Editor */}
                          <button
                            onClick={() => onOpenPitchEditor(lead)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                            title="Edit AI Pitch & Outreach"
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>

                          {/* Send Email */}
                          <button
                            onClick={() => onOpenPitchEditor(lead)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="1-Click Send Outreach via Resend"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Table Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <span>
            Showing <strong className="text-slate-200">{filteredLeads.length}</strong> of{' '}
            <strong className="text-slate-200">{leads.length}</strong> total leads
          </span>
          <span className="hidden sm:inline">
            Click any Health Score to inspect vulnerabilities & tech stack
          </span>
        </div>
      </div>
    </div>
  );
}
