/**
 * FetchPro - High-Precision Google Maps 2-Tier Lead & Web Results Scraper
 *
 * Implements:
 * 1. Strict Target Limit enforcement (e.g. 15 leads means exactly 15 leads)
 * 2. Reliable 4-step auto-scroll for dynamic "Web results" rendering
 * 3. 2-Tier Link & Social Media Harvester:
 *    - Tier 1: Official GMB Action Website Button
 *    - Tier 2: Deep "Web results" List & Social Card Extractor (Facebook, Instagram, X/Twitter, LinkedIn, Yelp, TikTok, etc.)
 * 4. Tracking parameter sanitizer for direct, actionable social URLs
 */

(function () {
  console.log('[FetchPro] Harvester script active on:', window.location.href);

  let isScraping = false;
  let scrapedLeads = [];
  let seenIdentifiers = new Set();
  let maxLeadsTarget = 15;
  let floatingBanner = null;

  /**
   * Safe storage helper (protects against Extension Context Invalidation)
   */
  function safeSetStorage(data) {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.storage?.local) {
      try {
        chrome.storage.local.set(data, () => {
          if (chrome.runtime?.lastError) {
            // Silently handled
          }
        });
      } catch (e) {}
    }
  }

  /**
   * Safe message dispatcher (handles popup closed without throwing lastError)
   */
  function safeSendMessage(msg) {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage(msg, () => {
          if (chrome.runtime?.lastError) {
            // Silently handle disconnected port when popup is closed
          }
        });
      } catch (e) {}
    }
  }

  function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Unmasks Google redirect URLs and cleans tracking parameters
   */
  function unmaskAndCleanUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.trim();

    // Decode Google redirects: /url?q=... or google.com/url?q=... or /url?url=...
    if (url.includes('/url?') || url.includes('google.com/url?')) {
      const match = url.match(/[?&](?:q|url)=([^&]+)/);
      if (match && match[1]) {
        try {
          url = decodeURIComponent(match[1]);
        } catch (e) {
          url = match[1];
        }
      }
    }

    // Filter out internal Google and ad tracking links
    if (
      !url ||
      url.startsWith('/') ||
      url.startsWith('#') ||
      url.includes('google.com') ||
      url.includes('gstatic.com') ||
      url.includes('googleadservices.com') ||
      url.includes('maps.google') ||
      url.includes('accounts.google')
    ) {
      return '';
    }

    // Ensure valid protocol prefix if missing
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    // Sanitize Facebook / Instagram / Twitter / Yelp tracking junk
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
   * Target all scrollable containers in the active profile/detail pane
   */
  function getActiveDetailPanes() {
    const panes = [];
    const containers = document.querySelectorAll(
      'div[role="main"] div.m6QErb, div[tabindex="-1"] div.m6QErb, div.m6QErb.DxyBCb, div.m6QErb, div[role="main"], div[tabindex="-1"], div.section-layout'
    );
    for (const el of containers) {
      if (el.scrollHeight > el.clientHeight && el.clientHeight > 180) {
        panes.push(el);
      }
    }
    if (panes.length === 0) {
      const main = document.querySelector('div[role="main"]') || document.querySelector('div[tabindex="-1"]');
      if (main) panes.push(main);
    }
    return panes;
  }

  /**
   * Search Results Feed Container
   */
  function getSearchFeedContainer() {
    const feed = document.querySelector('div[role="feed"]');
    if (feed) return feed;

    const ariaContainers = document.querySelectorAll(
      'div[aria-label*="Results for"], div[aria-label*="results for"], div[aria-label*="Results"], div[aria-label*="results"]'
    );
    for (const c of ariaContainers) {
      if (c.scrollHeight > c.clientHeight) return c;
    }

    const m6Containers = document.querySelectorAll('div.m6QErb.DxyBCb, div.m6QErb, div.section-layout');
    for (const c of m6Containers) {
      if (c.scrollHeight > c.clientHeight && c.clientHeight > 200) return c;
    }

    return document.body;
  }

  /**
   * 1. Multi-step scroll of the active detail container to force lazy "Web results" to render
   */
  async function ensureWebResultsRendered() {
    const panes = getActiveDetailPanes();
    if (panes.length === 0) return;

    for (let step = 1; step <= 4; step++) {
      for (const pane of panes) {
        try {
          const targetScroll = Math.min(pane.scrollHeight, step * 700);
          pane.scrollTop = targetScroll;
          pane.dispatchEvent(new WheelEvent('wheel', { deltaY: 700, bubbles: true }));
          pane.dispatchEvent(new Event('scroll', { bubbles: true }));
        } catch (e) {}
      }
      await new Promise((res) => setTimeout(res, 350));
    }

    // Scroll to absolute bottom
    for (const pane of panes) {
      try {
        pane.scrollTop = pane.scrollHeight;
        pane.dispatchEvent(new WheelEvent('wheel', { deltaY: 1200, bubbles: true }));
        pane.dispatchEvent(new Event('scroll', { bubbles: true }));
      } catch (e) {}
    }

    // Wait for Google Maps to resolve Web results APIs and mount DOM cards
    await new Promise((res) => setTimeout(res, 850));
  }

  /**
   * 2. Extract official GMB Button AND Web Results links (2-Tier Extraction)
   */
  function extractAllBusinessLinks() {
    // Tier 1: Check official Top Action Website Button
    const officialWebsiteBtn = document.querySelector(
      'a[data-item-id="authority"], a[aria-label*="Website"], a[aria-label*="website"], a[data-tooltip*="website"]'
    );
    let primaryWebsite = null;
    if (officialWebsiteBtn) {
      let rawHref = officialWebsiteBtn.getAttribute('href') || officialWebsiteBtn.href || '';
      const cleanPrimary = unmaskAndCleanUrl(rawHref);
      if (cleanPrimary) {
        primaryWebsite = cleanPrimary;
      }
    }

    // Tier 2: Extract ALL links across the document excluding feed cards
    const feedAnchors = new Set(Array.from(document.querySelectorAll('div[role="feed"] a, a.hfpxzc')));
    const allAnchors = Array.from(document.querySelectorAll('a[href]')).filter((a) => !feedAnchors.has(a));

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

    let fallbackWebsite = null;
    const web_results_links = [];

    allAnchors.forEach((a) => {
      const rawHref = a.getAttribute('href') || a.href || '';
      const href = unmaskAndCleanUrl(rawHref);
      if (!href) return;

      const lower = href.toLowerCase();
      const linkText = cleanText(a.innerText || a.getAttribute('aria-label') || '');

      // Categorize Links
      if (
        (lower.includes('facebook.com') || lower.includes('fb.me') || lower.includes('fb.com')) &&
        !lower.includes('/sharer') &&
        !lower.includes('/dialog')
      ) {
        if (!socialProfiles.facebook) socialProfiles.facebook = href;
        web_results_links.push({ type: 'facebook', url: href, title: linkText });
      } else if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
        if (!socialProfiles.instagram) socialProfiles.instagram = href;
        web_results_links.push({ type: 'instagram', url: href, title: linkText });
      } else if (lower.includes('yelp.com/biz/') || lower.includes('yelp.com')) {
        if (!socialProfiles.yelp) socialProfiles.yelp = href;
        web_results_links.push({ type: 'yelp', url: href, title: linkText });
      } else if (lower.includes('linkedin.com/company/') || lower.includes('linkedin.com/in/')) {
        if (!socialProfiles.linkedin) socialProfiles.linkedin = href;
        web_results_links.push({ type: 'linkedin', url: href, title: linkText });
      } else if (
        (lower.includes('twitter.com') || lower.includes('x.com')) &&
        !lower.includes('/intent') &&
        !lower.includes('/share')
      ) {
        if (!socialProfiles.twitter_x) socialProfiles.twitter_x = href;
        web_results_links.push({ type: 'twitter_x', url: href, title: linkText });
      } else if (lower.includes('tiktok.com/@') || lower.includes('tiktok.com')) {
        if (!socialProfiles.tiktok) socialProfiles.tiktok = href;
        web_results_links.push({ type: 'tiktok', url: href, title: linkText });
      } else if (lower.includes('youtube.com/c/') || lower.includes('youtube.com/@') || lower.includes('youtube.com/channel/')) {
        if (!socialProfiles.youtube) socialProfiles.youtube = href;
        web_results_links.push({ type: 'youtube', url: href, title: linkText });
      } else if (lower.includes('mapquest.com')) {
        if (!socialProfiles.mapquest) socialProfiles.mapquest = href;
        socialProfiles.other_directories.push(href);
        web_results_links.push({ type: 'mapquest', url: href, title: linkText });
      } else if (lower.includes('yellowpages.com')) {
        if (!socialProfiles.yellowpages) socialProfiles.yellowpages = href;
        socialProfiles.other_directories.push(href);
        web_results_links.push({ type: 'directory', url: href, title: linkText });
      } else if (
        lower.includes('bbb.org') ||
        lower.includes('angi.com') ||
        lower.includes('homeadvisor.com') ||
        lower.includes('tripadvisor.com') ||
        lower.includes('thumbtack.com') ||
        lower.includes('houzz.com')
      ) {
        socialProfiles.other_directories.push(href);
        web_results_links.push({ type: 'directory', url: href, title: linkText });
      } else {
        // If it's not a social/directory platform, it is a business website candidate
        if (!fallbackWebsite && !primaryWebsite) {
          fallbackWebsite = href;
        }
        web_results_links.push({ type: 'website', url: href, title: linkText });
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
   * Floating In-Page Status HUD
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
   * Deep Inspection of Open Business Profile Card
   */
  async function deepInspectActiveProfile() {
    try {
      if (scrapedLeads.length >= maxLeadsTarget) return 0;

      // 1. Scroll active detail container to absolute bottom and wait for Web results
      await ensureWebResultsRendered();

      // 2. Business Name
      const nameEl = document.querySelector(
        'h1.DUwDvf, [class*="header-title-title"], div.x3AX1-LfntMc-header-title-title, h1'
      );
      if (!nameEl || !nameEl.innerText) return 0;

      const businessName = cleanText(nameEl.innerText);
      if (!businessName || businessName.length < 2 || businessName.includes('Search this area')) return 0;

      const currentMapsUrl = window.location.href;

      // 3. Rating & Reviews Count
      let rating = 0;
      let reviewsCount = 0;
      const ratingEl = document.querySelector('div.F7nice, span.MW4etd, [aria-label*="stars"]');
      if (ratingEl) {
        const matchRating = (ratingEl.innerText || ratingEl.getAttribute('aria-label') || '').match(
          /([0-5]\.[0-9]|[0-5])/
        );
        if (matchRating) rating = parseFloat(matchRating[1]);
        const matchRev = (ratingEl.innerText || '').match(/\(?([0-9,]+)\)?/);
        if (matchRev) reviewsCount = parseInt(matchRev[1].replace(/,/g, ''), 10);
      }

      // 4. Primary Category
      let category = '';
      const catBtn = document.querySelector('button[jsaction*="category"], button.DkEaL, [data-item-id*="address"] + div');
      if (catBtn) {
        category = cleanText(catBtn.innerText || '');
      }

      // 5. Phone Number
      let phone = '';
      const phoneBtn = document.querySelector(
        'button[data-item-id*="phone"], button[aria-label*="Phone"], [data-tooltip*="phone"]'
      );
      if (phoneBtn) {
        const pMatch = (phoneBtn.innerText || phoneBtn.getAttribute('aria-label') || '').match(
          /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/
        );
        if (pMatch) phone = cleanText(pMatch[0]);
      }

      // 6. Full Address
      let address = '';
      const addressBtn = document.querySelector(
        'button[data-item-id*="address"], button[aria-label*="Address"], [data-tooltip*="address"]'
      );
      if (addressBtn) {
        address = cleanText(addressBtn.innerText || addressBtn.getAttribute('aria-label') || '');
      }

      // 7. Opening Hours
      let openingHours = '';
      const hoursEl = document.querySelector('div.t39EBf, span.ZDu9vd, div[aria-label*="hours"]');
      if (hoursEl) {
        openingHours = cleanText(hoursEl.innerText || hoursEl.getAttribute('aria-label') || '');
      }

      // 8. Description
      let description = '';
      const descEl = document.querySelector('div.PYvSYb, div.m6QErb div[aria-label*="About"]');
      if (descEl) {
        description = cleanText(descEl.innerText || '');
      }

      // 9. 2-Tier Link & Social Extraction
      const {
        website_url,
        website_source,
        primaryWebsite,
        fallbackWebsite,
        social_profiles,
        web_results_links,
      } = extractAllBusinessLinks();

      const existingIndex = scrapedLeads.findIndex(
        (l) =>
          l.maps_url === currentMapsUrl ||
          l.business_name.toLowerCase() === businessName.toLowerCase()
      );

      // Complete Normalized Raw Payload
      const lead = {
        id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7),
        business_name: businessName,
        phone: phone || null,
        rating: rating || 0,
        reviews_count: reviewsCount || 0,
        category: category || null,
        address: address || null,
        opening_hours: openingHours || null,
        description: description || null,
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
          website_url: scrapedLeads[existingIndex].website_url || website_url,
          website_source: scrapedLeads[existingIndex].website_source || website_source,
          social_profiles: social_profiles || scrapedLeads[existingIndex].social_profiles,
          socials: social_profiles || scrapedLeads[existingIndex].socials,
        };
        return 0;
      }

      if (scrapedLeads.length >= maxLeadsTarget) return 0;

      seenIdentifiers.add(currentMapsUrl);
      seenIdentifiers.add(businessName.toLowerCase());
      scrapedLeads.push(lead);
      return 1;
    } catch (err) {
      console.warn('[FetchPro] deepInspectActiveProfile error:', err);
      return 0;
    }
  }

  /**
   * Main Scraping Loop
   */
  async function runScrapeLoop() {
    const feedContainer = getSearchFeedContainer();
    let processedCards = 0;
    let consecutiveNoNew = 0;

    console.log(`[FetchPro] Starting GMB Deep Inspection loop for exactly ${maxLeadsTarget} leads...`);
    updateFloatingHUD('Starting Deep Crawl...', scrapedLeads.length, true);

    while (isScraping && scrapedLeads.length < maxLeadsTarget) {
      const cards = Array.from(document.querySelectorAll('a.hfpxzc, div.Nv2PK a[href*="/maps/place/"]'));

      // Iterate through visible cards
      for (let i = processedCards; i < cards.length && isScraping; i++) {
        if (scrapedLeads.length >= maxLeadsTarget) break;

        const cardAnchor = cards[i];
        processedCards = i + 1;

        try {
          const cardName = cleanText(cardAnchor.getAttribute('aria-label') || '');
          updateFloatingHUD('Inspecting Profile', scrapedLeads.length, true, cardName);

          // 1. Click card to open overview & details and wait 1.25s
          cardAnchor.click();
          await new Promise((r) => setTimeout(r, 1250));

          // 2. Ensure Web results rendered & extract 2-tier website + socials
          await deepInspectActiveProfile();

          const latest = scrapedLeads[scrapedLeads.length - 1];
          updateFloatingHUD('Crawled Lead', scrapedLeads.length, true, latest?.business_name || '');
          safeSetStorage({ leadflow_leads: scrapedLeads });

          safeSendMessage({
            type: 'SCRAPE_PROGRESS',
            count: scrapedLeads.length,
            maxLeads: maxLeadsTarget,
            latestLead: latest || null,
            leads: scrapedLeads,
          });

          if (scrapedLeads.length >= maxLeadsTarget) {
            console.log(`[FetchPro] Reached target limit of ${maxLeadsTarget} leads.`);
            break;
          }
        } catch (cardErr) {
          console.warn('[FetchPro] Card crawl error:', cardErr);
        }
      }

      if (scrapedLeads.length >= maxLeadsTarget) break;

      // Scroll results feed
      if (feedContainer && feedContainer !== document.body) {
        feedContainer.scrollTop += 850;
        try {
          feedContainer.dispatchEvent(new WheelEvent('wheel', { deltaY: 850, bubbles: true }));
        } catch (e) {}
      } else {
        window.scrollBy({ top: 850, behavior: 'smooth' });
      }

      await new Promise((r) => setTimeout(r, 1200));

      const freshCards = Array.from(document.querySelectorAll('a.hfpxzc, div.Nv2PK a[href*="/maps/place/"]'));
      if (freshCards.length <= processedCards) {
        consecutiveNoNew++;
      } else {
        consecutiveNoNew = 0;
      }

      if (consecutiveNoNew >= 10) {
        console.log('[FetchPro] Reached end of Google Maps feed.');
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

  /**
   * Message Listener (Only returns true for async operations)
   */
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

    if (message.type === 'EXTRACT_NOW') {
      deepInspectActiveProfile()
        .then(() => {
          safeSetStorage({ leadflow_leads: scrapedLeads });
          updateFloatingHUD('Extracted Profile & Web results', scrapedLeads.length, false);
          sendResponse({ status: 'OK', count: scrapedLeads.length, leads: scrapedLeads });
        })
        .catch(() => {
          sendResponse({ status: 'ERROR', count: scrapedLeads.length, leads: scrapedLeads });
        });
      return true; // Asynchronous sendResponse
    }

    if (message.type === 'START_SCRAPING') {
      if (isScraping) {
        sendResponse({ status: 'ALREADY_RUNNING', count: scrapedLeads.length });
        return false;
      }

      maxLeadsTarget = parseInt(message.maxLeads, 10) || 15;

      // Always start fresh for a new target harvest
      scrapedLeads = [];
      seenIdentifiers.clear();
      safeSetStorage({ leadflow_leads: [] });

      isScraping = true;

      runScrapeLoop().catch((err) => {
        console.error('[FetchPro] Scrape error:', err);
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
