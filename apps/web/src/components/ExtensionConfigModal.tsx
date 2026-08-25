'use client';

import React, { useState } from 'react';
import { X, Chrome, Copy, Check, Terminal } from 'lucide-react';

interface ExtensionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExtensionConfigModal({ isOpen, onClose }: ExtensionConfigModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const extensionPath = `/Users/mahathir/Desktop/fetchpro-extension`;

  const copyToClipboard = (text: string, isUrl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUrl) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Chrome className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Connect FetchPro Chrome Extension</h2>
              <p className="text-xs text-slate-400">Scrape Google Maps and sync leads straight into your private dashboard</p>
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
        <div className="p-6 space-y-5 text-sm text-slate-300">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
              1
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">Load Unpacked Extension</h3>
              <p className="text-xs text-slate-400">
                In Google Chrome, open <code className="text-sky-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">chrome://extensions/</code>, enable <strong>Developer Mode</strong> (top-right toggle), and click <strong>Load unpacked</strong>.
              </p>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                <span className="truncate max-w-md">{extensionPath}</span>
                <button
                  onClick={() => copyToClipboard(extensionPath, false)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 shrink-0 ml-2"
                >
                  {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPath ? 'Copied' : 'Copy Path'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
              2
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">Configure Dashboard Sync URL</h3>
              <p className="text-xs text-slate-400">
                In the FetchPro extension popup, verify the Target URL is set to your dashboard domain:
              </p>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                <span>{currentOrigin}</span>
                <button
                  onClick={() => copyToClipboard(currentOrigin, true)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 shrink-0 ml-2"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
              3
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider">Scrape on Google Maps</h3>
              <p className="text-xs text-slate-400">
                Search Google Maps for businesses (e.g. <em className="text-slate-200">"Dentists in Austin"</em>), click <strong>Start Scraping</strong>, then click <strong>Sync Leads to Dashboard</strong>.
              </p>
            </div>
          </div>

          {/* Direct API Endpoint Info */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Sync API:</span>
              <span className="font-mono text-blue-400">POST /api/leads/sync</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live & Secure
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
