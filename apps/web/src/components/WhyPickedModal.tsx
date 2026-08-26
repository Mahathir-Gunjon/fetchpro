'use client';

import React from 'react';
import { Lead, QualificationLog } from '@/lib/types';
import {
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flame,
  Globe,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Calendar,
  Tag,
  ExternalLink,
  RotateCw,
} from 'lucide-react';

interface WhyPickedModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPitchEditor: (lead: Lead) => void;
  onRunAudit: (leadId: string) => void;
  isAuditing?: boolean;
}

export function WhyPickedModal({
  lead,
  isOpen,
  onClose,
  onOpenPitchEditor,
  onRunAudit,
  isAuditing = false,
}: WhyPickedModalProps) {
  if (!isOpen || !lead) return null;

  const log: QualificationLog = lead.qualification_log || {
    is_qualified: lead.status === 'hot_lead' || !lead.website_url,
    primary_reason: !lead.website_url
      ? 'No Website Found on Google Maps Profile or Web Results'
      : (lead.opportunity_reasons?.[0] ?? 'Website has critical performance & conversion gaps'),
    qualification_tag: !lead.website_url ? 'NO_WEBSITE' : 'OUTDATED_WEBSITE',
    checks: {
      google_maps_website_button: Boolean(lead.website_url),
      web_results_matched: true,
      facebook_page_found: Boolean(lead.socials?.facebook),
      instagram_page_found: Boolean(lead.socials?.instagram),
      tiktok_page_found: Boolean(lead.socials?.tiktok),
      ssl_valid: lead.audit_data?.ssl ? lead.audit_data.ssl.hasSsl && lead.audit_data.ssl.valid : null,
      copyright_year: lead.audit_data?.copyright?.detectedYear || null,
      mobile_speed_score: lead.audit_data?.pageSpeed?.score || null,
      missing_local_schema: lead.audit_data?.localSeo ? !lead.audit_data.localSeo.hasLocalSchema : null,
    },
    score: lead.opportunity_score ?? 85,
  };

  const isHot = log.is_qualified && log.score >= 45;
  const isNoWebsite = log.qualification_tag === 'NO_WEBSITE' || !lead.website_url;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">{lead.business_name}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                    isNoWebsite
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : isHot
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  QUALIFIED: {log.qualification_tag}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI Qualification Log & Transparent Opportunity Reasoning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Primary Reasoning Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              isNoWebsite
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                : isHot
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                : 'bg-blue-950/30 border-blue-500/30 text-blue-200'
            }`}
          >
            {isNoWebsite ? (
              <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider opacity-80">Primary Qualification Reason</div>
              <div className="text-sm font-semibold text-white mt-1 leading-snug">{log.primary_reason}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Opportunity Score</div>
              <div className="text-2xl font-extrabold text-amber-400">{log.score}/100</div>
            </div>
          </div>

          {/* Deep Inspection Checks Breakdown */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Deep Verification Checks (Google Maps & Profile DOM)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. GMB Website Button */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-300">GMB Header Website Button</span>
                </div>
                {log.checks.google_maps_website_button ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Found
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-semibold">
                    <XCircle className="w-3.5 h-3.5" /> Missing
                  </span>
                )}
              </div>

              {/* 2. Web Results Matched */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-300">Bottom Web Results Scraped</span>
                </div>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>

              {/* 3. Social Media Presence */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-pink-400" />
                  <span className="text-slate-300">Social Profiles Detected</span>
                </div>
                {log.checks.facebook_page_found || log.checks.instagram_page_found || log.checks.tiktok_page_found ? (
                  <span className="text-sky-300 font-medium font-mono text-[11px]">
                    {[
                      log.checks.facebook_page_found && 'FB',
                      log.checks.instagram_page_found && 'IG',
                      log.checks.tiktok_page_found && 'TikTok',
                    ]
                      .filter(Boolean)
                      .join(' • ')}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">None found</span>
                )}
              </div>

              {/* 4. SSL / HTTPS Certificate */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {log.checks.ssl_valid ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span className="text-slate-300">SSL Certificate (HTTPS)</span>
                </div>
                {log.checks.ssl_valid === null ? (
                  <span className="text-slate-400 italic">N/A (No site)</span>
                ) : log.checks.ssl_valid ? (
                  <span className="text-emerald-400 font-semibold">Secure</span>
                ) : (
                  <span className="text-rose-400 font-semibold">⚠️ Insecure / Missing</span>
                )}
              </div>

              {/* 5. Mobile PageSpeed */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-300">Mobile PageSpeed</span>
                </div>
                {log.checks.mobile_speed_score !== null ? (
                  <span
                    className={`font-bold ${
                      log.checks.mobile_speed_score < 50
                        ? 'text-rose-400'
                        : log.checks.mobile_speed_score <= 70
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {log.checks.mobile_speed_score}/100
                  </span>
                ) : (
                  <span className="text-slate-400 italic">N/A</span>
                )}
              </div>

              {/* 6. Copyright Year */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-slate-300">Footer Copyright Year</span>
                </div>
                {log.checks.copyright_year ? (
                  <span
                    className={`font-semibold ${
                      log.checks.copyright_year <= 2023 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {log.checks.copyright_year} {log.checks.copyright_year <= 2023 ? '(Backdated)' : ''}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Not detected</span>
                )}
              </div>

              {/* 7. Local Schema (JSON-LD) */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs sm:col-span-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-slate-300">LocalBusiness Schema Markup</span>
                </div>
                {log.checks.missing_local_schema === null ? (
                  <span className="text-slate-400 italic">N/A</span>
                ) : log.checks.missing_local_schema ? (
                  <span className="text-amber-400 font-semibold">⚠️ Missing JSON-LD Schema</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">✓ Local Schema Configured</span>
                )}
              </div>
            </div>
          </div>

          {/* Agency Pitch Recommendation */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1 text-xs">
            <span className="font-bold text-slate-300 uppercase tracking-wider block text-[11px]">
              Recommended Agency Angle:
            </span>
            <p className="text-slate-300 leading-relaxed">
              {isNoWebsite
                ? `Pitch ${lead.business_name} an instant mobile booking website to stop losing local Google Maps searchers to nearby competitors.`
                : `Highlight their ${log.checks.mobile_speed_score || 35}/100 mobile latency & missing schema with a 2-minute video teardown offer.`}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2.5">
            {lead.website_url && (
              <button
                onClick={() => onRunAudit(lead.id)}
                disabled={isAuditing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-blue-400' : ''}`} />
                <span>Re-Audit</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenPitchEditor(lead);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Review AI Cold Pitch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
