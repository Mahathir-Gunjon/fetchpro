/**
 * FetchPro - Background Service Worker (Manifest V3)
 * Keeps connection channels healthy and handles background state
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[FetchPro] Extension installed and background service worker ready.');
});

// Central message dispatcher to prevent "Receiving end does not exist" errors
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ status: 'PONG', source: 'background' });
    return false;
  }

  // Forward scrape progress / completion if needed
  if (message.type === 'SCRAPE_PROGRESS' || message.type === 'SCRAPE_COMPLETED') {
    sendResponse({ received: true });
    return false;
  }

  return false;
});
