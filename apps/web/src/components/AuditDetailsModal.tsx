'use client';

import React from 'react';
import { Lead, AuditData } from '@/lib/types';
import { HealthScoreBadge } from './HealthScoreBadge';
import {
  X,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Calendar,
  Layers,
  Mail,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCw,
} from 'lucide-react';

interface AuditDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onAuditAgain: (leadId: string) => void;
  onOpenPitchEditor: (lead: Lead) => void;
  isAuditing?: boolean;
}

export function AuditDetailsModal({
  lead,
  isOpen,
  onClose,
  onAuditAgain,
  onOpenPitchEditor,
  isAuditing,
}: AuditDetailsModalProps) {
  if (!isOpen || !lead) return null;

  const audit = lead.audit_data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{lead.business_name}</span>
                {lead.rating > 0 && (
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    ★ {lead.rating} ({lead.reviews_count})
                  </span>
                )}
              </h2>
              <a
                href={lead.website_url || '#'}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 mt-0.5 truncate max-w-md"
              >
                <span>{lead.website_url || 'No Website URL'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!audit ? (
            <div className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3 opacity-80" />
              <h3 className="text-lg font-semibold text-white">No Audit Data Yet</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1 mb-6">
                Run an automated audit to analyze SSL certificates, mobile viewport tags, tech stack, copyright freshness, and email addresses.
              </p>
              <button
                onClick={() => onAuditAgain(lead.id)}
                disabled={isAuditing || !lead.website_url}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/25 transition-all"
              >
                <RotateCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? 'Auditing Website...' : 'Run Automated Audit Now'}</span>
              </button>
            </div>
          ) : (
            <>
              {/* Top Summary Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center sm:text-left">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Website Health Score
                    </span>
                    <HealthScoreBadge score={audit.healthScore} size="lg" />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => onAuditAgain(lead.id)}
                    disabled={isAuditing}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-blue-400' : ''}`} />
                    <span>Re-Audit</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPitchEditor(lead);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/25 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Pitch</span>
                  </button>
                </div>
              </div>

              {/* Core Audit Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* SSL */}
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">SSL Protocol</span>
                    {audit.ssl.valid ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {audit.ssl.valid ? 'Valid & Secure' : 'Insecure / Missing'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {audit.ssl.protocol || (audit.ssl.hasSsl ? 'HTTPS' : 'HTTP')}
                  </div>
                </div>

                {/* Mobile */}
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Mobile Friendly</span>
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-sm font-bold text-white">
                    {audit.mobileResponsive.isMobileFriendly ? 'Optimized' : 'Not Responsive'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {audit.mobileResponsive.hasViewport ? 'Viewport tag active' : 'Missing viewport'}
                  </div>
                </div>

                {/* Copyright Year */}
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Footer Year</span>
                    <Calendar className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-sm font-bold text-white">
                    {audit.copyright.detectedYear ? `Year ${audit.copyright.detectedYear}` : 'Not Detected'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {audit.copyright.isOutdated ? (
                      <span className="text-rose-400 font-medium">⚠️ Backdated Date</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">Up to Date</span>
                    )}
                  </div>
                </div>

                {/* Response Speed */}
                <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Speed Latency</span>
                    <Clock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-sm font-bold text-white">
                    {audit.responseTimeMs} ms
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {audit.responseTimeMs < 1000 ? '⚡ Fast Response' : 'Moderate delay'}
                  </div>
                </div>
              </div>

              {/* Scraped Emails & Tech Stack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Scraped Emails */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Discovered Contact Emails</span>
                  </h3>
                  {audit.extractedEmails && audit.extractedEmails.length > 0 ? (
                    <div className="space-y-1.5">
                      {audit.extractedEmails.map((email, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200"
                        >
                          <span className="font-mono text-blue-300">{email}</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Verified Regex
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No direct email found in HTML or contact pages.</p>
                  )}
                </div>

                {/* Tech Stack */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Detected Tech Stack</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {audit.techStack.cms && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        CMS: {audit.techStack.cms}
                      </span>
                    )}
                    {audit.techStack.frameworks.map((fw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        {fw}
                      </span>
                    ))}
                    {audit.techStack.analytics.map((an, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {an}
                      </span>
                    ))}
                    {!audit.techStack.cms && audit.techStack.frameworks.length === 0 && (
                      <span className="text-xs text-slate-400 italic">Custom / Static HTML</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Identified Issues List */}
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Audit Findings & Vulnerabilities</span>
                </h3>
                <div className="space-y-2">
                  {audit.issues.map((issue, idx) => {
                    const isErr = issue.type === 'error';
                    const isWarn = issue.type === 'warning';
                    const isSucc = issue.type === 'success';

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-start gap-3 text-xs ${
                          isErr
                            ? 'bg-rose-500/5 border-rose-500/20 text-rose-200'
                            : isWarn
                            ? 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                            : isSucc
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}
                      >
                        {isErr && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                        {isWarn && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                        {isSucc && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                        {!isErr && !isWarn && !isSucc && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <div className="font-semibold text-white">{issue.title}</div>
                          <div className="text-slate-400 mt-0.5">{issue.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/30 to-indigo-950/30 border border-blue-800/30">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Key Cold Outreach Opportunities</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  {audit.keyRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <span className="text-xs text-slate-400">
            {audit?.auditedAt ? `Audited on ${new Date(audit.auditedAt).toLocaleString()}` : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
