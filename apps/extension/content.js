/**
 * FetchPro - Google Maps Deep Profile Inspection Engine
 * Features:
 * 1. Click & Deep Scroll on Place Detail Panels (forces lazy-loaded Web results and bottom sections to render)
 * 2. Deep URL & Social Extraction (Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube)
 * 3. High-Accuracy DOM parsing and Background Sync
 */

(function () {
  console.log('[FetchPro] Deep Profile Inspection Engine loaded on:', window.location.href);

  let isScraping = false;
  let scrapedLeads = [];
  let seenIdentifiers = new Set();
  let maxLeadsTarget = 30;
  let floatingBanner = null;

  function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Find main results feed container
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
   * Find opened Place Details pane container
   */
  function getPlaceDetailsPane() {
    const detailPane = document.querySelector(
      'div[role="main"], div.m6QErb.DxyBCb[tabindex="-1"], div.m6QErb[tabindex="-1"], div[aria-label*="Information for"], div.x3AX1-LfntMc-header-title'
    );
    if (detailPane) return detailPane.closest('div.m6QErb') || detailPane;
    return document.querySelector('div.m6QErb');
  }

  /**
   * In-page Floating HUD
   */
  function updateFloatingHUD(statusText, count = 0, isRunning = false) {
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
      `;
      document.body.appendChild(floatingBanner);
    }

    floatingBanner.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${
          isRunning ? '#10b981' : '#3b82f6'
        }; box-shadow:${isRunning ? '0 0 10px #10b981' : '0 0 6px #3b82f6'};"></span>
        <strong style="font-weight:700; color:#60a5fa;">FetchPro Deep Scraper</strong>
      </div>
      <div style="height:14px; width:1px; background:rgba(255,255,255,0.2);"></div>
      <div>${statusText}: <span style="font-weight:700; color:#38bdf8;">${count}</span> leads</div>
    `;
  }

  /**
   * Deep link parser: resolves Web results, social links, and unlinked websites
   */
  function extractWebResultsAndSocials(rootEl) {
    const root = rootEl || document;
    const socials = {};
    let unlinkedSite = '';

    const allLinks = root.querySelectorAll('a[href^="http"]');

    allLinks.forEach((a) => {
      let rawHref = a.href;
      if (!rawHref) return;

      // Handle Google redirect wrappers
      if (rawHref.includes('google.com/url?q=')) {
        try {
          const urlParams = new URLSearchParams(rawHref.split('?')[1]);
          const target = urlParams.get('q');
          if (target) rawHref = target;
        } catch (e) {}
      }

      const cleanLower = rawHref.toLowerCase();

      // Skip internal google links
      if (
        cleanLower.includes('google.com') ||
        cleanLower.includes('gstatic.com') ||
        cleanLower.includes('googleadservices.com') ||
        cleanLower.includes('maps.google')
      ) {
        return;
      }

      // Check Social Platforms
      if (!socials.facebook && cleanLower.includes('facebook.com') && !cleanLower.includes('/sharer')) {
        socials.facebook = rawHref;
      } else if (!socials.instagram && cleanLower.includes('instagram.com') && !cleanLower.includes('/p/')) {
        socials.instagram = rawHref;
      } else if (!socials.tiktok && cleanLower.includes('tiktok.com/@')) {
        socials.tiktok = rawHref;
      } else if (!socials.linkedin && (cleanLower.includes('linkedin.com/company/') || cleanLower.includes('linkedin.com/in/'))) {
        socials.linkedin = rawHref;
      } else if (!socials.twitter && (cleanLower.includes('twitter.com/') || cleanLower.includes('x.com/')) && !cleanLower.includes('/intent')) {
        socials.twitter = rawHref;
      } else if (!socials.youtube && (cleanLower.includes('youtube.com/c/') || cleanLower.includes('youtube.com/@') || cleanLower.includes('youtube.com/channel/'))) {
        socials.youtube = rawHref;
      } else if (
        !unlinkedSite &&
        !cleanLower.includes('yelp.com') &&
        !cleanLower.includes('mapquest.com') &&
        !cleanLower.includes('bbb.org') &&
        !cleanLower.includes('yellowpages.com') &&
        !cleanLower.includes('tripadvisor.com') &&
        !cleanLower.includes('waze.com')
      ) {
        unlinkedSite = rawHref;
      }
    });

    return { socials, unlinkedSite };
  }

  /**
   * Deep Inspection: Auto-scroll open detail pane and extract standard fields + web results
   */
  async function deepInspectOpenPlace() {
    const detailPane = getPlaceDetailsPane();
    if (detailPane && detailPane.scrollHeight > detailPane.clientHeight) {
      // Auto-scroll detail panel from top to bottom to force lazy sections to render
      detailPane.scrollTop = detailPane.scrollHeight;
      try {
        detailPane.dispatchEvent(new WheelEvent('wheel', { deltaY: 1000, bubbles: true }));
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 450));
    }

    const nameEl = document.querySelector(
      'h1.DUwDvf, [class*="header-title-title"], div.x3AX1-LfntMc-header-title-title, h1'
    );
    if (!nameEl || !nameEl.innerText) return 0;

    const businessName = cleanText(nameEl.innerText);
    if (!businessName || businessName.length < 2 || businessName.includes('Search this area')) return 0;

    const currentMapsUrl = window.location.href;

    // Rating & Reviews
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

    // Phone
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

    // Address
    let address = '';
    const addressBtn = document.querySelector(
      'button[data-item-id*="address"], button[aria-label*="Address"], [data-tooltip*="address"]'
    );
    if (addressBtn) {
      address = cleanText(addressBtn.innerText || addressBtn.getAttribute('aria-label') || '');
    }

    // Primary Website Button in GMB header
    let gmbWebsiteUrl = '';
    const webBtn = document.querySelector(
      'a[data-item-id="authority"], a[aria-label*="Website"], a[data-tooltip*="website"]'
    );
    if (webBtn && webBtn.href) {
      let raw = webBtn.href;
      if (raw.includes('google.com/url?q=')) {
        try {
          const p = new URLSearchParams(raw.split('?')[1]);
          raw = p.get('q') || raw;
        } catch (e) {}
      }
      gmbWebsiteUrl = raw;
    }

    // Deep inspect "Web results" & Socials in place pane
    const { socials, unlinkedSite } = extractWebResultsAndSocials(document);
    const finalWebsite = gmbWebsiteUrl || unlinkedSite || null;

    const existingIndex = scrapedLeads.findIndex(
      (l) =>
        l.maps_url === currentMapsUrl ||
        l.business_name.toLowerCase() === businessName.toLowerCase()
    );

    const lead = {
      id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7),
      business_name: businessName,
      phone: phone || null,
      rating: rating || 0,
      reviews_count: reviewsCount || 0,
      status: 'Open',
      maps_url: currentMapsUrl,
      website_url: finalWebsite,
      socials: Object.keys(socials).length > 0 ? socials : null,
      email: null,
      address: address || null,
      scraped_at: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      scrapedLeads[existingIndex] = {
        ...scrapedLeads[existingIndex],
        website_url: scrapedLeads[existingIndex].website_url || finalWebsite,
        socials:
          socials && Object.keys(socials).length > 0
            ? socials
            : scrapedLeads[existingIndex].socials,
        phone: phone || scrapedLeads[existingIndex].phone,
        address: address || scrapedLeads[existingIndex].address,
      };
      return 0;
    }

    seenIdentifiers.add(currentMapsUrl);
    seenIdentifiers.add(businessName.toLowerCase());
    scrapedLeads.push(lead);
    return 1;
  }

  /**
   * Fast feed extractor (grabs high-level list items)
   */
  function extractQuickFeedFromDOM() {
    let count = 0;
    const placeLinks = document.querySelectorAll(
      'a.hfpxzc, a[href*="/maps/place/"], div.Nv2PK, div.qBF1Pd, div.fontHeadlineSmall, div[role="article"]'
    );

    placeLinks.forEach((el) => {
      const card =
        el.closest('div.Nv2PK') ||
        el.closest('div[role="article"]') ||
        el.closest('div.THOPZb') ||
        el.parentElement;
      if (!card) return;

      let businessName = '';
      const nameEl = card.querySelector('.qBF1Pd, .fontHeadlineSmall, h2, [class*="headline"], div[aria-label]');
      if (nameEl) {
        businessName = cleanText(nameEl.innerText || nameEl.getAttribute('aria-label') || '');
      }

      if (!businessName) {
        const linkEl = card.querySelector('a.hfpxzc, a[href*="/maps/place/"]');
        if (linkEl) {
          businessName = cleanText(linkEl.getAttribute('aria-label') || linkEl.innerText || '');
        }
      }

      if (!businessName || businessName.length < 2 || businessName.includes('Search this area')) return;

      let mapsUrl = '';
      const anchor = card.querySelector('a.hfpxzc, a[href*="/maps/place/"], a[href*="google.com/maps"]');
      if (anchor && anchor.href) {
        mapsUrl = anchor.href;
      }

      const identifier = mapsUrl || businessName.toLowerCase();
      if (seenIdentifiers.has(identifier)) return;

      let rating = 0;
      let reviewsCount = 0;
      const allCardText = card.innerText || '';

      const ratingEl = card.querySelector('span.MW4etd, span[aria-label*="stars"], span[aria-label*="star"]');
      if (ratingEl) {
        const rText = ratingEl.innerText || ratingEl.getAttribute('aria-label') || '';
        const m = rText.match(/([0-5]\.[0-9]|[0-5])/);
        if (m) rating = parseFloat(m[1]);
      }

      const revEl = card.querySelector('span.UY7F9, span[aria-label*="reviews"], span[aria-label*="review"]');
      if (revEl) {
        const m = (revEl.innerText || revEl.getAttribute('aria-label') || '').match(/\(?([0-9,]+)\)?/);
        if (m) reviewsCount = parseInt(m[1].replace(/,/g, ''), 10);
      }

      let websiteUrl = '';
      const webLink = card.querySelector(
        'a[data-value="Website"], a[aria-label*="Website"], a[aria-label*="website"], a.lcr4fd'
      );
      if (webLink && webLink.href) {
        let rawUrl = webLink.href;
        if (rawUrl.includes('google.com/url?q=')) {
          const params = new URLSearchParams(rawUrl.split('?')[1]);
          rawUrl = params.get('q') || rawUrl;
        }
        websiteUrl = rawUrl;
      }

      let phone = '';
      const phoneMatch = allCardText.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
      if (phoneMatch) {
        phone = cleanText(phoneMatch[0]);
      }

      const lead = {
        id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7),
        business_name: businessName,
        phone: phone || null,
        rating: rating || 0,
        reviews_count: reviewsCount || 0,
        status: 'Open',
        maps_url: mapsUrl || window.location.href,
        website_url: websiteUrl || null,
        socials: null,
        email: null,
        scraped_at: new Date().toISOString(),
      };

      seenIdentifiers.add(identifier);
      seenIdentifiers.add(businessName.toLowerCase());
      scrapedLeads.push(lead);
      count++;
    });

    return count;
  }

  /**
   * Master Deep Scraper Loop:
   * Clicks each business item, auto-scrolls its details pane, and extracts Web results
   */
  async function runDeepScrapeLoop() {
    const feedContainer = getSearchFeedContainer();
    let processedCards = 0;
    let consecutiveNoNew = 0;

    console.log('[FetchPro] Starting Deep Profile Scraper loop...');
    updateFloatingHUD('Inspecting Profiles & Web results', scrapedLeads.length, true);

    while (isScraping && scrapedLeads.length < maxLeadsTarget) {
      const cards = Array.from(document.querySelectorAll('a.hfpxzc, div.Nv2PK a[href*="/maps/place/"]'));

      if (cards.length === 0) {
        extractQuickFeedFromDOM();
        await deepInspectOpenPlace();
      }

      // Iterate over visible cards with Click & Deep Scroll
      for (let i = processedCards; i < cards.length && isScraping; i++) {
        if (scrapedLeads.length >= maxLeadsTarget) break;

        const cardAnchor = cards[i];
        processedCards = i + 1;

        try {
          // 1. Click place card
          cardAnchor.click();
          await new Promise((r) => setTimeout(r, 700));

          // 2. Auto-scroll detail pane to load Web results and bottom social links
          await deepInspectOpenPlace();

          updateFloatingHUD('Inspecting Profiles & Web results', scrapedLeads.length, true);
          chrome.storage.local.set({ leadflow_leads: scrapedLeads });

          chrome.runtime
            .sendMessage({
              type: 'SCRAPE_PROGRESS',
              count: scrapedLeads.length,
              maxLeads: maxLeadsTarget,
              latestLead: scrapedLeads[scrapedLeads.length - 1] || null,
            })
            .catch(() => {});
        } catch (cardErr) {
          console.warn('[FetchPro] Error inspecting place card:', cardErr);
        }
      }

      // Scroll results feed to reveal more businesses
      if (feedContainer && feedContainer !== document.body) {
        feedContainer.scrollTop += 850;
        try {
          feedContainer.dispatchEvent(new WheelEvent('wheel', { deltaY: 850, bubbles: true }));
        } catch (e) {}
      } else {
        window.scrollBy({ top: 850, behavior: 'smooth' });
      }

      await new Promise((r) => setTimeout(r, 1200));

      const newlyFound = extractQuickFeedFromDOM();
      if (newlyFound === 0 && processedCards >= cards.length) {
        consecutiveNoNew++;
      } else {
        consecutiveNoNew = 0;
      }

      if (consecutiveNoNew >= 12) {
        console.log('[FetchPro] Reached end of Google Maps feed.');
        break;
      }
    }

    isScraping = false;
    chrome.storage.local.set({ leadflow_leads: scrapedLeads });
    updateFloatingHUD('Deep inspection complete', scrapedLeads.length, false);

    chrome.runtime
      .sendMessage({
        type: 'SCRAPE_COMPLETED',
        count: scrapedLeads.length,
        leads: scrapedLeads,
      })
      .catch(() => {});
  }

  /**
   * Message Listener
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      sendResponse({
        status: 'READY',
        isMaps: window.location.href.includes('google.com/maps'),
        url: window.location.href,
        isScraping,
        count: scrapedLeads.length,
      });
      return true;
    }

    if (message.type === 'EXTRACT_NOW') {
      extractQuickFeedFromDOM();
      deepInspectOpenPlace().then(() => {
        chrome.storage.local.set({ leadflow_leads: scrapedLeads });
        updateFloatingHUD('Extracted profile & Web results', scrapedLeads.length, false);
        sendResponse({ status: 'OK', count: scrapedLeads.length, leads: scrapedLeads });
      });
      return true;
    }

    if (message.type === 'START_SCRAPING') {
      if (isScraping) {
        sendResponse({ status: 'ALREADY_RUNNING', count: scrapedLeads.length });
        return true;
      }

      isScraping = true;
      maxLeadsTarget = message.maxLeads || 30;

      runDeepScrapeLoop().catch((err) => {
        console.error('[FetchPro] Scrape error:', err);
        isScraping = false;
        updateFloatingHUD('Stopped', scrapedLeads.length, false);
      });

      sendResponse({ status: 'STARTED', maxLeads: maxLeadsTarget });
      return true;
    }

    if (message.type === 'STOP_SCRAPING') {
      isScraping = false;
      updateFloatingHUD('Stopped', scrapedLeads.length, false);
      sendResponse({ status: 'STOPPED', count: scrapedLeads.length, leads: scrapedLeads });
      return true;
    }

    if (message.type === 'GET_LEADS') {
      sendResponse({ leads: scrapedLeads, isScraping });
      return true;
    }

    if (message.type === 'CLEAR_LEADS') {
      scrapedLeads = [];
      seenIdentifiers.clear();
      chrome.storage.local.set({ leadflow_leads: [] });
      if (floatingBanner && floatingBanner.parentNode) {
        floatingBanner.parentNode.removeChild(floatingBanner);
        floatingBanner = null;
      }
      sendResponse({ status: 'CLEARED' });
      return true;
    }

    return true;
  });

  // Listen to manual place clicks
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (
      target &&
      (target.closest('a.hfpxzc') ||
        target.closest('div.Nv2PK') ||
        target.closest('[role="article"]'))
    ) {
      setTimeout(() => {
        deepInspectOpenPlace().then(() => {
          chrome.storage.local.set({ leadflow_leads: scrapedLeads });
        });
      }, 900);
    }
  });

  // Restore cached leads
  chrome.storage.local.get(['leadflow_leads'], (res) => {
    if (res && Array.isArray(res.leadflow_leads) && res.leadflow_leads.length > 0) {
      scrapedLeads = res.leadflow_leads;
      scrapedLeads.forEach((lead) => {
        const id = lead.maps_url || lead.business_name.toLowerCase();
        seenIdentifiers.add(id);
      });
      updateFloatingHUD('Ready', scrapedLeads.length, false);
    }
  });

  // Initial check
  setTimeout(() => {
    extractQuickFeedFromDOM();
    deepInspectOpenPlace().then(() => {
      if (scrapedLeads.length > 0) {
        chrome.storage.local.set({ leadflow_leads: scrapedLeads });
        updateFloatingHUD('Found visible leads', scrapedLeads.length, false);
      }
    });
  }, 1000);
})();
