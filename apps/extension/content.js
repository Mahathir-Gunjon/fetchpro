/**
 * FetchPro - Google Maps Deep Lead Scraper & Web Results Extractor
 * Extracts: Business Name, Phone, Google Rating, Reviews, Website (from GMB or Web Results),
 * and Social Profiles (Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube).
 */

(function () {
  console.log('[FetchPro] Deep Scraper loaded on:', window.location.href);

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
   * Find scrollable results feed on Google Maps
   */
  function getScrollContainer() {
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
   * Floating in-page status HUD
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
        <strong style="font-weight:700; color:#60a5fa;">FetchPro</strong>
      </div>
      <div style="height:14px; width:1px; background:rgba(255,255,255,0.2);"></div>
      <div>${statusText}: <span style="font-weight:700; color:#38bdf8;">${count}</span> leads</div>
    `;
  }

  /**
   * Extract "Web results", Social profiles (FB, IG, TikTok, LinkedIn), and unlinked websites from Place Details pane
   */
  function extractWebResultsAndSocials(rootEl) {
    const root = rootEl || document;
    const socials = {};
    let unlinkedSite = '';

    const allLinks = root.querySelectorAll('a[href^="http"]');

    allLinks.forEach((a) => {
      let rawHref = a.href;
      const lower = rawHref.toLowerCase();

      // Check Google URL redirect wrapper
      if (lower.includes('google.com/url?q=')) {
        try {
          const urlParams = new URLSearchParams(rawHref.split('?')[1]);
          const target = urlParams.get('q');
          if (target) rawHref = target;
        } catch (e) {}
      }

      const cleanLower = rawHref.toLowerCase();

      // Ignore Google internal services
      if (cleanLower.includes('google.com') || cleanLower.includes('gstatic.com') || cleanLower.includes('googleadservices.com')) {
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
      } else if (!unlinkedSite && !cleanLower.includes('yelp.com') && !cleanLower.includes('mapquest.com') && !cleanLower.includes('bbb.org') && !cleanLower.includes('yellowpages.com')) {
        unlinkedSite = rawHref;
      }
    });

    return { socials, unlinkedSite };
  }

  /**
   * Extract single place detail view
   */
  function extractSinglePlaceFromDOM() {
    const nameEl = document.querySelector('h1.DUwDvf, [class*="header-title-title"], div.x3AX1-LfntMc-header-title-title, h1');
    if (!nameEl || !nameEl.innerText) return 0;

    const businessName = cleanText(nameEl.innerText);
    if (!businessName || businessName.length < 2 || businessName.includes('Search this area')) return 0;

    const identifier = window.location.href;
    const existingIndex = scrapedLeads.findIndex(
      (l) => l.maps_url === identifier || l.business_name.toLowerCase() === businessName.toLowerCase()
    );

    // Rating & Reviews
    let rating = 0;
    let reviewsCount = 0;
    const ratingEl = document.querySelector('div.F7nice, span.MW4etd, [aria-label*="stars"]');
    if (ratingEl) {
      const matchRating = (ratingEl.innerText || ratingEl.getAttribute('aria-label') || '').match(/([0-5]\.[0-9]|[0-5])/);
      if (matchRating) rating = parseFloat(matchRating[1]);
      const matchRev = (ratingEl.innerText || '').match(/\(?([0-9,]+)\)?/);
      if (matchRev) reviewsCount = parseInt(matchRev[1].replace(/,/g, ''), 10);
    }

    // Phone
    let phone = '';
    const phoneBtn = document.querySelector('button[data-item-id*="phone"], button[aria-label*="Phone"], [data-tooltip*="phone"]');
    if (phoneBtn) {
      const pMatch = (phoneBtn.innerText || phoneBtn.getAttribute('aria-label') || '').match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
      if (pMatch) phone = pMatch[0];
    }

    // Primary Website Button in GMB header
    let gmbWebsiteUrl = '';
    const webBtn = document.querySelector('a[data-item-id="authority"], a[aria-label*="Website"], a[data-tooltip*="website"]');
    if (webBtn && webBtn.href) {
      gmbWebsiteUrl = webBtn.href;
    }

    // Deep inspect "Web results" & Socials in place pane
    const { socials, unlinkedSite } = extractWebResultsAndSocials(document);
    const finalWebsite = gmbWebsiteUrl || unlinkedSite || null;

    const lead = {
      id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7),
      business_name: businessName,
      phone: phone || null,
      rating: rating || 0,
      reviews_count: reviewsCount || 0,
      status: 'Open',
      maps_url: window.location.href,
      website_url: finalWebsite,
      socials: Object.keys(socials).length > 0 ? socials : null,
      email: null,
      scraped_at: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      // Enrich existing lead with newly found Web results & socials
      scrapedLeads[existingIndex] = {
        ...scrapedLeads[existingIndex],
        website_url: scrapedLeads[existingIndex].website_url || finalWebsite,
        socials: socials && Object.keys(socials).length > 0 ? socials : scrapedLeads[existingIndex].socials,
        phone: phone || scrapedLeads[existingIndex].phone,
      };
      return 0;
    }

    seenIdentifiers.add(identifier);
    seenIdentifiers.add(businessName.toLowerCase());
    scrapedLeads.push(lead);
    return 1;
  }

  /**
   * Extract search results feed
   */
  function extractLeadsFromDOM() {
    let newlyFoundCount = 0;

    // Check single place pane if open
    if (window.location.href.includes('/maps/place/') || document.querySelector('h1.DUwDvf')) {
      newlyFoundCount += extractSinglePlaceFromDOM();
    }

    const placeLinks = document.querySelectorAll(
      'a.hfpxzc, a[href*="/maps/place/"], div.Nv2PK, div.qBF1Pd, div.fontHeadlineSmall, div[role="article"]'
    );

    placeLinks.forEach((el) => {
      const card = el.closest('div.Nv2PK') || el.closest('div[role="article"]') || el.closest('div.THOPZb') || el.parentElement;
      if (!card) return;

      // Extract Business Name
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

      // Extract Maps URL
      let mapsUrl = '';
      const anchor = card.querySelector('a.hfpxzc, a[href*="/maps/place/"], a[href*="google.com/maps"]');
      if (anchor && anchor.href) {
        mapsUrl = anchor.href;
      }

      const identifier = mapsUrl || businessName.toLowerCase();
      if (seenIdentifiers.has(identifier)) return;

      // Extract Rating & Reviews
      let rating = 0;
      let reviewsCount = 0;
      const allCardText = card.innerText || '';

      const ratingEl = card.querySelector('span.MW4etd, span[aria-label*="stars"], span[aria-label*="star"], span[role="img"]');
      if (ratingEl) {
        const rText = ratingEl.innerText || ratingEl.getAttribute('aria-label') || '';
        const m = rText.match(/([0-5]\.[0-9]|[0-5])/);
        if (m) rating = parseFloat(m[1]);
      } else {
        const m = allCardText.match(/\b([1-5]\.[0-9])\b/);
        if (m) rating = parseFloat(m[1]);
      }

      const revEl = card.querySelector('span.UY7F9, span[aria-label*="reviews"], span[aria-label*="review"]');
      if (revEl) {
        const m = (revEl.innerText || revEl.getAttribute('aria-label') || '').match(/\(?([0-9,]+)\)?/);
        if (m) reviewsCount = parseInt(m[1].replace(/,/g, ''), 10);
      } else {
        const m = allCardText.match(/\(([0-9,]+)\)/);
        if (m) reviewsCount = parseInt(m[1].replace(/,/g, ''), 10);
      }

      // Extract Operational Status
      let operationalStatus = 'Open';
      if (allCardText.includes('Closed') || allCardText.includes('Permanently closed')) {
        operationalStatus = 'Closed';
      }

      // Extract Website URL from card
      let websiteUrl = '';
      const webLink = card.querySelector('a[data-value="Website"], a[aria-label*="Website"], a[aria-label*="website"], a.lcr4fd, a[href^="http"]:not([href*="google.com"])');
      if (webLink && webLink.href) {
        let rawUrl = webLink.href;
        if (rawUrl.includes('google.com/url?q=')) {
          const params = new URLSearchParams(rawUrl.split('?')[1]);
          rawUrl = params.get('q') || rawUrl;
        }
        websiteUrl = rawUrl;
      }

      // Extract Phone
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
        status: operationalStatus,
        maps_url: mapsUrl || window.location.href,
        website_url: websiteUrl || null,
        socials: null,
        email: null,
        scraped_at: new Date().toISOString(),
      };

      seenIdentifiers.add(identifier);
      seenIdentifiers.add(businessName.toLowerCase());
      scrapedLeads.push(lead);
      newlyFoundCount++;
    });

    return newlyFoundCount;
  }

  /**
   * Main auto-scroll loop
   */
  async function runScrapeLoop() {
    const container = getScrollContainer();
    let consecutiveNoNew = 0;

    console.log('[FetchPro] Starting scrape loop on container:', container);
    updateFloatingHUD('Extracting leads', scrapedLeads.length, true);

    extractLeadsFromDOM();
    chrome.storage.local.set({ leadflow_leads: scrapedLeads });

    while (isScraping && scrapedLeads.length < maxLeadsTarget) {
      const found = extractLeadsFromDOM();

      updateFloatingHUD('Extracting leads', scrapedLeads.length, true);
      chrome.storage.local.set({ leadflow_leads: scrapedLeads });

      chrome.runtime.sendMessage({
        type: 'SCRAPE_PROGRESS',
        count: scrapedLeads.length,
        maxLeads: maxLeadsTarget,
        latestLead: scrapedLeads[scrapedLeads.length - 1] || null,
      }).catch(() => {});

      if (found === 0) {
        consecutiveNoNew++;
      } else {
        consecutiveNoNew = 0;
      }

      if (consecutiveNoNew >= 7) {
        console.log('[FetchPro] Reached bottom of visible results.');
        break;
      }

      // Scroll container down
      if (container && container !== document.body) {
        container.scrollTop += 750;
        try {
          container.dispatchEvent(new WheelEvent('wheel', { deltaY: 750, bubbles: true }));
        } catch (e) {}
      } else {
        window.scrollBy({ top: 750, behavior: 'smooth' });
      }

      await new Promise((r) => setTimeout(r, 1200));
    }

    isScraping = false;
    extractLeadsFromDOM();
    chrome.storage.local.set({ leadflow_leads: scrapedLeads });
    updateFloatingHUD('Extraction complete', scrapedLeads.length, false);

    chrome.runtime.sendMessage({
      type: 'SCRAPE_COMPLETED',
      count: scrapedLeads.length,
      leads: scrapedLeads,
    }).catch(() => {});
  }

  /**
   * Message Listener
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      extractLeadsFromDOM();
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
      extractLeadsFromDOM();
      chrome.storage.local.set({ leadflow_leads: scrapedLeads });
      updateFloatingHUD('Scraped page & Web results', scrapedLeads.length, false);
      sendResponse({ status: 'OK', count: scrapedLeads.length, leads: scrapedLeads });
      return true;
    }

    if (message.type === 'START_SCRAPING') {
      if (isScraping) {
        sendResponse({ status: 'ALREADY_RUNNING', count: scrapedLeads.length });
        return true;
      }

      isScraping = true;
      maxLeadsTarget = message.maxLeads || 30;

      runScrapeLoop().catch((err) => {
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

  // Listen to place clicks to enrich leads with Web Results
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target && (target.closest('a.hfpxzc') || target.closest('div.Nv2PK') || target.closest('[role="article"]'))) {
      setTimeout(() => {
        extractSinglePlaceFromDOM();
        chrome.storage.local.set({ leadflow_leads: scrapedLeads });
      }, 1000);
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

  // Immediate initial pass
  setTimeout(() => {
    extractLeadsFromDOM();
    if (scrapedLeads.length > 0) {
      chrome.storage.local.set({ leadflow_leads: scrapedLeads });
      updateFloatingHUD('Found visible leads', scrapedLeads.length, false);
    }
  }, 1000);
})();
