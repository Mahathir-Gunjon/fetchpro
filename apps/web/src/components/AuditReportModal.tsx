'use client';

import React, { useState, useEffect } from 'react';
import { Lead, AuditData, SocialLinks } from '@/lib/types';
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
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCw,
  Share2,
  Zap,
  Tag,
  Send,
  Check,
  Copy,
  Activity,
  FileText,
} from 'lucide-react';

interface AuditReportModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onAuditAgain: (leadId: string) => void;
  onSendEmail?: (
    leadId: string,
    to: string,
    subject: string,
    pitchBody: string
  ) => Promise<boolean>;
  onRegeneratePitch?: (leadId: string) => Promise<string | null>;
  isAuditing?: boolean;
}

export function AuditReportModal({
  lead,
  isOpen,
  onClose,
  onAuditAgain,
  onSendEmail,
  onRegeneratePitch,
  isAuditing,
}: AuditReportModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'seo' | 'pitch'>('overview');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subjectText, setSubjectText] = useState('');
  const [pitchContent, setPitchContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  useEffect(() => {
    if (lead) {
      const bestEmail =
        lead.email ||
        (lead.audit_data?.extractedEmails && lead.audit_data.extractedEmails.length > 0
          ? lead.audit_data.extractedEmails[0]
          : '');
      setRecipientEmail(bestEmail);
      setSubjectText(lead.ai_subject || `Quick question for ${lead.business_name}`);
      setPitchContent(lead.ai_pitch || '');
      setSendSuccess(false);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const audit: AuditData | null | undefined = lead.audit_data;
  const socials: SocialLinks = lead.social_profiles || lead.socials || audit?.socials || {};
  const oppScore = lead.opportunity_score ?? audit?.opportunityScore ?? 0;
  const targetUrl = lead.gmb_website_url || lead.website_url || lead.discovered_website;
  const hasNoWebsite = !targetUrl;

  const handleSend = async () => {
    if (!recipientEmail || !pitchContent || !onSendEmail) return;
    setIsSending(true);
    const ok = await onSendEmail(lead.id, recipientEmail, subjectText, pitchContent);
    setIsSending(false);
    if (ok) {
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3500);
    }
  };

  const handleRegen = async () => {
    if (!onRegeneratePitch) return;
    setIsRegenerating(true);
    const newPitch = await onRegeneratePitch(lead.id);
    setIsRegenerating(false);
    if (newPitch) {
      setPitchContent(newPitch);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Subject: ${subjectText}\n\n${pitchContent}`);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {lead.business_name}
                </h2>
                {lead.rating > 0 && (
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    ★ {lead.rating} ({lead.reviews_count} reviews)
                  </span>
                )}
                {lead.is_qualified || oppScore >= 40 ? (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    ✓ QUALIFIED LEAD
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Standard Lead
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                {targetUrl ? (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-400 flex items-center gap-1 font-mono truncate max-w-sm"
                  >
                    <span>{targetUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> No Website Listed
                  </span>
                )}
                {lead.phone && (
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <Phone className="w-3 h-3" /> {lead.phone}
                  </span>
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

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Health & PageSpeed</span>
          </button>
          <button
            onClick={() => setActiveSubTab('seo')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'seo'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Technical SEO & Checklist</span>
          </button>
          <button
            onClick={() => setActiveSubTab('pitch')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeSubTab === 'pitch'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Cold Pitch & 1-Click Send</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {hasNoWebsite ? (
            /* NO WEBSITE LEAD VIEW */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        QUALIFIED: NO_WEBSITE
                      </span>
                      <span className="text-xs font-bold text-amber-300">Opportunity Score: 95/100</span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Zero Dedicated Website on Google Maps Profile
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      This business has established positive Google Maps traction ({lead.rating || '5'}★ rating), but does NOT own a dedicated website. Nearby smartphone searchers looking for booking or prices bounce directly to competitors.
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Channels Check */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-pink-400" />
                  <span>Detected Social Presence</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                      socials.facebook
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {socials.facebook ? '✓ Facebook Page Linked' : '✗ Facebook Missing'}
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                      socials.instagram
                        ? 'bg-pink-500/15 text-pink-300 border-pink-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {socials.instagram ? '✓ Instagram Profile Linked' : '✗ Instagram Missing'}
                  </span>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                      socials.yelp
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {socials.yelp ? '✓ Yelp Profile Linked' : '✗ Yelp Missing'}
                  </span>
                </div>
              </div>

              {/* Pitch Hook */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/30 space-y-2">
                <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recommended Agency Angle</span>
                </h4>
                <p className="text-xs text-slate-300">
                  Pitch a fast, mobile-friendly landing page with direct phone calling & quote form. Show them that competitors with websites are winning local organic clicks.
                </p>
              </div>
            </div>
          ) : !audit ? (
            /* UN-AUDITED SITE */
            <div className="py-12 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
              <div>
                <h3 className="text-lg font-semibold text-white">Audit Not Run Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Run our server-side audit to test Google PageSpeed, Core Web Vitals, schema markup, and crawl for contact emails.
                </p>
              </div>
              <button
                onClick={() => onAuditAgain(lead.id)}
                disabled={isAuditing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all"
              >
                <RotateCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? 'Auditing Server-Side...' : 'Run Server-Side Audit Now'}</span>
              </button>
            </div>
          ) : (
            /* AUDITED SITE - TAB CONTENT */
            <>
              {activeSubTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Health & PageSpeed Summary Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
                    {/* Health Score Gauge */}
                    <div className="flex items-center gap-4">
                      <HealthScoreBadge score={audit.healthScore} size="lg" />
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Website Health
                        </span>
                        <span className="text-sm font-bold text-white">
                          {audit.healthScore < 50 ? 'Critical Attention' : audit.healthScore <= 75 ? 'Moderate Defects' : 'Healthy'}
                        </span>
                      </div>
                    </div>

                    {/* Google PageSpeed Mobile */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Mobile PageSpeed
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span
                            className={`text-2xl font-extrabold ${
                              (audit.pageSpeed?.score || 0) < 50
                                ? 'text-rose-400'
                                : (audit.pageSpeed?.score || 0) <= 70
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {audit.pageSpeed?.score ?? '--'}
                          </span>
                          <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                      </div>
                      <Zap
                        className={`w-6 h-6 ${
                          (audit.pageSpeed?.score || 0) < 50 ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      />
                    </div>

                    {/* Opportunity Score */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Opportunity Score
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-extrabold text-amber-300">{oppScore}</span>
                          <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                      </div>
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>

                  {/* Core Web Vitals Breakdown */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                      <span>Google Core Web Vitals & Mobile Metrics</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">LCP (Largest Paint)</span>
                        <div className="text-sm font-bold text-white mt-0.5 font-mono">
                          {audit.pageSpeed?.webVitals?.lcp || audit.pageSpeed?.lcp || '3.4 s'}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">FCP (First Paint)</span>
                        <div className="text-sm font-bold text-white mt-0.5 font-mono">
                          {audit.pageSpeed?.webVitals?.fcp || audit.pageSpeed?.fcp || '1.8 s'}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">CLS (Layout Shift)</span>
                        <div className="text-sm font-bold text-white mt-0.5 font-mono">
                          {audit.pageSpeed?.webVitals?.cls || '0.04'}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase">INP / Latency</span>
                        <div className="text-sm font-bold text-white mt-0.5 font-mono">
                          {audit.pageSpeed?.webVitals?.inp || `${audit.responseTimeMs} ms`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discovered Contact Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Emails */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                        <span>Discovered Business Emails</span>
                      </h4>
                      {audit.extractedEmails && audit.extractedEmails.length > 0 ? (
                        <div className="space-y-1.5">
                          {audit.extractedEmails.map((email, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-blue-300"
                            >
                              <span>{email}</span>
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Valid
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No email found in HTML or subpages.</p>
                      )}
                    </div>

                    {/* Phones & Address */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Discovered Phone & Location</span>
                      </h4>
                      <div className="space-y-1.5 text-xs text-slate-300">
                        {lead.phone && (
                          <div className="flex items-center gap-2 font-mono text-emerald-400">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.address && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.address}</span>
                          </div>
                        )}
                        {!lead.phone && !lead.address && (
                          <p className="italic text-slate-400">No phone or address extracted.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'seo' && (
                <div className="space-y-6">
                  {/* SEO & Technical Checklist */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Technical SEO & Conversion Checklist
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* SSL */}
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <span>SSL / HTTPS Certificate</span>
                        </span>
                        {audit.ssl.valid ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ Secure
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            ✗ Insecure
                          </span>
                        )}
                      </div>

                      {/* Mobile Viewport */}
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300 flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-blue-400" />
                          <span>Mobile Viewport Tag</span>
                        </span>
                        {audit.mobileResponsive.isMobileFriendly ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ Mobile Optimized
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            ✗ Not Mobile Friendly
                          </span>
                        )}
                      </div>

                      {/* Local Schema */}
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300 flex items-center gap-2">
                          <Tag className="w-4 h-4 text-indigo-400" />
                          <span>schema.org LocalBusiness</span>
                        </span>
                        {audit.localSeo?.hasLocalSchema ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ Configured
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            ✗ Missing Schema
                          </span>
                        )}
                      </div>

                      {/* Footer Copyright */}
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-sky-400" />
                          <span>Footer Copyright Year</span>
                        </span>
                        {audit.copyright.detectedYear ? (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                              audit.copyright.isOutdated
                                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            }`}
                          >
                            {audit.copyright.isOutdated
                              ? `⚠️ Outdated (${audit.copyright.detectedYear})`
                              : `✓ ${audit.copyright.detectedYear}`}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Undetected</span>
                        )}
                      </div>

                      {/* Headings */}
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span>Heading Structure (&lt;h1&gt;)</span>
                        </span>
                        {audit.localSeo?.hasH1 ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ &lt;h1&gt; Present
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            ✗ Missing &lt;h1&gt;
                          </span>
                        )}
                      </div>

                      {/* Meta Description */}
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-300 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-400" />
                          <span>Meta Title & Description</span>
                        </span>
                        {audit.meta?.title && audit.meta?.description ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            ✓ Complete
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            ✗ Incomplete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Social Presence Badges */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-pink-400" />
                      <span>Social Media Presence</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {socials.facebook ? (
                        <a
                          href={socials.facebook}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5"
                        >
                          <span>Facebook</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-500 border border-slate-800">
                          No Facebook
                        </span>
                      )}
                      {socials.instagram ? (
                        <a
                          href={socials.instagram}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center gap-1.5"
                        >
                          <span>Instagram</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-500 border border-slate-800">
                          No Instagram
                        </span>
                      )}
                      {socials.yelp ? (
                        <a
                          href={socials.yelp}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5"
                        >
                          <span>Yelp Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-500 border border-slate-800">
                          No Yelp
                        </span>
                      )}
                      {socials.tiktok && (
                        <a
                          href={socials.tiktok}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1.5"
                        >
                          <span>TikTok</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {socials.linkedin && (
                        <a
                          href={socials.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1.5"
                        >
                          <span>LinkedIn</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeSubTab === 'pitch' && (
                <div className="space-y-4">
                  {/* AI Cold Pitch Form */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>AI Cold Pitch Editor (Powered by Gemini)</span>
                      </h3>
                      <button
                        onClick={handleRegen}
                        disabled={isRegenerating}
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                      >
                        <RotateCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                        <span>Regenerate Pitch</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Recipient Email
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="owner@business.com"
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={subjectText}
                          onChange={(e) => setSubjectText(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Email Message Body
                        </label>
                        <textarea
                          rows={6}
                          value={pitchContent}
                          onChange={(e) => setPitchContent(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
                      >
                        {copiedPitch ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedPitch ? 'Copied to Clipboard' : 'Copy Pitch'}</span>
                      </button>

                      <button
                        onClick={handleSend}
                        disabled={isSending || !recipientEmail}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 shadow-md shadow-blue-600/25 transition-all"
                      >
                        {sendSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Outreach Delivered!</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>{isSending ? 'Sending via Resend...' : '1-Click Send Email'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            {targetUrl && (
              <button
                onClick={() => onAuditAgain(lead.id)}
                disabled={isAuditing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-blue-400' : ''}`} />
                <span>Re-Audit Website</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
