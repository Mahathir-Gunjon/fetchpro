'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lead, DashboardStats, ExtractedLeadInput } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { StatsOverview } from '@/components/StatsOverview';
import { LeadsTable } from '@/components/LeadsTable';
import { AuditDetailsModal } from '@/components/AuditDetailsModal';
import { PitchEditorModal } from '@/components/PitchEditorModal';
import { AddLeadModal } from '@/components/AddLeadModal';
import { ExtensionConfigModal } from '@/components/ExtensionConfigModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { INITIAL_MOCK_LEADS } from '@/lib/mock-data';

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_MOCK_LEADS);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: INITIAL_MOCK_LEADS.length,
    auditedLeads: INITIAL_MOCK_LEADS.filter((l) => l.status === 'audited' || l.status === 'emailed').length,
    averageHealthScore: 63,
    emailsSent: 1,
    leadsWithWebsites: INITIAL_MOCK_LEADS.filter((l) => !!l.website_url).length,
    leadsWithPhones: INITIAL_MOCK_LEADS.filter((l) => !!l.phone).length,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [auditingId, setAuditingId] = useState<string | null>(null);

  // Modals state
  const [selectedAuditLead, setSelectedAuditLead] = useState<Lead | null>(null);
  const [selectedPitchLead, setSelectedPitchLead] = useState<Lead | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isExtensionConfigOpen, setIsExtensionConfigOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to merge and deduplicate leads
  const mergeLeads = (existing: Lead[], incoming: Lead[]): Lead[] => {
    const map = new Map<string, Lead>();
    // First existing
    existing.forEach((l) => {
      const key = l.id || l.maps_url || l.business_name.toLowerCase();
      map.set(key, l);
    });
    // Incoming overrides/adds
    incoming.forEach((l) => {
      const key = l.id || l.maps_url || l.business_name.toLowerCase();
      map.set(key, l);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  // Recalculate stats helper
  const calculateStats = (leadList: Lead[]): DashboardStats => {
    const totalLeads = leadList.length;
    const auditedLeads = leadList.filter((l) => l.status === 'audited' || l.status === 'emailed').length;
    const emailsSent = leadList.filter((l) => l.status === 'emailed').length;
    const leadsWithWebsites = leadList.filter((l) => !!l.website_url).length;
    const leadsWithPhones = leadList.filter((l) => !!l.phone).length;

    const scored = leadList.filter((l) => l.audit_data?.healthScore !== undefined);
    const averageHealthScore = scored.length > 0
      ? Math.round(scored.reduce((acc, l) => acc + (l.audit_data?.healthScore || 0), 0) / scored.length)
      : 0;

    return {
      totalLeads,
      auditedLeads,
      averageHealthScore,
      emailsSent,
      leadsWithWebsites,
      leadsWithPhones,
    };
  };

  // Save leads to local storage & state
  const persistLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    setStats(calculateStats(newLeads));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('leadflow_persisted_leads', JSON.stringify(newLeads));
      } catch (e) {}
    }
  };

  // Fetch leads and stats from API
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
          // Merge with localStorage
          let savedLocal: Lead[] = [];
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('leadflow_persisted_leads');
              if (raw) savedLocal = JSON.parse(raw);
            } catch (e) {}
          }

          const combined = mergeLeads(savedLocal, data.leads);
          setLeads(combined);
          setStats(calculateStats(combined));
        }
      }
    } catch (err) {
      console.warn('API fetch warning, using local state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // On initial mount
  useEffect(() => {
    // 1. Load from localStorage immediately for zero latency
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('leadflow_persisted_leads');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLeads(parsed);
            setStats(calculateStats(parsed));
          }
        }
      } catch (e) {}
    }

    // 2. Fetch from API
    fetchDashboardData();

    // 3. Setup real-time polling every 4 seconds so synced leads from extension appear automatically
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Run Website Audit
  const handleRunAudit = async (leadId: string) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead || !targetLead.website_url) {
      addToast('error', 'Cannot audit lead', 'Lead has no website URL.');
      return;
    }

    setAuditingId(leadId);
    try {
      const res = await fetch('/api/leads/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, url: targetLead.website_url }),
      });

      const data = await res.json();
      if (data.success && data.lead) {
        const updated = leads.map((l) => (l.id === leadId ? data.lead : l));
        persistLeads(updated);

        if (selectedAuditLead?.id === leadId) {
          setSelectedAuditLead(data.lead);
        }
        addToast(
          'success',
          'Audit Completed',
          `Score: ${data.auditData.healthScore}/100 for ${targetLead.business_name}`
        );
      } else {
        throw new Error(data.error || 'Audit failed');
      }
    } catch (err: any) {
      addToast('error', 'Audit Failed', err.message || 'Could not reach target website.');
    } finally {
      setAuditingId(null);
    }
  };

  // Generate / Regenerate AI Pitch
  const handleRegeneratePitch = async (leadId: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/leads/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });

      const data = await res.json();
      if (data.success && data.pitch) {
        const updated = leads.map((l) =>
          l.id === leadId
            ? { ...l, ai_pitch: data.pitch, ai_subject: data.subject }
            : l
        );
        persistLeads(updated);
        return data.pitch;
      }
    } catch (err) {
      console.error('Failed to regenerate pitch:', err);
    }
    return null;
  };

  // Send Email via Resend
  const handleSendEmail = async (
    leadId: string,
    to: string,
    subject: string,
    pitchBody: string
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/leads/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, to, subject, pitchBody }),
      });

      const data = await res.json();
      if (data.success) {
        const updated = leads.map((l) =>
          l.id === leadId
            ? {
                ...l,
                status: 'emailed' as const,
                email: to,
                ai_subject: subject,
                ai_pitch: pitchBody,
                emailed_at: new Date().toISOString(),
              }
            : l
        );
        persistLeads(updated);

        addToast(
          'success',
          'Outreach Dispatched',
          data.message || `Email delivered to ${to} via Resend!`
        );
        return true;
      } else {
        throw new Error(data.error || 'Failed to dispatch email');
      }
    } catch (err: any) {
      addToast('error', 'Email Delivery Error', err.message || 'Resend API failed.');
      return false;
    }
  };

  // Manual Add Lead
  const handleAddLead = async (leadInput: ExtractedLeadInput) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadInput),
      });

      const data = await res.json();
      const newLead = data.lead || {
        id: `lead_${Date.now()}`,
        business_name: leadInput.business_name,
        phone: leadInput.phone || null,
        rating: leadInput.rating || 0,
        reviews_count: leadInput.reviews_count || 0,
        maps_url: leadInput.maps_url || null,
        website_url: leadInput.website_url || null,
        email: leadInput.email || null,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      const updated = [newLead, ...leads];
      persistLeads(updated);
      addToast('success', 'Lead Added', `Added ${leadInput.business_name} to pipeline.`);

      // Automatically trigger audit if website is provided
      if (leadInput.website_url) {
        handleRunAudit(newLead.id);
      }
    } catch (err: any) {
      addToast('error', 'Error adding lead', err.message);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      await fetch(`/api/leads?id=${leadId}`, { method: 'DELETE' });
      const updated = leads.filter((l) => l.id !== leadId);
      persistLeads(updated);
      addToast('info', 'Lead Deleted', 'Removed lead from pipeline.');
    } catch (err) {
      console.error('Delete lead error:', err);
    }
  };

  // Reset / Reload Demo Leads
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/leads/demo-seed', { method: 'POST' });
      const data = await res.json();
      const freshLeads = data.leads || INITIAL_MOCK_LEADS;
      persistLeads(freshLeads);
      addToast('success', 'Demo Leads Reloaded', 'Loaded 6 sample leads with rich audit metrics.');
    } catch (err) {
      console.error('Demo seed error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.location.href = '/api/leads/export';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Navbar */}
      <Navbar
        onAddLead={() => setIsAddLeadOpen(true)}
        onOpenExtensionConfig={() => setIsExtensionConfigOpen(true)}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>B2B Pipeline & Website Audits</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage extracted Google Maps leads, inspect automated audit flaws, and dispatch AI cold pitches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExtensionConfigOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-all"
            >
              <span>Connect Scraper Extension</span>
            </button>
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/25 transition-all"
            >
              <span>+ Add Lead</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Leads Table */}
        <LeadsTable
          leads={leads}
          onOpenAudit={(lead) => setSelectedAuditLead(lead)}
          onOpenPitchEditor={(lead) => setSelectedPitchLead(lead)}
          onRunAudit={handleRunAudit}
          onDeleteLead={handleDeleteLead}
          onExportCsv={handleExportCsv}
          onAddLead={() => setIsAddLeadOpen(true)}
          auditingId={auditingId}
        />
      </main>

      {/* Modals */}
      <AuditDetailsModal
        lead={selectedAuditLead}
        isOpen={!!selectedAuditLead}
        onClose={() => setSelectedAuditLead(null)}
        onAuditAgain={handleRunAudit}
        onOpenPitchEditor={(lead) => setSelectedPitchLead(lead)}
        isAuditing={auditingId === selectedAuditLead?.id}
      />

      <PitchEditorModal
        lead={selectedPitchLead}
        isOpen={!!selectedPitchLead}
        onClose={() => setSelectedPitchLead(null)}
        onSendEmail={handleSendEmail}
        onRegeneratePitch={handleRegeneratePitch}
      />

      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onAddLead={handleAddLead}
      />

      <ExtensionConfigModal
        isOpen={isExtensionConfigOpen}
        onClose={() => setIsExtensionConfigOpen(false)}
      />
    </div>
  );
}
