/**
 * FetchPro - High-Precision Google Maps Profile & Web Results Deep Scraper
 *
 * Strictly separates the Scraping Layer from the Backend Audit & Qualification Engine.
 *
 * Sequential Deep Inspection:
 * 1. Overview Section: Name, Rating, Reviews Count, Category, Phone, Address, Official GMB Website button
 * 2. About & Details metadata: Opening hours, business description
 * 3. Web Results Link Harvester: Discovered candidate websites, Facebook, Instagram, Yelp, LinkedIn, Twitter/X, TikTok, MapQuest, YellowPages
 */

(function () {
  console.log('[FetchPro] High-Precision GMB Deep Scraper active on:', window.location.href);

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
   * Find main search results feed container
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
   * Find open Place Details pane container
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
   * Harvest "Web results" bottom list & classify links into websites, directories, and social profiles
   */
  function harvestWebResultsAndSocials(rootEl) {
    const root = rootEl || document;
    const web_results_links = [];
    const social_profiles = {
      facebook: null,
      instagram: null,
      yelp: null,
      linkedin: null,
      twitter_x: null,
      youtube: null,
      tiktok: null,
      mapquest: null,
      yellowpages: null,
    };
    let discovered_website = null;

    const allLinks = root.querySelectorAll('a[href^="http"], a[href^="/url?q="]');

    allLinks.forEach((a) => {
      let rawHref = a.href || a.getAttribute('href');
      if (!rawHref) return;

      // Handle Google redirect wrappers
      if (rawHref.includes('google.com/url?q=') || rawHref.startsWith('/url?q=')) {
        try {
          const urlParams = new URLSearchParams(rawHref.split('?')[1]);
          const target = urlParams.get('q');
          if (target) rawHref = target;
        } catch (e) {}
      }

      const cleanLower = rawHref.toLowerCase();
      const linkText = cleanText(a.innerText || a.getAttribute('aria-label') || '');

      // Skip internal Google and tracking URLs
      if (
        cleanLower.includes('google.com') ||
        cleanLower.includes('gstatic.com') ||
        cleanLower.includes('googleadservices.com') ||
        cleanLower.includes('maps.google') ||
        cleanLower.includes('accounts.google')
      ) {
        return;
      }

      // Classify social profiles & directory listings
      if (cleanLower.includes('facebook.com') && !cleanLower.includes('/sharer')) {
        if (!social_profiles.facebook) social_profiles.facebook = rawHref;
        web_results_links.push({ type: 'facebook', url: rawHref, title: linkText });
      } else if (cleanLower.includes('instagram.com') && !cleanLower.includes('/p/')) {
        if (!social_profiles.instagram) social_profiles.instagram = rawHref;
        web_results_links.push({ type: 'instagram', url: rawHref, title: linkText });
      } else if (cleanLower.includes('yelp.com/biz/')) {
        if (!social_profiles.yelp) social_profiles.yelp = rawHref;
        web_results_links.push({ type: 'yelp', url: rawHref, title: linkText });
      } else if (cleanLower.includes('tiktok.com/@')) {
        if (!social_profiles.tiktok) social_profiles.tiktok = rawHref;
        web_results_links.push({ type: 'tiktok', url: rawHref, title: linkText });
      } else if (cleanLower.includes('linkedin.com/company/') || cleanLower.includes('linkedin.com/in/')) {
        if (!social_profiles.linkedin) social_profiles.linkedin = rawHref;
        web_results_links.push({ type: 'linkedin', url: rawHref, title: linkText });
      } else if (cleanLower.includes('twitter.com/') || cleanLower.includes('x.com/')) {
        if (!social_profiles.twitter_x) social_profiles.twitter_x = rawHref;
        web_results_links.push({ type: 'twitter_x', url: rawHref, title: linkText });
      } else if (cleanLower.includes('youtube.com/c/') || cleanLower.includes('youtube.com/@') || cleanLower.includes('youtube.com/channel/')) {
        if (!social_profiles.youtube) social_profiles.youtube = rawHref;
        web_results_links.push({ type: 'youtube', url: rawHref, title: linkText });
      } else if (cleanLower.includes('mapquest.com')) {
        if (!social_profiles.mapquest) social_profiles.mapquest = rawHref;
        web_results_links.push({ type: 'mapquest', url: rawHref, title: linkText });
      } else if (cleanLower.includes('yellowpages.com')) {
        if (!social_profiles.yellowpages) social_profiles.yellowpages = rawHref;
        web_results_links.push({ type: 'directory', url: rawHref, title: linkText });
      } else if (
        cleanLower.includes('bbb.org') ||
        cleanLower.includes('angi.com') ||
        cleanLower.includes('homeadvisor.com') ||
        cleanLower.includes('tripadvisor.com') ||
        cleanLower.includes('thumbtack.com') ||
        cleanLower.includes('houzz.com')
      ) {
        web_results_links.push({ type: 'directory', url: rawHref, title: linkText });
      } else {
        // Discovered candidate direct website
        if (!discovered_website) {
          discovered_website = rawHref;
        }
        web_results_links.push({ type: 'website', url: rawHref, title: linkText });
      }
    });

    return { web_results_links, social_profiles, discovered_website };
  }

  /**
   * Deep Crawl of the currently selected place profile
   */
  async function deepCrawlSelectedPlace() {
    const detailPane = getPlaceDetailsPane();

    // 1. Smoothly scroll the detail pane to the bottom to force lazy-loaded "Web results"
    if (detailPane) {
      try {
        detailPane.scrollTo({ top: detailPane.scrollHeight, behavior: 'smooth' });
      } catch (e) {
        detailPane.scrollTop = detailPane.scrollHeight;
      }
      // Wait 1.0s for lazy-loaded Web results list and dynamic DOM nodes
      await new Promise((r) => setTimeout(r, 1000));
    }

    // 2. Business Name
    const nameEl = document.querySelector(
      'h1.DUwDvf, [class*="header-title-title"], div.x3AX1-LfntMc-header-title-title, h1'
    );
    if (!nameEl || !nameEl.innerText) return 0;

    const businessName = cleanText(nameEl.innerText);
    if (!businessName || businessName.length < 2 || businessName.includes('Search this area')) return 0;

    const currentMapsUrl = window.location.href;

    // 3. Overall Rating & Reviews Count
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

    // 7. Opening Hours / Operational Status
    let openingHours = '';
    const hoursEl = document.querySelector('div.t39EBf, span.ZDu9vd, div[aria-label*="hours"]');
    if (hoursEl) {
      openingHours = cleanText(hoursEl.innerText || hoursEl.getAttribute('aria-label') || '');
    }

    // 8. Business Description
    let description = '';
    const descEl = document.querySelector('div.PYvSYb, div.m6QErb div[aria-label*="About"]');
    if (descEl) {
      description = cleanText(descEl.innerText || '');
    }

    // 9. Official GMB Website Button Link
    let gmb_website_url = null;
    const webBtn = document.querySelector(
      'a[data-item-id="authority"], a[aria-label*="Website"], a[aria-label*="website"], a[data-tooltip*="website"]'
    );
    if (webBtn && webBtn.href) {
      let raw = webBtn.href;
      if (raw.includes('google.com/url?q=') || raw.startsWith('/url?q=')) {
        try {
          const p = new URLSearchParams(raw.split('?')[1]);
          raw = p.get('q') || raw;
        } catch (e) {}
      }
      gmb_website_url = raw;
    }

    // 10. Harvest Web Results & Social Media Profiles
    const { web_results_links, social_profiles, discovered_website } = harvestWebResultsAndSocials(detailPane || document);

    const finalWebsiteUrl = gmb_website_url || discovered_website || null;

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
      gmb_website_url: gmb_website_url,
      website_url: finalWebsiteUrl,
      discovered_website: discovered_website,
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
        website_url: scrapedLeads[existingIndex].website_url || finalWebsiteUrl,
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
   * Fast feed extractor (grabs feed cards before deep profile inspection)
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
   * Master Scraper Loop:
   * Sequential Deep Inspection:
   * 1. Clicks card, waits >= 1.2s for detail pane to render.
   * 2. Extracts core data & smooth scrolls detail pane to bottom (waiting 1.0s for Web results).
   * 3. Harvests URLs, social profiles, and updates HUD.
   */
  async function runScrapeLoop() {
    const feedContainer = getSearchFeedContainer();
    let processedCards = 0;
    let consecutiveNoNew = 0;

    console.log('[FetchPro] Starting GMB Deep Crawl loop...');
    updateFloatingHUD('Starting Deep Crawl...', scrapedLeads.length, true);

    while (isScraping && scrapedLeads.length < maxLeadsTarget) {
      const cards = Array.from(document.querySelectorAll('a.hfpxzc, div.Nv2PK a[href*="/maps/place/"]'));

      if (cards.length === 0) {
        extractQuickFeedFromDOM();
        await deepCrawlSelectedPlace();
      }

      // Iterate through visible cards
      for (let i = processedCards; i < cards.length && isScraping; i++) {
        if (scrapedLeads.length >= maxLeadsTarget) break;

        const cardAnchor = cards[i];
        processedCards = i + 1;

        try {
          const cardName = cleanText(cardAnchor.getAttribute('aria-label') || '');
          updateFloatingHUD('Inspecting Profile', scrapedLeads.length, true, cardName);

          // 1. Click card to open overview & details and wait at least 1.2s
          cardAnchor.click();
          await new Promise((r) => setTimeout(r, 1250));

          // 2. Deep crawl place & smooth scroll detail pane for Web results (with 1.0s wait)
          await deepCrawlSelectedPlace();

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
      extractQuickFeedFromDOM();
      deepCrawlSelectedPlace().then(() => {
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
        deepCrawlSelectedPlace().then(() => {
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
    extractQuickFeedFromDOM();
    deepCrawlSelectedPlace().then(() => {
      if (scrapedLeads.length > 0) {
        chrome.storage.local.set({ leadflow_leads: scrapedLeads });
        updateFloatingHUD('Ready', scrapedLeads.length, false);
      }
    });
  }, 1200);
})();
