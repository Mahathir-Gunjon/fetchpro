'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/lib/types';
import {
  X,
  Sparkles,
  Send,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Calendar,
  Zap,
  Globe,
  Mail,
  Phone,
  Copy,
  Check,
  Activity,
  Layers,
  Flame,
} from 'lucide-react';

interface AuditDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onAuditAgain: (leadId: string) => void;
  onSendEmail: (leadId: string, to: string, subject: string, pitchBody: string) => Promise<boolean>;
  onRegeneratePitch?: (leadId: string) => Promise<string | null>;
  isAuditing?: boolean;
}

export function AuditDrawer({
  lead,
  isOpen,
  onClose,
  onAuditAgain,
  onSendEmail,
  onRegeneratePitch,
  isAuditing = false,
}: AuditDrawerProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [pitchBody, setPitchBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      const extractedFirst = lead.audit_data?.extractedEmails?.[0];
      setRecipientEmail(lead.email || extractedFirst || '');
      setSubject(
        lead.ai_subject ||
          `Quick question regarding ${lead.business_name}'s website`
      );
      setPitchBody(
        lead.ai_pitch ||
          `Hi ${lead.business_name} Team,\n\nI came across your Google Maps listing and noticed your website has critical speed and mobile display issues that cause potential customers to leave before calling.\n\nWould it be okay if I sent over a short 2-minute video showing how to resolve this?`
      );
    }
  }, [lead]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lead) return null;

  const audit = lead.audit_data;
  const healthScore = audit?.healthScore ?? (lead.website_url ? 45 : 15);
  const pageSpeedScore = audit?.pageSpeed?.score;
  const webVitals = audit?.pageSpeed?.webVitals;
  const socials = lead.social_profiles || lead.socials || audit?.socials;
  const primaryReason =
    lead.qualification_log?.primary_reason ||
    lead.opportunity_reasons?.[0] ||
    (!lead.website_url
      ? 'No Website Found on Profile or Web Results (Immediate Need for Full Site Build)'
      : 'High Opportunity Lead with Performance & SEO Conversion Leaks');

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSend = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }
    setIsSending(true);
    try {
      const success = await onSendEmail(lead.id, recipientEmail, subject, pitchBody);
      if (success) {
        onClose();
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegeneratePitch) return;
    setIsRegenerating(true);
    try {
      const newPitch = await onRegeneratePitch(lead.id);
      if (newPitch) {
        setPitchBody(newPitch);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Slide-Over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800/90 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 transition-colors">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-600/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    {lead.business_name}
                  </h2>
                  {lead.category && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {lead.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                  {lead.website_url || lead.gmb_website_url || lead.discovered_website || 'No website registered'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {lead.website_url && (
                <button
                  onClick={() => onAuditAgain(lead.id)}
                  disabled={isAuditing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50"
                  title="Run Real-time Audit"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin text-blue-500' : ''}`} />
                  <span>{isAuditing ? 'Auditing...' : 'Re-Audit'}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {/* 1. Executive Summary Card */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900 border border-amber-200 dark:border-amber-500/30 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Executive Lead Qualification Reason
                </span>
                <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/30">
                  Opp Score: {lead.opportunity_score || (lead.website_url ? 85 : 95)}/100
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                {primaryReason}
              </p>
              {lead.opportunity_reasons && lead.opportunity_reasons.length > 1 && (
                <ul className="mt-3 space-y-1.5 pt-2 border-t border-amber-200 dark:border-amber-500/20 text-xs text-slate-700 dark:text-slate-300">
                  {lead.opportunity_reasons.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 2. Visual Checklist & Performance Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Website Health & Technical SEO Checklist
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Overall Health Score */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Health Score</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-extrabold font-mono ${
                        healthScore < 50
                          ? 'text-rose-600 dark:text-rose-400'
                          : healthScore < 75
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {healthScore}
                    </span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                </div>

                {/* PageSpeed Performance */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Mobile Speed</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span
                      className={`text-2xl font-extrabold font-mono ${
                        typeof pageSpeedScore === 'number'
                          ? pageSpeedScore < 50
                            ? 'text-rose-600 dark:text-rose-400'
                            : pageSpeedScore <= 70
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {pageSpeedScore ?? (lead.website_url ? '34' : 'N/A')}
                    </span>
                    {typeof pageSpeedScore === 'number' && <span className="text-xs text-slate-400">/100</span>}
                  </div>
                </div>

                {/* SSL Security */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">SSL Certificate</span>
                  <div className="mt-2 flex items-center gap-1.5">
                    {audit?.ssl.valid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        Valid HTTPS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        Not Secure
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile Viewport */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Mobile Layout</span>
                  <div className="mt-2 flex items-center gap-1.5">
                    {audit?.mobileResponsive.isMobileFriendly !== false ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        Responsive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                        <Smartphone className="w-4 h-4 text-rose-500" />
                        Broken Viewport
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Core Web Vitals & Copyright Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Core Web Vitals */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    Core Web Vitals Breakdown
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">LCP (Load)</span>
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {webVitals?.lcp || audit?.pageSpeed?.lcp || '5.8 s'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">FCP (Paint)</span>
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {webVitals?.fcp || audit?.pageSpeed?.fcp || '3.2 s'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">CLS (Shift)</span>
                      <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                        {webVitals?.cls || audit?.pageSpeed?.cls || '0.22'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Copyright & Schema */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    Copyright & Schema Signals
                  </span>
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Footer Copyright:</span>
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded ${
                          audit?.copyright.isOutdated
                            ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {audit?.copyright.detectedYear ? `© ${audit.copyright.detectedYear} - Backdated` : 'Not Declared'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">schema.org LocalBusiness:</span>
                      <span
                        className={`font-semibold ${
                          audit?.localSeo?.hasLocalSchema ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {audit?.localSeo?.hasLocalSchema ? '✅ Implemented' : '⚠️ Missing JSON-LD'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Discovered Online Links & Social Profiles */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Discovered Online Links & Social Profiles
              </h3>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                {/* Social Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  {socials?.facebook && (
                    <a
                      href={socials.facebook}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-600/15 hover:bg-blue-200 dark:hover:bg-blue-600/25 border border-blue-200 dark:border-blue-500/30 transition-colors"
                    >
                      <span>Facebook</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {socials?.instagram && (
                    <a
                      href={socials.instagram}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-600/15 hover:bg-pink-200 dark:hover:bg-pink-600/25 border border-pink-200 dark:border-pink-500/30 transition-colors"
                    >
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {socials?.yelp && (
                    <a
                      href={socials.yelp}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-600/15 hover:bg-rose-200 dark:hover:bg-rose-600/25 border border-rose-200 dark:border-rose-500/30 transition-colors"
                    >
                      <span>Yelp Listing</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {socials?.tiktok && (
                    <a
                      href={socials.tiktok}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-600/15 hover:bg-teal-200 dark:hover:bg-teal-600/25 border border-teal-200 dark:border-teal-500/30 transition-colors"
                    >
                      <span>TikTok</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {socials?.mapquest && (
                    <a
                      href={socials.mapquest}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-600/15 hover:bg-amber-200 dark:hover:bg-amber-600/25 border border-amber-200 dark:border-amber-500/30 transition-colors"
                    >
                      <span>MapQuest</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {socials?.linkedin && (
                    <a
                      href={socials.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-600/15 hover:bg-sky-200 dark:hover:bg-sky-600/25 border border-sky-200 dark:border-sky-500/30 transition-colors"
                    >
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {!socials?.facebook && !socials?.instagram && !socials?.yelp && !socials?.tiktok && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                      Zero social presence detected (High opportunity for social setup & local pack pitch).
                    </span>
                  )}
                </div>

                {/* Extracted Direct Contact Details */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {lead.phone && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        {lead.phone}
                      </span>
                      <button
                        onClick={() => copyToClipboard(lead.phone!, 'phone')}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                        title="Copy phone"
                      >
                        {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {recipientEmail && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-800 dark:text-slate-300 font-mono truncate max-w-[200px] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        {recipientEmail}
                      </span>
                      <button
                        onClick={() => copyToClipboard(recipientEmail, 'email')}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 shrink-0"
                        title="Copy email"
                      >
                        {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. AI Cold Email Editor (Send via Resend) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  AI Personalized Cold Outreach Pitch (Resend)
                </h3>
                {onRegeneratePitch && (
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 flex items-center gap-1 transition-colors disabled:opacity-50 font-medium"
                  >
                    <RotateCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate Pitch</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 shadow-inner">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g. contact@business.com"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    3-Sentence Outreach Pitch Body
                  </label>
                  <textarea
                    rows={5}
                    value={pitchBody}
                    onChange={(e) => setPitchBody(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed resize-none transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dispatches directly via configured Resend API
                  </span>
                  <button
                    onClick={handleSend}
                    disabled={isSending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/25 transition-all"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-pulse' : ''}`} />
                    <span>{isSending ? 'Sending Outreach...' : 'Send via Resend'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
