'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Lead, DashboardStats, ExtractedLeadInput } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { Sidebar, DashboardViewTab } from '@/components/Sidebar';
import { StatsOverview } from '@/components/StatsOverview';
import { LeadsTable } from '@/components/LeadsTable';
import { AuditDrawer } from '@/components/AuditDrawer';
import { PitchEditorModal } from '@/components/PitchEditorModal';
import { WhyPickedModal } from '@/components/WhyPickedModal';
import { AddLeadModal } from '@/components/AddLeadModal';
import { ExtensionConfigModal } from '@/components/ExtensionConfigModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { INITIAL_MOCK_LEADS, SAMPLE_DEMO_LEADS } from '@/lib/mock-data';
import { AUTH_STORAGE_KEY } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_MOCK_LEADS);
  const [activeTab, setActiveTab] = useState<DashboardViewTab>('all');
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    auditedLeads: 0,
    qualifiedLeadsCount: 0,
    hotLeadsCount: 0,
    trashLeadsCount: 0,
    averageHealthScore: 0,
    emailsSent: 0,
    leadsWithWebsites: 0,
    leadsWithoutWebsites: 0,
    leadsWithPhones: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [auditingId, setAuditingId] = useState<string | null>(null);
  const [auditingIds, setAuditingIds] = useState<Set<string>>(new Set());
  const [isBatchAuditing, setIsBatchAuditing] = useState(false);

  // Modals / Drawer state
  const [selectedAuditLead, setSelectedAuditLead] = useState<Lead | null>(null);
  const [selectedPitchLead, setSelectedPitchLead] = useState<Lead | null>(null);
  const [selectedWhyPickedLead, setSelectedWhyPickedLead] = useState<Lead | null>(null);
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

  // Auth Guard
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!saved) {
        router.replace('/');
        return;
      }
      const session = JSON.parse(saved);
      if (!session.authenticated) {
        router.replace('/');
        return;
      }
      setIsAuthenticated(true);
    } catch (e) {
      router.replace('/');
    }
  }, [router]);

  // Recalculate stats helper
  const calculateStats = (leadList: Lead[]): DashboardStats => {
    const totalLeads = leadList.length;
    const auditedLeads = leadList.filter(
      (l) =>
        l.status === 'audited' ||
        l.status === 'emailed' ||
        l.status === 'hot_lead' ||
        l.status === 'trash' ||
        !!l.audit_data
    ).length;
    const qualifiedLeadsCount = leadList.filter(
      (l) =>
        l.is_qualified === true ||
        l.status === 'hot_lead' ||
        (l.opportunity_score && l.opportunity_score >= 40) ||
        !l.website_url
    ).length;
    const hotLeadsCount = qualifiedLeadsCount;
    const trashLeadsCount = leadList.filter(
      (l) =>
        l.status === 'trash' ||
        (l.opportunity_score &&
          l.opportunity_score <= 15 &&
          l.audit_data?.healthScore &&
          l.audit_data.healthScore >= 85)
    ).length;
    const emailsSent = leadList.filter((l) => l.status === 'emailed').length;
    const leadsWithWebsites = leadList.filter((l) => !!(l.website_url || l.gmb_website_url)).length;
    const leadsWithoutWebsites = leadList.filter((l) => !l.website_url && !l.gmb_website_url).length;
    const leadsWithPhones = leadList.filter((l) => !!l.phone).length;

    const scored = leadList.filter((l) => l.audit_data?.healthScore !== undefined);
    const averageHealthScore =
      scored.length > 0
        ? Math.round(
            scored.reduce((acc, l) => acc + (l.audit_data?.healthScore || 0), 0) / scored.length
          )
        : 0;

    return {
      totalLeads,
      auditedLeads,
      qualifiedLeadsCount,
      hotLeadsCount,
      trashLeadsCount,
      averageHealthScore,
      emailsSent,
      leadsWithWebsites,
      leadsWithoutWebsites,
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

  // Merge leads deduplicated
  const mergeLeads = (existing: Lead[], incoming: Lead[]): Lead[] => {
    const map = new Map<string, Lead>();
    existing.forEach((l) => {
      const key = l.id || l.maps_url || l.business_name.toLowerCase();
      map.set(key, l);
    });
    incoming.forEach((l) => {
      const key = l.id || l.maps_url || l.business_name.toLowerCase();
      map.set(key, l);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  // Fetch leads and stats from API
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
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
      console.warn('API fetch warning, using local storage state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial mount & periodic poller
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('leadflow_persisted_leads');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setLeads(parsed);
            setStats(calculateStats(parsed));
          }
        }
      } catch (e) {}
    }

    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Run Individual Website Audit
  const handleRunAudit = async (leadId: string) => {
    const targetLead = leads.find((l) => l.id === leadId);
    const targetUrl =
      targetLead?.gmb_website_url || targetLead?.website_url || targetLead?.discovered_website;

    if (!targetLead || !targetUrl) {
      addToast('error', 'Cannot audit lead', 'Lead has no website URL to audit.');
      return;
    }

    setAuditingId(leadId);
    try {
      const res = await fetch('/api/leads/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, url: targetUrl }),
      });

      const data = await res.json();
      if (data.success && data.lead) {
        setLeads((prev) => {
          const updated = prev.map((l) => (l.id === leadId ? data.lead : l));
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('leadflow_persisted_leads', JSON.stringify(updated));
            } catch (e) {}
          }
          setStats(calculateStats(updated));
          return updated;
        });

        if (selectedAuditLead?.id === leadId) {
          setSelectedAuditLead(data.lead);
        }
        if (selectedWhyPickedLead?.id === leadId) {
          setSelectedWhyPickedLead(data.lead);
        }
        addToast(
          'success',
          'Audit Completed',
          `Health Score: ${data.auditData.healthScore}/100 for ${targetLead.business_name}`
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

  // Run Batch Audit on Multiple Selected Leads
  const handleRunBatchAudit = async (leadIds: string[]) => {
    if (!leadIds || leadIds.length === 0) return;

    setIsBatchAuditing(true);
    const idSet = new Set(leadIds);
    setAuditingIds(idSet);

    addToast('info', 'Batch Audit Started', `Auditing ${leadIds.length} lead(s)...`);

    try {
      const res = await fetch('/api/leads/batch-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        const returnedMap = new Map<string, Lead>();
        data.leads.forEach((l: Lead) => returnedMap.set(l.id, l));

        setLeads((prev) => {
          const updated = prev.map((l) => (returnedMap.has(l.id) ? returnedMap.get(l.id)! : l));
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('leadflow_persisted_leads', JSON.stringify(updated));
            } catch (e) {}
          }
          setStats(calculateStats(updated));
          return updated;
        });

        addToast(
          'success',
          'Batch Audit Finished',
          `Successfully audited ${data.auditedCount} websites!`
        );
      } else {
        throw new Error(data.error || 'Batch audit failed');
      }
    } catch (err: any) {
      addToast('error', 'Batch Audit Notice', err.message || 'Failed to complete batch audit.');
    } finally {
      setIsBatchAuditing(false);
      setAuditingIds(new Set());
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
      const res = await fetch('/api/outreach/send', {
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
      const newLead: Lead = data.lead || {
        id: `lead_${Date.now()}`,
        business_name: leadInput.business_name,
        phone: leadInput.phone || null,
        rating: leadInput.rating || 0,
        reviews_count: leadInput.reviews_count || 0,
        maps_url: leadInput.maps_url || null,
        website_url: leadInput.website_url || null,
        email: leadInput.email || null,
        socials: leadInput.socials || null,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
      };

      const updated = [newLead, ...leads];
      persistLeads(updated);
      addToast('success', 'Lead Added', `Added ${leadInput.business_name} to pipeline.`);
    } catch (err: any) {
      addToast('error', 'Error adding lead', err.message);
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      await fetch(`/api/leads?id=${leadId}`, { method: 'DELETE' });
    } catch (err) {}

    const updated = leads.filter((l) => l.id !== leadId);
    persistLeads(updated);
    addToast('info', 'Lead Deleted', 'Removed lead from pipeline.');
  };

  // Delete Multiple Leads
  const handleDeleteMultipleLeads = async (leadIds: string[]) => {
    for (const id of leadIds) {
      try {
        await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
      } catch (e) {}
    }
    const idSet = new Set(leadIds);
    const updated = leads.filter((l) => !idSet.has(l.id));
    persistLeads(updated);
    addToast('info', 'Leads Deleted', `Removed ${leadIds.length} lead(s) from pipeline.`);
  };

  // Clear All Leads
  const handleClearAllLeads = () => {
    if (confirm('Are you sure you want to delete ALL leads from your pipeline?')) {
      persistLeads([]);
      addToast('info', 'Pipeline Cleared', 'All leads have been removed.');
    }
  };

  // Reset / Reload Demo Leads
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/leads/demo-seed', { method: 'POST' });
      const data = await res.json();
      const freshLeads = data.leads || SAMPLE_DEMO_LEADS;
      persistLeads(freshLeads);
      addToast('success', 'Sample Leads Loaded', 'Loaded sample leads with rich audit metrics.');
    } catch (err) {
      persistLeads(SAMPLE_DEMO_LEADS);
    } finally {
      setIsResetting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.location.href = '/api/leads/export';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
        Verifying FetchPro Admin Session...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white w-full transition-colors duration-200">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Full-width Navbar */}
      <Navbar
        onAddLead={() => setIsAddLeadOpen(true)}
        onOpenExtensionConfig={() => setIsExtensionConfigOpen(true)}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Main Workspace (100% Full Width with Left Sidebar) */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar Navigation */}
        <Sidebar
          currentTab={activeTab}
          onTabChange={setActiveTab}
          stats={stats}
          onAddLead={() => setIsAddLeadOpen(true)}
          onOpenExtensionConfig={() => setIsExtensionConfigOpen(true)}
          onResetDemo={handleResetDemo}
          onClearAllLeads={handleClearAllLeads}
          onExportCsv={handleExportCsv}
          isResetting={isResetting}
        />

        {/* Center Main Dashboard Content (Full width) */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-hidden w-full">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <span>FetchPro Lead Pipeline & Website Audits</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Filter prospects, inspect social profiles (FB, IG, Yelp, TikTok), audit websites on demand, and dispatch high-converting cold pitches.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExtensionConfigOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition-all"
              >
                <span>Connect Chrome Scraper</span>
              </button>
              <button
                onClick={() => setIsAddLeadOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/25 transition-all"
              >
                <span>+ Add Lead</span>
              </button>
            </div>
          </div>

          {/* Top Metrics Bar */}
          <StatsOverview
            stats={stats}
            currentTab={activeTab}
            onSelectTab={setActiveTab}
          />

          {/* Modern Leads Table */}
          <LeadsTable
            leads={leads}
            onOpenAudit={(lead) => setSelectedAuditLead(lead)}
            onOpenPitchEditor={(lead) => setSelectedPitchLead(lead)}
            onOpenWhyPicked={(lead) => setSelectedWhyPickedLead(lead)}
            onRunAudit={handleRunAudit}
            onRunBatchAudit={handleRunBatchAudit}
            onDeleteLead={handleDeleteLead}
            onDeleteMultipleLeads={handleDeleteMultipleLeads}
            onExportCsv={handleExportCsv}
            onAddLead={() => setIsAddLeadOpen(true)}
            auditingId={auditingId}
            auditingIds={auditingIds}
            isBatchAuditing={isBatchAuditing}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </main>
      </div>

      {/* Slide-Over Drawer: Deep Audit Breakdown & Executive Summary */}
      <AuditDrawer
        lead={selectedAuditLead}
        isOpen={!!selectedAuditLead}
        onClose={() => setSelectedAuditLead(null)}
        onAuditAgain={handleRunAudit}
        onSendEmail={handleSendEmail}
        onRegeneratePitch={handleRegeneratePitch}
        isAuditing={auditingId === selectedAuditLead?.id}
      />

      {/* Why Picked Modal */}
      <WhyPickedModal
        lead={selectedWhyPickedLead}
        isOpen={!!selectedWhyPickedLead}
        onClose={() => setSelectedWhyPickedLead(null)}
        onOpenPitchEditor={(lead) => setSelectedPitchLead(lead)}
        onRunAudit={handleRunAudit}
        isAuditing={auditingId === selectedWhyPickedLead?.id}
      />

      {/* 1-Click Outreach Email Composer Modal */}
      <PitchEditorModal
        lead={selectedPitchLead}
        isOpen={!!selectedPitchLead}
        onClose={() => setSelectedPitchLead(null)}
        onSendEmail={handleSendEmail}
        onRegeneratePitch={handleRegeneratePitch}
      />

      {/* Manual Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onAddLead={handleAddLead}
      />

      {/* Chrome Extension Connect Modal */}
      <ExtensionConfigModal
        isOpen={isExtensionConfigOpen}
        onClose={() => setIsExtensionConfigOpen(false)}
      />
    </div>
  );
}
