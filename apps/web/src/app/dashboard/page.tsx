'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  // Fetch leads and stats from API
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.leads) {
          setLeads(data.leads);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      }
    } catch (err) {
      console.warn('Using client memory state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
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
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        if (selectedAuditLead?.id === leadId) {
          setSelectedAuditLead(data.lead);
        }
        addToast(
          'success',
          'Audit Completed',
          `Score: ${data.auditData.healthScore}/100 for ${targetLead.business_name}`
        );
        fetchDashboardData();
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
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, ai_pitch: data.pitch, ai_subject: data.subject }
              : l
          )
        );
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
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  status: 'emailed',
                  email: to,
                  ai_subject: subject,
                  ai_pitch: pitchBody,
                  emailed_at: new Date().toISOString(),
                }
              : l
          )
        );
        addToast(
          'success',
          'Outreach Dispatched',
          data.message || `Email delivered to ${to} via Resend!`
        );
        fetchDashboardData();
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
      if (data.success && data.lead) {
        setLeads((prev) => [data.lead, ...prev]);
        addToast('success', 'Lead Added', `Added ${leadInput.business_name} to pipeline.`);

        // Automatically trigger audit if website is provided
        if (leadInput.website_url) {
          handleRunAudit(data.lead.id);
        } else {
          fetchDashboardData();
        }
      }
    } catch (err: any) {
      addToast('error', 'Error adding lead', err.message);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const res = await fetch(`/api/leads?id=${leadId}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        addToast('info', 'Lead Deleted', 'Removed lead from pipeline.');
        fetchDashboardData();
      }
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
      if (data.success) {
        setLeads(data.leads);
        if (data.stats) setStats(data.stats);
        addToast('success', 'Demo Leads Reloaded', 'Loaded 6 sample leads with rich audit metrics.');
      }
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
