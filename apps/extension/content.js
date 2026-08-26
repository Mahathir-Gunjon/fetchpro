/**
 * FetchPro - High-Precision Google Maps 2-Tier Lead & Web Results Scraper
 *
 * Implements:
 * 1. Deep scroll to force lazy loading (`ensureWebResultsRendered`)
 * 2. 2-Tier Website & Social Footprint Extraction (`extractAllBusinessLinks`)
 *    - Tier 1: Official GMB Top Action Website Button
 *    - Tier 2: Bottom "Web results" list & nested anchors
 * 3. Robust Data Normalization & In-Page HUD
 */

(function () {
  console.log('[FetchPro] 2-Tier GMB & Web Results Scraper loaded on:', window.location.href);

  let isScraping = false;
  let scrapedLeads = [];
  let seenIdentifiers = new Set();
  let maxLeadsTarget = 100;
  let floatingBanner = null;

  function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Target the active detail container / main pane
   */
  function getActiveDetailPane() {
    const containers = document.querySelectorAll(
      'div[role="main"] div.m6QErb, div[tabindex="-1"] div.m6QErb, div.m6QErb.DxyBCb, div.m6QErb'
    );
    for (const el of containers) {
      if (el.scrollHeight > el.clientHeight && el.clientHeight > 250) {
        return el;
      }
    }
    return document.querySelector('div[role="main"]') || document.querySelector('div[tabindex="-1"]') || document.body;
  }

  /**
   * Find Search Results Feed Container
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
   * 1. Target and scroll the active detail container to the absolute bottom
   */
  async function ensureWebResultsRendered(pane) {
    if (!pane) return;
    let prevHeight = 0;
    for (let step = 0; step < 5; step++) {
      try {
        pane.scrollTop = pane.scrollHeight;
        pane.dispatchEvent(new WheelEvent('wheel', { deltaY: 800, bubbles: true }));
      } catch (e) {
        pane.scrollTop = pane.scrollHeight;
      }
      await new Promise((res) => setTimeout(res, 500));
      if (pane.scrollHeight === prevHeight && step >= 2) break;
      prevHeight = pane.scrollHeight;
    }
    await new Promise((res) => setTimeout(res, 700)); // wait for dynamic DOM nodes
  }

  /**
   * 2. Extract official GMB Button AND Web Results links (2-Tier Extraction)
   */
  function extractAllBusinessLinks(pane) {
    const root = pane || document;

    // Tier 1: Check official Top Action Website Button
    const officialWebsiteBtn = root.querySelector(
      'a[data-item-id="authority"], a[aria-label*="Website"], a[aria-label*="website"], a[data-tooltip*="website"]'
    );
    let primaryWebsite = null;
    if (officialWebsiteBtn) {
      let rawHref = officialWebsiteBtn.getAttribute('href') || officialWebsiteBtn.href || '';
      if (rawHref.includes('google.com/url?q=') || rawHref.startsWith('/url?q=')) {
        const match = rawHref.match(/google\.com\/url\?q=([^&]+)/) || rawHref.match(/\/url\?q=([^&]+)/);
        if (match && match[1]) {
          try {
            rawHref = decodeURIComponent(match[1]);
          } catch (e) {
            rawHref = match[1];
          }
        }
      }
      if (rawHref && !rawHref.includes('google.com') && !rawHref.includes('gstatic.com')) {
        primaryWebsite = rawHref;
      }
    }

    // Tier 2: Extract ALL links from the pane (including "Web results" cards)
    const allAnchors = Array.from(root.querySelectorAll('a[href]'));

    const socialProfiles = {
      facebook: null,
      instagram: null,
      yelp: null,
      linkedin: null,
      twitter_x: null,
      youtube: null,
      mapquest: null,
      yellowpages: null,
      tiktok: null,
      other_directories: [],
    };

    let fallbackWebsite = null;
    const web_results_links = [];

    allAnchors.forEach((a) => {
      let href = a.getAttribute('href') || a.href || '';

      // Unmask Google Redirects
      if (href.includes('google.com/url?q=') || href.startsWith('/url?q=')) {
        const match = href.match(/google\.com\/url\?q=([^&]+)/) || href.match(/\/url\?q=([^&]+)/);
        if (match && match[1]) {
          try {
            href = decodeURIComponent(match[1]);
          } catch (e) {
            href = match[1];
          }
        }
      }

      if (
        !href ||
        href.startsWith('/') ||
        href.startsWith('#') ||
        href.includes('google.com') ||
        href.includes('gstatic.com') ||
        href.includes('googleadservices.com') ||
        href.includes('maps.google') ||
        href.includes('accounts.google')
      ) {
        return;
      }

      const lower = href.toLowerCase();
      const linkText = cleanText(a.innerText || a.getAttribute('aria-label') || '');

      // Categorize Links
      if (lower.includes('facebook.com') && !lower.includes('/sharer')) {
        if (!socialProfiles.facebook) socialProfiles.facebook = href;
        web_results_links.push({ type: 'facebook', url: href, title: linkText });
      } else if (lower.includes('instagram.com') && !lower.includes('/p/')) {
        if (!socialProfiles.instagram) socialProfiles.instagram = href;
        web_results_links.push({ type: 'instagram', url: href, title: linkText });
      } else if (lower.includes('yelp.com/biz/') || lower.includes('yelp.com')) {
        if (!socialProfiles.yelp) socialProfiles.yelp = href;
        web_results_links.push({ type: 'yelp', url: href, title: linkText });
      } else if (lower.includes('linkedin.com/company/') || lower.includes('linkedin.com/in/')) {
        if (!socialProfiles.linkedin) socialProfiles.linkedin = href;
        web_results_links.push({ type: 'linkedin', url: href, title: linkText });
      } else if (lower.includes('twitter.com') || lower.includes('x.com')) {
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
        // If it's not a known social/directory platform, it is a business website candidate
        if (!fallbackWebsite && !primaryWebsite) {
          fallbackWebsite = href;
        }
        web_results_links.push({ type: 'website', url: href, title: linkText });
      }
    });

    // Final Resolved Website: Prefer GMB button, fallback to Web Results candidate
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
        <span>${statusText}: <span style="font-weight:700; color:#38bdf8;">${count}</span> leads</span>
        ${activeName ? `<div style="font-size:11px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis;">👉 ${activeName}</div>` : ''}
      </div>
    `;
  }

  /**
   * Deep Inspection of Open Business Profile Card
   */
  async function deepInspectActiveProfile() {
    const pane = getActiveDetailPane();

    // 1. Scroll active detail container to absolute bottom and wait for Web results
    await ensureWebResultsRendered(pane);

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
    } = extractAllBusinessLinks(pane);

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

    seenIdentifiers.add(currentMapsUrl);
    seenIdentifiers.add(businessName.toLowerCase());
    scrapedLeads.push(lead);
    return 1;
  }

  /**
   * Fast Feed Extractor
   */
  function extractFeedCards() {
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
        if (rawUrl.includes('google.com/url?q=') || rawUrl.startsWith('/url?q=')) {
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
        gmb_website_url: websiteUrl || null,
        website_url: websiteUrl || null,
        discovered_website: null,
        website_source: websiteUrl ? 'GMB_BUTTON' : 'NONE',
        web_results_links: null,
        social_profiles: null,
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
   * Main Scraping Loop
   */
  async function runScrapeLoop() {
    const feedContainer = getSearchFeedContainer();
    let processedCards = 0;
    let consecutiveNoNew = 0;

    console.log('[FetchPro] Starting GMB Deep Inspection loop with 2-Tier Extraction...');
    updateFloatingHUD('Starting Deep Crawl...', scrapedLeads.length, true);

    while (isScraping && scrapedLeads.length < maxLeadsTarget) {
      const cards = Array.from(document.querySelectorAll('a.hfpxzc, div.Nv2PK a[href*="/maps/place/"]'));

      if (cards.length === 0) {
        extractFeedCards();
        await deepInspectActiveProfile();
      }

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
          chrome.storage.local.set({ leadflow_leads: scrapedLeads });

          chrome.runtime
            .sendMessage({
              type: 'SCRAPE_PROGRESS',
              count: scrapedLeads.length,
              maxLeads: maxLeadsTarget,
              latestLead: latest || null,
            })
            .catch(() => {});
        } catch (cardErr) {
          console.warn('[FetchPro] Card crawl error:', cardErr);
        }
      }

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

      const newlyFound = extractFeedCards();
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
    updateFloatingHUD('Crawl Complete', scrapedLeads.length, false);

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
      extractFeedCards();
      deepInspectActiveProfile().then(() => {
        chrome.storage.local.set({ leadflow_leads: scrapedLeads });
        updateFloatingHUD('Extracted Profile & Web results', scrapedLeads.length, false);
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
      maxLeadsTarget = message.maxLeads || 100;

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

  // Manual click listener
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (
      target &&
      (target.closest('a.hfpxzc') ||
        target.closest('div.Nv2PK') ||
        target.closest('[role="article"]'))
    ) {
      setTimeout(() => {
        deepInspectActiveProfile().then(() => {
          chrome.storage.local.set({ leadflow_leads: scrapedLeads });
        });
      }, 1250);
    }
  });

  // Restore stored leads
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

  // Initial pass
  setTimeout(() => {
    extractFeedCards();
    deepInspectActiveProfile().then(() => {
      if (scrapedLeads.length > 0) {
        chrome.storage.local.set({ leadflow_leads: scrapedLeads });
        updateFloatingHUD('Ready', scrapedLeads.length, false);
      }
    });
  }, 1200);
})();
