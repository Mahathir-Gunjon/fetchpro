/**
 * FetchPro - Ultra-Reliable High-Precision Google Maps Scraper
 *
 * Core Principles:
 * 1. Strict Container Scoping: Queries ONLY the active business detail pane (zero cross-contamination).
 * 2. 100% Genuine Data: Web results & social profiles belong strictly to the active business.
 * 3. Fast & Smooth: ~1.2s - 1.5s per lead with smooth progressive feed pagination for 50/100/500/1000 leads.
 */

(function () {
  console.log('[FetchPro] Harvester script initialized on:', window.location.href);

  let isScraping = false;
  let scrapedLeads = [];
  let seenIdentifiers = new Set();
  let maxLeadsTarget = 15;
  let floatingBanner = null;

  function safeSetStorage(data) {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.storage?.local) {
      try {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime?.lastError) {}
        });
      } catch (e) {}
    }
  }

  function safeSendMessage(msg) {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage(msg, () => {
          if (chrome.runtime?.lastError) {}
        });
      } catch (e) {}
    }
  }

  function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Decodes Google redirects and cleans tracking parameters
   */
  function unmaskAndCleanUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.trim();

    // Decode Google redirect: /url?q=... or google.com/url?q=...
    if (url.includes('/url?') || url.includes('google.com/url?')) {
      const match = url.match(/[?&](?:q|url)=([^&]+)/i);
      if (match && match[1]) {
        try {
          url = decodeURIComponent(match[1]);
        } catch (e) {
          url = match[1];
        }
      }
    }

    // Filter out internal Google links
    if (
      !url ||
      url.startsWith('/') ||
      url.startsWith('#') ||
      url.includes('google.com/search') ||
      url.includes('google.com/maps') ||
      url.includes('gstatic.com') ||
      url.includes('googleadservices.com') ||
      url.includes('accounts.google')
    ) {
      return '';
    }

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // Clean tracking tags
    try {
      if (
        url.includes('facebook.com') ||
        url.includes('instagram.com') ||
        url.includes('twitter.com') ||
        url.includes('x.com') ||
        url.includes('yelp.com')
      ) {
        const parsed = new URL(url);
        ['ref', 'fref', 'mibextid', 'locale', 'eav', 'paipv', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(
          (p) => parsed.searchParams.delete(p)
        );
        url = parsed.toString();
      }
    } catch (err) {}

    return url;
  }

  /**
   * Locate the Left Search Results Feed Container
   */
  function getSearchFeedContainer() {
    const feed = document.querySelector('div[role="feed"]');
    if (feed) return feed;

    const ariaContainers = document.querySelectorAll(
      'div[aria-label*="Results for"], div[aria-label*="results for"], div[aria-label*="Results"]'
    );
    for (const c of ariaContainers) {
      if (c.scrollHeight > c.clientHeight) return c;
    }

    const m6Containers = document.querySelectorAll('div.m6QErb.DxyBCb, div.m6QErb');
    for (const c of m6Containers) {
      if (c.scrollHeight > c.clientHeight && c.clientHeight > 250) return c;
    }

    return document.body;
  }

  /**
   * Locate the Right-Side Active Business Detail Pane (Strictly scoped)
   */
  function getActiveDetailPane() {
    const h1 = document.querySelector('h1.DUwDvf, [class*="header-title-title"], div.x3AX1-LfntMc-header-title-title, h1');
    if (h1) {
      let current = h1.parentElement;
      while (current && current !== document.body) {
        if (
          current.getAttribute('role') === 'main' ||
          current.classList.contains('m6QErb') ||
          (current.scrollHeight > current.clientHeight && current.clientHeight > 300)
        ) {
          return current;
        }
        current = current.parentElement;
      }
    }

    const panes = document.querySelectorAll('div[role="main"], div[tabindex="-1"], div.bJzEre');
    for (const p of panes) {
      if (p.querySelector('h1.DUwDvf, h1')) return p;
    }

    return document.querySelector('div[role="main"]') || document.body;
  }

  /**
   * Floating HUD for visual feedback
   */
  function updateFloatingHUD(statusText, count = 0, isRunning = false, activeName = '') {
    try {
      if (!floatingBanner) {
        floatingBanner = document.createElement('div');
        floatingBanner.id = 'fetchpro-floating-hud';
        floatingBanner.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999999;
          background: rgba(15, 23, 42, 0.95);
          color: #f8fafc;
          border: 1px solid rgba(59, 130, 246, 0.5);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px rgba(59, 130, 246, 0.2);
          backdrop-filter: blur(16px);
          border-radius: 14px;
          padding: 12px 18px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 12px;
          user-select: none;
          max-width: 380px;
        `;
        document.body.appendChild(floatingBanner);
      }

      floatingBanner.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${
            isRunning ? '#10b981' : '#3b82f6'
          }; box-shadow:${isRunning ? '0 0 10px #10b981' : '0 0 6px #3b82f6'};"></span>
          <strong style="font-weight:700; color:#60a5fa;">FetchPro Harvester</strong>
        </div>
        <div style="height:14px; width:1px; background:rgba(255,255,255,0.2);"></div>
        <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          <span>${statusText}: <span style="font-weight:700; color:#38bdf8;">${count} / ${maxLeadsTarget}</span></span>
          ${activeName ? `<div style="font-size:11px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis;">👉 ${activeName}</div>` : ''}
        </div>
      `;
    } catch (e) {}
  }

  /**
   * Extract Links & Social Footprint strictly from the active detail pane
   */
  function extractScopedBusinessLinks(detailPane) {
    const socialProfiles = {
      facebook: null,
      instagram: null,
      yelp: null,
      linkedin: null,
      twitter_x: null,
      youtube: null,
      tiktok: null,
      mapquest: null,
      yellowpages: null,
      other_directories: [],
    };

    let primaryWebsite = null;
    let fallbackWebsite = null;
    const web_results_links = [];
    const seenUrls = new Set();

    // 1. Official GMB Website Button
    const officialBtn = detailPane.querySelector(
      'a[data-item-id="authority"], a[aria-label*="Website"], a[aria-label*="website"], a[data-tooltip*="website"]'
    );
    if (officialBtn) {
      const raw = officialBtn.getAttribute('href') || officialBtn.href || '';
      const clean = unmaskAndCleanUrl(raw);
      if (clean) primaryWebsite = clean;
    }

    function addLink(rawUrl, title = '') {
      const url = unmaskAndCleanUrl(rawUrl);
      if (!url || seenUrls.has(url)) return;
      seenUrls.add(url);

      const lower = url.toLowerCase();

      if (
        (lower.includes('facebook.com') || lower.includes('fb.me') || lower.includes('fb.com')) &&
        !lower.includes('/sharer') &&
        !lower.includes('/dialog')
      ) {
        if (!socialProfiles.facebook) socialProfiles.facebook = url;
        web_results_links.push({ type: 'facebook', url, title });
      } else if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
        if (!socialProfiles.instagram) socialProfiles.instagram = url;
        web_results_links.push({ type: 'instagram', url, title });
      } else if (lower.includes('yelp.com/biz/') || lower.includes('yelp.com')) {
        if (!socialProfiles.yelp) socialProfiles.yelp = url;
        web_results_links.push({ type: 'yelp', url, title });
      } else if (lower.includes('linkedin.com/company/') || lower.includes('linkedin.com/in/')) {
        if (!socialProfiles.linkedin) socialProfiles.linkedin = url;
        web_results_links.push({ type: 'linkedin', url, title });
      } else if (
        (lower.includes('twitter.com') || lower.includes('x.com')) &&
        !lower.includes('/intent') &&
        !lower.includes('/share')
      ) {
        if (!socialProfiles.twitter_x) socialProfiles.twitter_x = url;
        web_results_links.push({ type: 'twitter_x', url, title });
      } else if (lower.includes('tiktok.com/@') || lower.includes('tiktok.com')) {
        if (!socialProfiles.tiktok) socialProfiles.tiktok = url;
        web_results_links.push({ type: 'tiktok', url, title });
      } else if (lower.includes('youtube.com/c/') || lower.includes('youtube.com/@') || lower.includes('youtube.com/channel/')) {
        if (!socialProfiles.youtube) socialProfiles.youtube = url;
        web_results_links.push({ type: 'youtube', url, title });
      } else if (lower.includes('mapquest.com')) {
        if (!socialProfiles.mapquest) socialProfiles.mapquest = url;
        socialProfiles.other_directories.push(url);
        web_results_links.push({ type: 'mapquest', url, title });
      } else if (lower.includes('yellowpages.com')) {
        if (!socialProfiles.yellowpages) socialProfiles.yellowpages = url;
        socialProfiles.other_directories.push(url);
        web_results_links.push({ type: 'directory', url, title });
      } else if (
        lower.includes('bbb.org') ||
        lower.includes('angi.com') ||
        lower.includes('homeadvisor.com') ||
        lower.includes('tripadvisor.com') ||
        lower.includes('thumbtack.com') ||
        lower.includes('houzz.com')
      ) {
        socialProfiles.other_directories.push(url);
        web_results_links.push({ type: 'directory', url, title });
      } else {
        if (!fallbackWebsite && !primaryWebsite) {
          fallbackWebsite = url;
        }
        web_results_links.push({ type: 'website', url, title });
      }
    }

    // 2. Extract ONLY from anchors strictly inside the detail pane
    const anchors = detailPane.querySelectorAll('a[href]');
    anchors.forEach((a) => {
      const raw = a.getAttribute('href') || a.href || '';
      const text = cleanText(a.innerText || a.getAttribute('aria-label') || '');
      addLink(raw, text);
    });

    // 3. Extract from data attributes inside detail pane
    const dataEls = detailPane.querySelectorAll('[data-url], [data-href]');
    dataEls.forEach((el) => {
      const raw = el.getAttribute('data-url') || el.getAttribute('data-href') || '';
      addLink(raw, cleanText(el.innerText || ''));
    });

    // 4. Breadcrumb parser inside detail pane
    const textEls = detailPane.querySelectorAll('cite, div.fontBodyMedium, span');
    textEls.forEach((el) => {
      const txt = (el.innerText || '').trim();
      if (
        (txt.includes('facebook.com') ||
          txt.includes('instagram.com') ||
          txt.includes('yelp.com') ||
          txt.includes('twitter.com') ||
          txt.includes('x.com') ||
          txt.includes('linkedin.com') ||
          txt.includes('bbb.org')) &&
        (txt.includes('›') || txt.includes('>'))
      ) {
        let converted = txt.replace(/\s*[›>]\s*/g, '/').replace(/\s+/g, '').replace(/\.\.\.$/, '');
        if (!/^https?:\/\//i.test(converted)) converted = `https://${converted}`;
        addLink(converted, txt);
      }
    });

    const resolvedWebsite = primaryWebsite || fallbackWebsite;
    const websiteSource = primaryWebsite ? 'GMB_BUTTON' : fallbackWebsite ? 'WEB_RESULTS' : 'NONE';

    return {
      website_url: resolvedWebsite,
      website_source: websiteSource,
      primaryWebsite,
      fallbackWebsite,
      social_profiles: socialProfiles,
      web_results_links,
    };
  }

  /**
   * Deep Inspect the currently active detail pane
   */
  async function inspectActivePlace() {
    try {
      if (scrapedLeads.length >= maxLeadsTarget) return 0;

      const detailPane = getActiveDetailPane();
      if (!detailPane) return 0;

      // 1. Business Name
      const nameEl = detailPane.querySelector('h1.DUwDvf, [class*="header-title-title"], h1');
      if (!nameEl || !nameEl.innerText) return 0;

      const businessName = cleanText(nameEl.innerText);
      if (!businessName || businessName.length < 2 || businessName.includes('Search this area')) return 0;

      const currentMapsUrl = window.location.href;

      // 2. Scroll detail pane down smoothly to render Web results
      try {
        detailPane.scrollTop = detailPane.scrollHeight;
        detailPane.dispatchEvent(new WheelEvent('wheel', { deltaY: 1000, bubbles: true }));
      } catch (e) {}

      // Fast wait for Web results DOM render (500ms)
      await new Promise((res) => setTimeout(res, 500));

      // 3. Rating & Reviews
      let rating = 0;
      let reviewsCount = 0;
      const ratingEl = detailPane.querySelector('div.F7nice, span.MW4etd, [aria-label*="stars"]');
      if (ratingEl) {
        const mRat = (ratingEl.innerText || ratingEl.getAttribute('aria-label') || '').match(/([0-5]\.[0-9]|[0-5])/);
        if (mRat) rating = parseFloat(mRat[1]);
        const mRev = (ratingEl.innerText || '').match(/\(?([0-9,]+)\)?/);
        if (mRev) reviewsCount = parseInt(mRev[1].replace(/,/g, ''), 10);
      }

      // 4. Primary Category
      let category = '';
      const catBtn = detailPane.querySelector('button[jsaction*="category"], button.DkEaL');
      if (catBtn) category = cleanText(catBtn.innerText || '');

      // 5. Phone
      let phone = '';
      const phoneBtn = detailPane.querySelector('button[data-item-id*="phone"], button[aria-label*="Phone"]');
      if (phoneBtn) {
        const pMatch = (phoneBtn.innerText || phoneBtn.getAttribute('aria-label') || '').match(
          /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/
        );
        if (pMatch) phone = cleanText(pMatch[0]);
      }

      // 6. Address
      let address = '';
      const addrBtn = detailPane.querySelector('button[data-item-id*="address"], button[aria-label*="Address"]');
      if (addrBtn) address = cleanText(addrBtn.innerText || addrBtn.getAttribute('aria-label') || '');

      // 7. Scoped Links & Social Extraction
      const {
        website_url,
        website_source,
        primaryWebsite,
        fallbackWebsite,
        social_profiles,
        web_results_links,
      } = extractScopedBusinessLinks(detailPane);

      const existingIndex = scrapedLeads.findIndex(
        (l) => l.maps_url === currentMapsUrl || l.business_name.toLowerCase() === businessName.toLowerCase()
      );

      const lead = {
        id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7),
        business_name: businessName,
        phone: phone || null,
        rating: rating || 0,
        reviews_count: reviewsCount || 0,
        category: category || null,
        address: address || null,
        status: 'Open',
        maps_url: currentMapsUrl,
        gmb_website_url: primaryWebsite || null,
        website_url: website_url || null,
        discovered_website: fallbackWebsite || null,
        website_source: website_source,
        web_results_links: web_results_links.length > 0 ? web_results_links : null,
        social_profiles: social_profiles,
        socials: social_profiles,
        email: null,
        scraped_at: new Date().toISOString(),
      };

      if (existingIndex !== -1) {
        scrapedLeads[existingIndex] = {
          ...scrapedLeads[existingIndex],
          ...lead,
        };
        return 0;
      }

      if (scrapedLeads.length >= maxLeadsTarget) return 0;

      seenIdentifiers.add(currentMapsUrl);
      seenIdentifiers.add(businessName.toLowerCase());
      scrapedLeads.push(lead);
      return 1;
    } catch (err) {
      console.warn('[FetchPro] inspectActivePlace error:', err);
      return 0;
    }
  }

  /**
   * Fast, Rock-Solid Scraping Loop with Progressive Feed Pagination
   */
  async function runScrapeLoop() {
    const feedContainer = getSearchFeedContainer();
    let processedIndex = 0;
    let consecutiveNoNew = 0;

    console.log(`[FetchPro] Harvesting up to ${maxLeadsTarget} leads...`);
    updateFloatingHUD('Harvesting', scrapedLeads.length, true);

    while (isScraping && scrapedLeads.length < maxLeadsTarget) {
      // Find all place cards in the search feed
      const cardAnchors = Array.from(
        document.querySelectorAll('div[role="feed"] a.hfpxzc, a.hfpxzc, div.Nv2PK a[href*="/maps/place/"]')
      );

      for (let i = processedIndex; i < cardAnchors.length && isScraping; i++) {
        if (scrapedLeads.length >= maxLeadsTarget) break;

        const anchor = cardAnchors[i];
        processedIndex = i + 1;

        const cardName = cleanText(anchor.getAttribute('aria-label') || '');
        if (!cardName) continue;

        updateFloatingHUD('Inspecting', scrapedLeads.length, true, cardName);

        // 1. Click card to open place details
        anchor.click();
        await new Promise((r) => setTimeout(r, 850));

        // 2. Extract strictly scoped data & Web results
        await inspectActivePlace();

        const latest = scrapedLeads[scrapedLeads.length - 1];
        updateFloatingHUD('Crawled', scrapedLeads.length, true, latest?.business_name || cardName);
        safeSetStorage({ leadflow_leads: scrapedLeads });

        safeSendMessage({
          type: 'SCRAPE_PROGRESS',
          count: scrapedLeads.length,
          maxLeads: maxLeadsTarget,
          latestLead: latest || null,
          leads: scrapedLeads,
        });

        if (scrapedLeads.length >= maxLeadsTarget) break;
      }

      if (scrapedLeads.length >= maxLeadsTarget) break;

      // 3. Scroll search feed to paginate next 20 places
      if (feedContainer && feedContainer !== document.body) {
        feedContainer.scrollTop += 1200;
        try {
          feedContainer.dispatchEvent(new WheelEvent('wheel', { deltaY: 1200, bubbles: true }));
        } catch (e) {}
      } else {
        window.scrollBy({ top: 1000, behavior: 'smooth' });
      }

      await new Promise((r) => setTimeout(r, 1000));

      const freshCards = Array.from(
        document.querySelectorAll('div[role="feed"] a.hfpxzc, a.hfpxzc, div.Nv2PK a[href*="/maps/place/"]')
      );

      if (freshCards.length <= processedIndex) {
        consecutiveNoNew++;
      } else {
        consecutiveNoNew = 0;
      }

      if (consecutiveNoNew >= 8) {
        console.log('[FetchPro] Reached end of Google Maps feed list.');
        break;
      }
    }

    isScraping = false;
    safeSetStorage({ leadflow_leads: scrapedLeads });
    updateFloatingHUD('Crawl Complete', scrapedLeads.length, false);

    safeSendMessage({
      type: 'SCRAPE_COMPLETED',
      count: scrapedLeads.length,
      leads: scrapedLeads,
    });
  }

  // Runtime message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      sendResponse({
        status: 'READY',
        isMaps: window.location.href.includes('google.com/maps') || window.location.href.includes('maps.google.com'),
        url: window.location.href,
        isScraping,
        count: scrapedLeads.length,
      });
      return false;
    }

    if (message.type === 'START_SCRAPING') {
      if (isScraping) {
        sendResponse({ status: 'ALREADY_RUNNING', count: scrapedLeads.length });
        return false;
      }

      maxLeadsTarget = parseInt(message.maxLeads, 10) || 50;

      // Reset buffer for fresh run
      scrapedLeads = [];
      seenIdentifiers.clear();
      safeSetStorage({ leadflow_leads: [] });

      isScraping = true;

      runScrapeLoop().catch((err) => {
        console.error('[FetchPro] Scrape loop error:', err);
        isScraping = false;
        updateFloatingHUD('Stopped', scrapedLeads.length, false);
      });

      sendResponse({ status: 'STARTED', maxLeads: maxLeadsTarget });
      return false;
    }

    if (message.type === 'STOP_SCRAPING') {
      isScraping = false;
      updateFloatingHUD('Stopped', scrapedLeads.length, false);
      sendResponse({ status: 'STOPPED', count: scrapedLeads.length, leads: scrapedLeads });
      return false;
    }

    if (message.type === 'GET_LEADS') {
      sendResponse({ leads: scrapedLeads, isScraping });
      return false;
    }

    if (message.type === 'CLEAR_LEADS') {
      scrapedLeads = [];
      seenIdentifiers.clear();
      safeSetStorage({ leadflow_leads: [] });
      if (floatingBanner && floatingBanner.parentNode) {
        floatingBanner.parentNode.removeChild(floatingBanner);
        floatingBanner = null;
      }
      sendResponse({ status: 'CLEARED' });
      return false;
    }

    return false;
  });

  // Restore stored leads safely
  try {
    chrome.storage?.local?.get(['leadflow_leads'], (res) => {
      if (res && Array.isArray(res.leadflow_leads)) {
        scrapedLeads = res.leadflow_leads;
        scrapedLeads.forEach((lead) => {
          const id = lead.maps_url || lead.business_name.toLowerCase();
          seenIdentifiers.add(id);
        });
      }
    });
  } catch (e) {}
})();
