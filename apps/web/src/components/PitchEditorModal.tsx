'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/lib/types';
import {
  X,
  Sparkles,
  Send,
  Mail,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface PitchEditorModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSendEmail: (leadId: string, to: string, subject: string, pitchBody: string) => Promise<boolean>;
  onRegeneratePitch: (leadId: string) => Promise<string | null>;
}

export function PitchEditorModal({
  lead,
  isOpen,
  onClose,
  onSendEmail,
  onRegeneratePitch,
}: PitchEditorModalProps) {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (lead) {
      const defaultEmail = lead.email || (lead.audit_data?.extractedEmails?.[0] ?? '');
      setToEmail(defaultEmail);
      setSubject(lead.ai_subject || `Quick question regarding ${lead.business_name}`);
      setBody(
        lead.ai_pitch ||
          `Hi ${lead.business_name} Team,\n\n` +
          `Congrats on your great reviews on Google Maps!\n\n` +
          `While checking out ${lead.website_url || 'your website'}, I noticed a few quick fixes on mobile speed that could help you convert more local inquiries.\n\n` +
          `Would you be open to a 60-second video walkthrough showing how to fix this?`
      );
      setFeedback(null);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleSend = async () => {
    if (!toEmail || !toEmail.includes('@')) {
      setFeedback({ type: 'error', message: 'Please enter a valid recipient email address.' });
      return;
    }
    if (!body.trim()) {
      setFeedback({ type: 'error', message: 'Email body cannot be empty.' });
      return;
    }

    setIsSending(true);
    setFeedback(null);
    try {
      const success = await onSendEmail(lead.id, toEmail, subject, body);
      if (success) {
        setFeedback({
          type: 'success',
          message: 'Cold outreach email sent successfully via Resend!',
        });
      } else {
        setFeedback({ type: 'error', message: 'Failed to send email. Check API key or logs.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error sending email' });
    } finally {
      setIsSending(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setFeedback(null);
    try {
      const newPitch = await onRegeneratePitch(lead.id);
      if (newPitch) {
        setBody(newPitch);
        setFeedback({ type: 'success', message: 'Regenerated fresh AI pitch with Gemini!' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Failed to generate AI pitch.' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Cold Outreach Pitch</span>
                <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded border border-violet-200 dark:border-violet-500/20">
                  Gemini 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personalized outreach targeting {lead.business_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Recipient Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Recipient Email
              </span>
              {lead.audit_data?.extractedEmails && lead.audit_data.extractedEmails.length > 1 && (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400 lowercase">use:</span>
                  {lead.audit_data.extractedEmails.slice(0, 2).map((em, i) => (
                    <button
                      key={i}
                      onClick={() => setToEmail(em)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="e.g. owner@business.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-all"
            />
          </div>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Quick question regarding website"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium transition-all"
            />
          </div>

          {/* Email Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Email Message (3-4 Sentences)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>
              </div>
            </div>
            <textarea
              rows={7}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Lead Context Snippet */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-300">{lead.business_name}</span>
              {lead.phone && <span className="ml-2 font-mono">📞 {lead.phone}</span>}
            </div>
            {lead.website_url && (
              <a
                href={lead.website_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[200px]"
              >
                <span>{lead.website_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSend}
              disabled={isSending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-pulse' : ''}`} />
              <span>{isSending ? 'Sending Outreach...' : '1-Click Send via Resend'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
