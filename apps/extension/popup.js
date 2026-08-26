/**
 * FetchPro - Popup Script
 * Manifest V3 Resilient Engine & Vercel Auto-Detection
 */

document.addEventListener('DOMContentLoaded', async () => {
  const pageStatusPill = document.getElementById('page-status');
  const pageStatusText = document.getElementById('page-status-text');
  const mapNotice = document.getElementById('map-notice');
  const btnOpenMaps = document.getElementById('btn-open-maps');

  const statTotal = document.getElementById('stat-total');
  const statWebsites = document.getElementById('stat-websites');
  const statPhones = document.getElementById('stat-phones');

  const liveInspectBanner = document.getElementById('live-inspect-banner');
  const liveInspectName = document.getElementById('live-inspect-name');
  const liveInspectMeta = document.getElementById('live-inspect-meta');
  const liveInspectCount = document.getElementById('live-inspect-count');

  const maxLeadsSelect = document.getElementById('max-leads-select');
  const btnScrapeToggle = document.getElementById('btn-scrape-toggle');
  const btnScrapeLabel = document.getElementById('btn-scrape-label');
  const btnClear = document.getElementById('btn-clear');

  const btnSync = document.getElementById('btn-sync');
  const syncLabel = document.getElementById('sync-label');
  const syncFeedback = document.getElementById('sync-feedback');

  const leadsList = document.getElementById('leads-list');
  const btnExportCsv = document.getElementById('btn-export-csv');

  const apiUrlInput = document.getElementById('api-url');
  const apiKeyInput = document.getElementById('api-key');
  const btnSaveConfig = document.getElementById('btn-save-config');
  const currentTargetLabel = document.getElementById('current-target-label');
  const btnToggleConfigQuick = document.getElementById('btn-toggle-config-quick');
  const configAccordion = document.getElementById('config-accordion');

  let currentTab = null;
  let isGoogleMaps = false;
  let isScraping = false;
  let extractedLeads = [];

  // 1. Auto-detect if any open tab is running a FetchPro dashboard on Vercel or localhost
  try {
    const allTabs = await chrome.tabs.query({});
    for (const t of allTabs) {
      if (t.url && (t.url.includes('.vercel.app/dashboard') || t.url.includes('.vercel.app'))) {
        const origin = new URL(t.url).origin;
        const saved = await chrome.storage.local.get(['leadflow_api_url']);
        if (!saved.leadflow_api_url || saved.leadflow_api_url.includes('localhost')) {
          await chrome.storage.local.set({ leadflow_api_url: origin });
        }
        break;
      }
    }
  } catch (e) {}

  // 2. Load saved settings
  const settings = await chrome.storage.local.get([
    'leadflow_api_url',
    'leadflow_api_key',
    'leadflow_max_leads',
    'leadflow_leads',
  ]);

  const activeUrl = (settings.leadflow_api_url || 'http://localhost:3000').trim().replace(/\/$/, '');
  apiUrlInput.value = activeUrl;
  currentTargetLabel.textContent = activeUrl.replace(/^https?:\/\//, '');

  if (settings.leadflow_api_key) {
    apiKeyInput.value = settings.leadflow_api_key;
  }
  if (settings.leadflow_max_leads) {
    maxLeadsSelect.value = settings.leadflow_max_leads;
  }
  if (Array.isArray(settings.leadflow_leads)) {
    extractedLeads = settings.leadflow_leads;
    renderLeads(extractedLeads);
  }

  // Quick toggle config
  btnToggleConfigQuick.addEventListener('click', () => {
    configAccordion.open = !configAccordion.open;
    if (configAccordion.open) {
      apiUrlInput.focus();
    }
  });

  // Identify active tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      isGoogleMaps =
        currentTab.url.includes('google.com/maps') ||
        currentTab.url.includes('maps.google.com') ||
        currentTab.url.includes('google.com/search');
    }
  } catch (err) {
    console.error('Failed to query active tab:', err);
  }

  // Ensure content script is running on Google Maps
  if (isGoogleMaps && currentTab && currentTab.id) {
    pageStatusPill.className = 'status-pill status-pill-active';
    pageStatusText.textContent = 'Google Maps Active';
    mapNotice.classList.add('hidden');

    try {
      const response = await chrome.tabs.sendMessage(currentTab.id, { type: 'PING' });
      if (response) {
        if (response.isScraping) setScrapingState(true);
        const extractRes = await chrome.tabs.sendMessage(currentTab.id, { type: 'EXTRACT_NOW' });
        if (extractRes && extractRes.leads && extractRes.leads.length > 0) {
          renderLeads(extractRes.leads);
        }
      }
    } catch (err) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content.js'],
        });
        setTimeout(async () => {
          try {
            const extractRes = await chrome.tabs.sendMessage(currentTab.id, { type: 'EXTRACT_NOW' });
            if (extractRes && extractRes.leads) {
              renderLeads(extractRes.leads);
            }
          } catch (e) {}
        }, 500);
      } catch (injErr) {}
    }
  } else {
    pageStatusPill.className = 'status-pill status-pill-inactive';
    pageStatusText.textContent = 'Not on Google Maps';
    mapNotice.classList.remove('hidden');
  }

  function renderLeads(leads) {
    extractedLeads = leads || [];
    statTotal.textContent = extractedLeads.length;

    const withWeb = extractedLeads.filter((l) => l.website_url || l.gmb_website_url).length;
    const withPhone = extractedLeads.filter((l) => l.phone).length;

    statWebsites.textContent = withWeb;
    statPhones.textContent = withPhone;

    btnSync.disabled = extractedLeads.length === 0;

    if (extractedLeads.length === 0) {
      leadsList.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p class="text-xs text-slate-400">Search Google Maps and click Start Deep Harvester.</p>
        </div>
      `;
      return;
    }

    leadsList.innerHTML = '';
    extractedLeads
      .slice(-30)
      .reverse()
      .forEach((lead) => {
        const item = document.createElement('div');
        item.className = 'lead-item';
        item.innerHTML = `
        <div style="flex:1; overflow:hidden;">
          <div class="lead-name" title="${escapeHtml(lead.business_name)}">${escapeHtml(lead.business_name)}</div>
          <div class="lead-meta">
            ${
              lead.rating
                ? `<span class="lead-badge lead-badge-rating">★ ${lead.rating} (${lead.reviews_count || 0})</span>`
                : ''
            }
            ${
              lead.website_url
                ? `<span class="lead-badge lead-badge-web">🌐 Website</span>`
                : `<span class="lead-badge lead-badge-noweb">🔥 No Web</span>`
            }
            ${
              lead.social_profiles?.facebook || lead.socials?.facebook
                ? `<span class="lead-badge" style="background:rgba(24,119,242,0.2); color:#60a5fa;">FB</span>`
                : ''
            }
            ${
              lead.phone
                ? `<span class="lead-badge" style="background:rgba(16,185,129,0.15); color:#34d399;">📞 ${escapeHtml(
                    lead.phone
                  )}</span>`
                : ''
            }
          </div>
        </div>
      `;
        leadsList.appendChild(item);
      });
  }

  function setScrapingState(scraping) {
    isScraping = scraping;
    if (isScraping) {
      btnScrapeToggle.className = 'btn btn-danger flex-1';
      btnScrapeLabel.textContent = 'Stop & Sync Harvester';
      if (liveInspectBanner) liveInspectBanner.classList.remove('hidden');
    } else {
      btnScrapeToggle.className = 'btn btn-primary flex-1';
      btnScrapeLabel.textContent = 'Start Deep Harvester';
      if (liveInspectBanner) liveInspectBanner.classList.add('hidden');
    }
  }

  function showFeedback(msg, isSuccess = true) {
    syncFeedback.textContent = msg;
    syncFeedback.className = `feedback-msg ${isSuccess ? 'feedback-success' : 'feedback-error'}`;
    syncFeedback.classList.remove('hidden');
    setTimeout(() => {
      syncFeedback.classList.add('hidden');
    }, 7000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(
      /[&<>"']/g,
      (m) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[m])
    );
  }

  btnOpenMaps.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.google.com/maps/search/plumbers' });
  });

  // Toggle Scraping
  btnScrapeToggle.addEventListener('click', async () => {
    if (!isGoogleMaps) {
      chrome.tabs.create({ url: 'https://www.google.com/maps/search/roofing+contractors' });
      return;
    }

    if (!currentTab || !currentTab.id) return;

    if (!isScraping) {
      const maxLeads = parseInt(maxLeadsSelect.value, 10) || 100;
      setScrapingState(true);
      try {
        await chrome.tabs.sendMessage(currentTab.id, {
          type: 'START_SCRAPING',
          maxLeads,
        });
      } catch (err) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js'],
          });
          setTimeout(() => {
            chrome.tabs.sendMessage(currentTab.id, { type: 'START_SCRAPING', maxLeads }).catch(() => {});
          }, 300);
        } catch (e) {
          setScrapingState(false);
          showFeedback('Please refresh the Google Maps tab and try again.', false);
        }
      }
    } else {
      setScrapingState(false);
      try {
        const res = await chrome.tabs.sendMessage(currentTab.id, { type: 'STOP_SCRAPING' });
        if (res && res.leads) {
          renderLeads(res.leads);
        }
      } catch (err) {}
      // Automatically trigger sync when user clicks Stop & Sync
      if (extractedLeads.length > 0) {
        btnSync.click();
      }
    }
  });

  // Clear leads
  btnClear.addEventListener('click', async () => {
    if (confirm('Clear all scraped leads from extension buffer?')) {
      extractedLeads = [];
      await chrome.storage.local.set({ leadflow_leads: [] });
      if (isGoogleMaps && currentTab && currentTab.id) {
        chrome.tabs.sendMessage(currentTab.id, { type: 'CLEAR_LEADS' }).catch(() => {});
      }
      renderLeads([]);
      showFeedback('Leads buffer cleared.', true);
    }
  });

  // Sync to Dashboard API
  btnSync.addEventListener('click', async () => {
    if (extractedLeads.length === 0) {
      showFeedback('No leads to sync yet. Search Google Maps and click Start Deep Harvester.', false);
      return;
    }

    const rawUrl = (apiUrlInput.value || 'http://localhost:3000').trim().replace(/\/$/, '');
    const apiKey = apiKeyInput.value.trim();
    let endpoint = `${rawUrl}/api/leads/sync`;

    btnSync.disabled = true;
    syncLabel.textContent = 'Syncing to Dashboard...';

    try {
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({
            leads: extractedLeads,
            source: 'chrome-extension',
          }),
        });
      } catch (fetchErr) {
        if (rawUrl.includes('localhost')) {
          const fallbackUrl = rawUrl.replace('localhost', '127.0.0.1');
          endpoint = `${fallbackUrl}/api/leads/sync`;
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify({
              leads: extractedLeads,
              source: 'chrome-extension',
            }),
          });
        } else {
          throw fetchErr;
        }
      }

      const data = await response.json();

      if (response.ok && data.success) {
        showFeedback(
          `Successfully synced ${data.syncedCount || extractedLeads.length} leads to FetchPro Dashboard! 🎉`,
          true
        );
      } else {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }
    } catch (err) {
      console.error('Sync failed:', err);
      showFeedback(`Sync failed (${err.message}). Verify Dashboard URL (${rawUrl}) in Settings.`, false);
    } finally {
      btnSync.disabled = false;
      syncLabel.textContent = 'Sync Leads to Dashboard';
    }
  });

  // Save Settings
  btnSaveConfig.addEventListener('click', async () => {
    let rawUrl = (apiUrlInput.value || 'http://localhost:3000').trim().replace(/\/$/, '');
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = `https://${rawUrl}`;
      apiUrlInput.value = rawUrl;
    }
    const apiKey = apiKeyInput.value.trim();
    const maxLeads = maxLeadsSelect.value;

    await chrome.storage.local.set({
      leadflow_api_url: rawUrl,
      leadflow_api_key: apiKey,
      leadflow_max_leads: maxLeads,
    });

    currentTargetLabel.textContent = rawUrl.replace(/^https?:\/\//, '');
    configAccordion.open = false;
    showFeedback(`Target URL set to: ${rawUrl}`, true);
  });

  // Direct CSV Export
  btnExportCsv.addEventListener('click', () => {
    if (extractedLeads.length === 0) {
      alert('No leads to export.');
      return;
    }

    const headers = [
      'Business Name',
      'Category',
      'Rating',
      'Reviews Count',
      'Phone',
      'Address',
      'GMB Website URL',
      'Discovered Website',
      'Facebook URL',
      'Instagram URL',
      'Yelp URL',
      'Google Maps URL',
    ];
    const rows = extractedLeads.map((l) => {
      const soc = l.social_profiles || l.socials || {};
      return [
        `"${(l.business_name || '').replace(/"/g, '""')}"`,
        `"${(l.category || '').replace(/"/g, '""')}"`,
        l.rating || '',
        l.reviews_count || 0,
        `"${(l.phone || '').replace(/"/g, '""')}"`,
        `"${(l.address || '').replace(/"/g, '""')}"`,
        `"${(l.gmb_website_url || '').replace(/"/g, '""')}"`,
        `"${(l.discovered_website || l.website_url || '').replace(/"/g, '""')}"`,
        `"${(soc.facebook || '').replace(/"/g, '""')}"`,
        `"${(soc.instagram || '').replace(/"/g, '""')}"`,
        `"${(soc.yelp || '').replace(/"/g, '""')}"`,
        `"${(l.maps_url || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fetchpro_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Real-time progress listener
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SCRAPE_PROGRESS') {
      statTotal.textContent = message.count;
      if (liveInspectBanner) {
        liveInspectBanner.classList.remove('hidden');
        if (liveInspectCount) liveInspectCount.textContent = `${message.count} / ${message.maxLeads || 100}`;
        if (message.latestLead) {
          if (liveInspectName) liveInspectName.textContent = message.latestLead.business_name || 'Inspecting card...';
          if (liveInspectMeta) {
            const web = message.latestLead.website_url ? '🌐 ' + message.latestLead.website_url : '🔥 No website';
            const phone = message.latestLead.phone ? ' • 📞 ' + message.latestLead.phone : '';
            liveInspectMeta.textContent = `${web}${phone}`;
          }
        }
      }

      if (message.leads) {
        renderLeads(message.leads);
      } else {
        chrome.storage.local.get(['leadflow_leads'], (res) => {
          if (res && res.leadflow_leads) {
            renderLeads(res.leadflow_leads);
          }
        });
      }
    } else if (message.type === 'SCRAPE_COMPLETED') {
      setScrapingState(false);
      renderLeads(message.leads);
      showFeedback(`Extracted ${message.count} leads! Ready to sync.`, true);
    }
  });
});
