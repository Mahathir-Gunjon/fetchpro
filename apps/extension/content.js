/**
 * LeadFlow - Google Maps B2B Lead Scraper Content Script
 * Manifest V3 Compliant
 */

(function () {
  // Prevent duplicate script execution
  if (window.__leadflowInitialized) {
    return;
  }
  window.__leadflowInitialized = true;

  console.log('[LeadFlow] Content script active on Google Maps.');

  let isScraping = false;
  let scrapedLeads = [];
  let seenIdentifiers = new Set();
  let maxLeadsTarget = 50;
  let scrollInterval = null;
  let floatingBanner = null;

  /**
   * Helper to clean strings
   */
  function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Find the scrollable results feed on Google Maps
   */
  function getScrollContainer() {
    // Standard feed role
    const feed = document.querySelector('div[role="feed"]');
    if (feed) return feed;

    // Alternative container selectors used by Google Maps
    const ariaFeeds = document.querySelectorAll('div[aria-label*="Results for"], div[aria-label*="results for"]');
    for (const container of ariaFeeds) {
      if (container.scrollHeight > container.clientHeight) return container;
    }

    const scrollableDivs = document.querySelectorAll('div.m6QErb.DxyBCb.kA9KIf.dS8AEf');
    for (const div of scrollableDivs) {
      if (div.scrollHeight > div.clientHeight) return div;
    }

    return document.body;
  }

  /**
   * Create or update floating in-page scraping status banner
   */
  function updateFloatingBanner(statusText, count = 0, isRunning = false) {
    if (!floatingBanner) {
      floatingBanner = document.createElement('div');
      floatingBanner.id = 'leadflow-floating-hud';
      floatingBanner.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        background: rgba(15, 23, 42, 0.95);
        color: #f8fafc;
        border: 1px solid rgba(59, 130, 246, 0.4);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
        border-radius: 12px;
        padding: 12px 18px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
      `;
      document.body.appendChild(floatingBanner);
    }

    floatingBanner.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${
          isRunning ? '#10b981' : '#64748b'
        }; box-shadow:${isRunning ? '0 0 10px #10b981' : 'none'}; animation:${
      isRunning ? 'leadflow-pulse 1.5s infinite' : 'none'
    };"></span>
        <strong style="font-weight:600; color:#60a5fa;">LeadFlow</strong>
      </div>
      <div style="height:14px; width:1px; background:rgba(255,255,255,0.15);"></div>
      <div>${statusText}: <span style="font-weight:700; color:#38bdf8;">${count}</span> leads</div>
    `;

    if (!document.getElementById('leadflow-style-tag')) {
      const style = document.createElement('style');
      style.id = 'leadflow-style-tag';
      style.textContent = `
        @keyframes leadflow-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  function removeFloatingBanner() {
    if (floatingBanner && floatingBanner.parentNode) {
      floatingBanner.parentNode.removeChild(floatingBanner);
      floatingBanner = null;
    }
  }

  /**
   * Scrape currently visible cards in the results pane
   */
  function extractLeadsFromDOM() {
    const cards = document.querySelectorAll(
      'div[role="article"], div.Nv2PK, div.THOPZb, div.fontHeadlineSmall'
    );
    let newlyFoundCount = 0;

    cards.forEach((card) => {
      // Find root element if matched by sub-class
      const rootCard = card.closest('div.Nv2PK') || card.closest('div[role="article"]') || card;
      if (!rootCard) return;

      // Extract Business Name
      let businessName = '';
      const nameEl = rootCard.querySelector('.qBF1Pd, .fontHeadlineSmall, [class*="headline"], h2, div[aria-label]');
      if (nameEl) {
        businessName = cleanText(nameEl.innerText || nameEl.getAttribute('aria-label') || '');
      }

      // If missing name, check anchor
      if (!businessName) {
        const anchorEl = rootCard.querySelector('a.hfpxzc, a[href*="/maps/place/"]');
        if (anchorEl) {
          businessName = cleanText(anchorEl.getAttribute('aria-label') || '');
        }
      }

      if (!businessName || businessName.length < 2) return;

      // Extract Maps URL
      let mapsUrl = '';
      const mainLink = rootCard.querySelector('a.hfpxzc, a[href*="/maps/place/"], a[href*="google.com/maps"]');
      if (mainLink) {
        mapsUrl = mainLink.href;
      }

      // Unique identifier (Maps URL or Business Name)
      const identifier = mapsUrl || businessName.toLowerCase();
      if (seenIdentifiers.has(identifier)) {
        return;
      }

      // Extract Rating
      let rating = null;
      const ratingEl = rootCard.querySelector('span.MW4etd, span[aria-label*="stars"], span[aria-label*="star"]');
      if (ratingEl) {
        const ratingText = ratingEl.innerText || ratingEl.getAttribute('aria-label') || '';
        const match = ratingText.match(/([0-5]\.[0-9]|[0-5])/);
        if (match) {
          rating = parseFloat(match[1]);
        }
      }

      // Extract Reviews Count
      let reviewsCount = 0;
      const reviewsEl = rootCard.querySelector('span.UY7F9, span[aria-label*="reviews"], span[aria-label*="review"]');
      if (reviewsEl) {
        const reviewText = reviewsEl.innerText || reviewsEl.getAttribute('aria-label') || '';
        const match = reviewText.match(/\(?([0-9,]+)\)?/);
        if (match) {
          reviewsCount = parseInt(match[1].replace(/,/g, ''), 10);
        }
      }

      // Extract Operational Status (Open / Closed)
      let operationalStatus = 'Open';
      const allText = rootCard.innerText || '';
      if (allText.includes('Closed') || allText.includes('Permanently closed') || allText.includes('Temporarily closed')) {
        operationalStatus = 'Closed';
      } else if (allText.includes('Open 24 hours') || allText.includes('Open') || allText.includes('Opens')) {
        operationalStatus = 'Open';
      }

      // Extract Website URL
      let websiteUrl = '';
      const websiteLink = rootCard.querySelector(
        'a[data-value="Website"], a[aria-label*="Website"], a[aria-label*="website"], a.lcr4fd, a[href^="http"]:not([href*="google.com"])'
      );
      if (websiteLink && websiteLink.href) {
        // Clean out Google tracking redirect if present
        let rawUrl = websiteLink.href;
        if (rawUrl.includes('google.com/url?q=')) {
          const params = new URLSearchParams(rawUrl.split('?')[1]);
          rawUrl = params.get('q') || rawUrl;
        }
        websiteUrl = rawUrl;
      }

      // Extract Phone Number via regex in card text
      let phone = '';
      const phoneMatch = allText.match(/(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
      if (phoneMatch) {
        phone = cleanText(phoneMatch[0]);
      }

      // Add Lead
      const lead = {
        id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        business_name: businessName,
        phone: phone || null,
        rating: rating || 0,
        reviews_count: reviewsCount || 0,
        status: operationalStatus,
        maps_url: mapsUrl || window.location.href,
        website_url: websiteUrl || null,
        email: null,
        scraped_at: new Date().toISOString()
      };

      seenIdentifiers.add(identifier);
      scrapedLeads.push(lead);
      newlyFoundCount++;
    });

    return newlyFoundCount;
  }

  /**
   * Main auto-scrolling loop
   */
  async function runScrapeLoop() {
    const container = getScrollContainer();
    let consecutiveNoNewResults = 0;

    console.log('[LeadFlow] Starting scroll & scrape loop...', { container });
    updateFloatingBanner('Scraping in progress', scrapedLeads.length, true);

    while (isScraping && scrapedLeads.length < maxLeadsTarget) {
      const found = extractLeadsFromDOM();
      
      // Update UI and storage
      updateFloatingBanner('Scraping in progress', scrapedLeads.length, true);
      chrome.storage.local.set({ leadflow_leads: scrapedLeads });

      // Notify popup
      chrome.runtime.sendMessage({
        type: 'SCRAPE_PROGRESS',
        count: scrapedLeads.length,
        maxLeads: maxLeadsTarget,
        latestLead: scrapedLeads[scrapedLeads.length - 1] || null
      }).catch(() => {});

      if (found === 0) {
        consecutiveNoNewResults++;
      } else {
        consecutiveNoNewResults = 0;
      }

      // Check if end of list reached
      const endOfListEl = document.querySelector('span.HlvSq, div[class*="endOfList"], div[class*="fontHeadlineSmall"]:empty');
      if (endOfListEl && endOfListEl.innerText && endOfListEl.innerText.includes("You've reached the end")) {
        console.log('[LeadFlow] Reached end of Google Maps results.');
        break;
      }

      if (consecutiveNoNewResults >= 8) {
        console.log('[LeadFlow] No new items discovered after multiple scrolls.');
        break;
      }

      // Scroll container down
      if (container && container !== document.body) {
        container.scrollTop += 650;
      } else {
        window.scrollBy({ top: 650, behavior: 'smooth' });
      }

      // Yield time for lazy DOM load
      await new Promise((resolve) => setTimeout(resolve, 1400));
    }

    // Done scraping
    isScraping = false;
    extractLeadsFromDOM();
    chrome.storage.local.set({ leadflow_leads: scrapedLeads });
    updateFloatingBanner('Scraping finished', scrapedLeads.length, false);

    chrome.runtime.sendMessage({
      type: 'SCRAPE_COMPLETED',
      count: scrapedLeads.length,
      leads: scrapedLeads
    }).catch(() => {});

    console.log(`[LeadFlow] Completed scraping. Extracted ${scrapedLeads.length} leads.`);
  }

  /**
   * Listen for commands from Popup
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      sendResponse({
        status: 'READY',
        isMaps: window.location.href.includes('google.com/maps'),
        url: window.location.href,
        isScraping,
        count: scrapedLeads.length
      });
      return true;
    }

    if (message.type === 'START_SCRAPING') {
      if (isScraping) {
        sendResponse({ status: 'ALREADY_RUNNING', count: scrapedLeads.length });
        return true;
      }

      isScraping = true;
      maxLeadsTarget = message.maxLeads || 50;

      runScrapeLoop().catch((err) => {
        console.error('[LeadFlow] Scrape loop error:', err);
        isScraping = false;
        updateFloatingBanner('Error occurred', scrapedLeads.length, false);
      });

      sendResponse({ status: 'STARTED', maxLeads: maxLeadsTarget });
      return true;
    }

    if (message.type === 'STOP_SCRAPING') {
      isScraping = false;
      updateFloatingBanner('Stopped', scrapedLeads.length, false);
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
      removeFloatingBanner();
      sendResponse({ status: 'CLEARED' });
      return true;
    }

    return true;
  });

  // Restore saved leads on load
  chrome.storage.local.get(['leadflow_leads'], (res) => {
    if (res && Array.isArray(res.leadflow_leads) && res.leadflow_leads.length > 0) {
      scrapedLeads = res.leadflow_leads;
      scrapedLeads.forEach((lead) => {
        const id = lead.maps_url || lead.business_name.toLowerCase();
        seenIdentifiers.add(id);
      });
      updateFloatingBanner('Cached leads', scrapedLeads.length, false);
    }
  });
})();
