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
  Share2,
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
  const socials = lead.socials || audit?.socials;

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
              <div className="flex items-center gap-3 mt-0.5">
                <a
                  href={lead.website_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-1 truncate max-w-xs"
                >
                  <span>{lead.website_url || 'No Website URL'}</span>
                  {lead.website_url && <ExternalLink className="w-3 h-3" />}
                </a>

                {/* Social icons in header */}
                {socials && (socials.facebook || socials.instagram || socials.linkedin || socials.twitter || socials.youtube || socials.tiktok) && (
                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                    {socials.facebook && (
                      <a href={socials.facebook} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-400 hover:text-blue-300">fb</a>
                    )}
                    {socials.instagram && (
                      <a href={socials.instagram} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-pink-400 hover:text-pink-300">ig</a>
                    )}
                    {socials.linkedin && (
                      <a href={socials.linkedin} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-sky-400 hover:text-sky-300">in</a>
                    )}
                    {socials.twitter && (
                      <a href={socials.twitter} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-slate-300 hover:text-white">𝕏</a>
                    )}
                  </div>
                )}
              </div>
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
                {lead.website_url
                  ? 'Run an automated audit to analyze SSL certificates, mobile viewport tags, tech stack, copyright freshness, and email addresses.'
                  : 'This lead has no website URL. Pitch them a brand new mobile-friendly website to capture Google Maps traffic!'}
              </p>
              {lead.website_url ? (
                <button
                  onClick={() => onAuditAgain(lead.id)}
                  disabled={isAuditing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/25 transition-all"
                >
                  <RotateCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                  <span>{isAuditing ? 'Auditing Website...' : 'Run Automated Audit Now'}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPitchEditor(lead);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-amber-600 hover:bg-amber-500 shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate New Website Pitch</span>
                </button>
              )}
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
                    {audit.responseTimeMs < 1200 ? '⚡ Fast Response' : 'Moderate delay'}
                  </div>
                </div>
              </div>

              {/* Scraped Emails, Tech Stack & Socials */}
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

                {/* Social Profiles & Tech Stack */}
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-4">
                  {/* Social Profiles */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                      <Share2 className="w-3.5 h-3.5 text-pink-400" />
                      <span>Social Media Presence</span>
                    </h3>
                    {socials && (socials.facebook || socials.instagram || socials.linkedin || socials.twitter || socials.youtube || socials.tiktok) ? (
                      <div className="flex flex-wrap gap-2">
                        {socials.facebook && (
                          <a href={socials.facebook} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 flex items-center gap-1.5">
                            <span>Facebook</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {socials.instagram && (
                          <a href={socials.instagram} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-md text-xs font-medium bg-pink-600/10 text-pink-400 border border-pink-500/20 hover:bg-pink-600/20 flex items-center gap-1.5">
                            <span>Instagram</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {socials.linkedin && (
                          <a href={socials.linkedin} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-md text-xs font-medium bg-sky-600/10 text-sky-400 border border-sky-500/20 hover:bg-sky-600/20 flex items-center gap-1.5">
                            <span>LinkedIn</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {socials.twitter && (
                          <a href={socials.twitter} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-700/30 text-slate-300 border border-slate-700 hover:bg-slate-700/50 flex items-center gap-1.5">
                            <span>X / Twitter</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No social media links detected.</p>
                    )}
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Tech Stack</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {audit.techStack.cms && (
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          CMS: {audit.techStack.cms}
                        </span>
                      )}
                      {audit.techStack.frameworks.map((fw, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {fw}
                        </span>
                      ))}
                      {audit.techStack.analytics.map((an, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {an}
                        </span>
                      ))}
                      {!audit.techStack.cms && audit.techStack.frameworks.length === 0 && (
                        <span className="text-xs text-slate-400 italic">Custom / Static HTML</span>
                      )}
                    </div>
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
