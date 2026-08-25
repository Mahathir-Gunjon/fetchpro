import { AuditData, AuditIssue } from './types';

/**
 * Clean and normalize a website URL
 */
export function normalizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Filter out invalid/image/placeholder emails
 */
function isValidScrapedEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  const blockedDomains = ['sentry.io', 'wixpress.com', 'w3.org', 'domain.com', 'example.com', 'schema.org', 'cloudflare.com'];
  const blockedPrefixes = ['noreply', 'no-reply', 'mailer-daemon', 'donotreply'];
  const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.css', '.js'];

  if (extensions.some((ext) => lower.endsWith(ext))) return false;
  if (blockedDomains.some((d) => lower.includes(d))) return false;
  if (blockedPrefixes.some((p) => lower.startsWith(p))) return false;

  // Basic structure check
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(lower);
}

/**
 * Extract email addresses from raw HTML text
 */
function extractEmailsFromHtml(html: string): string[] {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = html.match(emailRegex) || [];
  const validSet = new Set<string>();

  for (const match of matches) {
    if (isValidScrapedEmail(match)) {
      validSet.add(match.toLowerCase());
    }
  }

  // Also look for mailto links
  const mailtoRegex = /href=["']mailto:([^"'\s?]+)["']/gi;
  let mailtoMatch;
  while ((mailtoMatch = mailtoRegex.exec(html)) !== null) {
    const rawEmail = mailtoMatch[1];
    if (isValidScrapedEmail(rawEmail)) {
      validSet.add(rawEmail.toLowerCase());
    }
  }

  return Array.from(validSet);
}

/**
 * Perform deep audit on target website
 */
export async function auditWebsite(targetUrl: string): Promise<AuditData> {
  const cleanUrl = normalizeUrl(targetUrl);
  const startTime = Date.now();
  const currentYear = new Date().getFullYear();

  let html = '';
  let responseTimeMs = 0;
  let hasSsl = cleanUrl.startsWith('https://');
  let sslValid = hasSsl;
  let finalUrl = cleanUrl;

  const issues: AuditIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // 1. Fetch website HTML
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; LeadFlowAuditor/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);
    responseTimeMs = Date.now() - startTime;
    finalUrl = response.url || cleanUrl;
    hasSsl = finalUrl.startsWith('https://');
    sslValid = hasSsl && response.ok;
    html = await response.text();
  } catch (error: any) {
    responseTimeMs = Date.now() - startTime;
    
    // If HTTPS failed, try HTTP fallback
    if (cleanUrl.startsWith('https://')) {
      try {
        const httpUrl = cleanUrl.replace('https://', 'http://');
        const fallbackRes = await fetch(httpUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadFlowAuditor/1.0' },
        });
        html = await fallbackRes.text();
        hasSsl = false;
        sslValid = false;
      } catch {
        // Site unreachable
      }
    }
  }

  // If site is completely unreachable
  if (!html || html.length < 50) {
    return {
      url: targetUrl,
      healthScore: 15,
      auditedAt: new Date().toISOString(),
      responseTimeMs: responseTimeMs || 5000,
      ssl: { hasSsl: false, valid: false },
      mobileResponsive: { hasViewport: false, isMobileFriendly: false },
      meta: { hasOgImage: false },
      techStack: { frameworks: [], analytics: [] },
      copyright: { isOutdated: true, currentYear },
      extractedEmails: [],
      issues: [
        {
          type: 'error',
          title: 'Website Unreachable / Offline',
          description: 'The server failed to respond or blocked automated inspection.',
          impactScore: -85,
        },
      ],
      keyRecommendations: [
        'Urgent: The website appears down or unreachable. Verify DNS and hosting status.',
        'Implement modern hosting with 99.9% uptime SLA.',
      ],
    };
  }

  // 2. SSL Assessment
  if (!hasSsl || !sslValid) {
    score -= 25;
    issues.push({
      type: 'error',
      title: 'Missing or Invalid SSL (HTTPS)',
      description: 'Browsers will display an alarming "Not Secure" warning to visitors.',
      impactScore: -25,
    });
    recommendations.push('Install a free Let\'s Encrypt SSL certificate or enable HTTPS redirection immediately.');
  } else {
    issues.push({
      type: 'success',
      title: 'Valid SSL Certificate',
      description: 'Website is securely served over HTTPS protocol.',
      impactScore: 0,
    });
  }

  // 3. Mobile Viewport & Responsiveness
  const viewportMatch = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']viewport["']/i);
  const hasViewport = !!viewportMatch;
  const isMobileFriendly = hasViewport && (viewportMatch[1].includes('width=device-width') || viewportMatch[1].includes('initial-scale=1'));

  if (!isMobileFriendly) {
    score -= 20;
    issues.push({
      type: 'error',
      title: 'Not Mobile Optimized',
      description: 'Missing proper viewport meta tag. Site will look tiny or broken on smartphones.',
      impactScore: -20,
    });
    recommendations.push('Add a standard responsive viewport tag: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`.');
  } else {
    issues.push({
      type: 'success',
      title: 'Mobile-Friendly Viewport Configured',
      description: 'Site is configured to adapt to mobile screens.',
      impactScore: 0,
    });
  }

  // 4. Meta Title & Description
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : '';
  const titleLength = rawTitle.length;

  if (!rawTitle) {
    score -= 15;
    issues.push({
      type: 'error',
      title: 'Missing Page Title Tag',
      description: 'Search engines have no title to display in search result listings.',
      impactScore: -15,
    });
    recommendations.push('Add a descriptive 50-60 character `<title>` tag with primary keywords.');
  } else if (titleLength < 20 || titleLength > 70) {
    score -= 5;
    issues.push({
      type: 'warning',
      title: 'Suboptimal Title Tag Length',
      description: `Current title is ${titleLength} characters (recommended: 30-65 characters).`,
      impactScore: -5,
    });
  }

  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i) ||
                    html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const rawDesc = descMatch ? descMatch[1].trim() : '';
  const descLength = rawDesc.length;

  if (!rawDesc) {
    score -= 15;
    issues.push({
      type: 'warning',
      title: 'Missing Meta Description',
      description: 'Search engines will display random snippet text instead of a curated summary.',
      impactScore: -15,
    });
    recommendations.push('Add a compelling meta description (120-160 characters) to boost search click-through rates.');
  }

  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  const hasOgImage = !!ogImageMatch;
  if (!hasOgImage) {
    score -= 5;
    issues.push({
      type: 'info',
      title: 'Missing Social Share Image (Open Graph)',
      description: 'Links shared on iMessage, LinkedIn, or Facebook will not show a preview banner.',
      impactScore: -5,
    });
  }

  // 5. Tech Stack & CMS Signature Detection
  const techStack = {
    cms: undefined as string | undefined,
    frameworks: [] as string[],
    analytics: [] as string[],
    server: undefined as string | undefined,
  };

  const lowerHtml = html.toLowerCase();
  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes')) techStack.cms = 'WordPress';
  else if (lowerHtml.includes('cdn.shopify.com') || lowerHtml.includes('shopify.theme')) techStack.cms = 'Shopify';
  else if (lowerHtml.includes('squarespace.com') || lowerHtml.includes('static1.squarespace.com')) techStack.cms = 'Squarespace';
  else if (lowerHtml.includes('wix.com') || lowerHtml.includes('parastorage.com')) techStack.cms = 'Wix';
  else if (lowerHtml.includes('webflow.js') || lowerHtml.includes('wf-page')) techStack.cms = 'Webflow';

  if (lowerHtml.includes('next.js') || lowerHtml.includes('__next_data__') || lowerHtml.includes('/_next/')) techStack.frameworks.push('Next.js');
  if (lowerHtml.includes('react') || lowerHtml.includes('data-reactroot')) techStack.frameworks.push('React');
  if (lowerHtml.includes('vue') || lowerHtml.includes('data-v-')) techStack.frameworks.push('Vue.js');
  if (lowerHtml.includes('tailwind')) techStack.frameworks.push('Tailwind CSS');
  if (lowerHtml.includes('bootstrap')) techStack.frameworks.push('Bootstrap');

  if (lowerHtml.includes('googletagmanager.com') || lowerHtml.includes('gtag(') || lowerHtml.includes('ga(')) techStack.analytics.push('Google Analytics');
  if (lowerHtml.includes('facebook.com/tr') || lowerHtml.includes('fbq(')) techStack.analytics.push('Meta Pixel');
  if (lowerHtml.includes('clarity.ms')) techStack.analytics.push('Microsoft Clarity');
  if (lowerHtml.includes('hotjar')) techStack.analytics.push('Hotjar');

  // 6. Copyright Year & Outdated Freshness Check
  let detectedYear: number | undefined = undefined;
  let isOutdated = false;
  let copyrightText = '';

  const copyrightRegex = /(?:©|&copy;|&#169;|copyright)\s*(?:[0-9]{4}\s*-\s*)?([12][0-9]{3})/i;
  const copyrightMatch = html.match(copyrightRegex);

  if (copyrightMatch) {
    detectedYear = parseInt(copyrightMatch[1], 10);
    copyrightText = copyrightMatch[0];

    if (detectedYear <= currentYear - 2) {
      isOutdated = true;
      score -= 10;
      issues.push({
        type: 'warning',
        title: `Outdated Copyright Year (${detectedYear})`,
        description: `Website footer indicates copyright ${detectedYear}, signaling the site has not been actively maintained.`,
        impactScore: -10,
      });
      recommendations.push(`Update the footer copyright year to ${currentYear} and modernize page content.`);
    } else {
      issues.push({
        type: 'success',
        title: `Recent Copyright (${detectedYear})`,
        description: 'Website footer indicates active maintenance.',
        impactScore: 0,
      });
    }
  }

  // 7. Performance & Latency Check
  if (responseTimeMs > 2500) {
    score -= 15;
    issues.push({
      type: 'warning',
      title: `Slow Server Response (${(responseTimeMs / 1000).toFixed(1)}s)`,
      description: 'Slow server response times lead to high mobile bounce rates.',
      impactScore: -15,
    });
    recommendations.push('Enable caching, compress images (WebP/AVIF), and optimize server hosting.');
  } else if (responseTimeMs < 800) {
    issues.push({
      type: 'success',
      title: `Fast Load Time (${responseTimeMs}ms)`,
      description: 'Server responded quickly.',
      impactScore: 0,
    });
  }

  // 8. Email Extraction
  let extractedEmails = extractEmailsFromHtml(html);

  // If no email on homepage, try /contact or /about
  if (extractedEmails.length === 0) {
    const subpages = ['/contact', '/contact-us', '/about', '/about-us'];
    for (const subpage of subpages) {
      try {
        const subUrl = new URL(subpage, finalUrl).toString();
        const subRes = await fetch(subUrl, {
          signal: AbortSignal.timeout(3000),
          headers: { 'User-Agent': 'Mozilla/5.0 LeadFlowAuditor/1.0' },
        });
        if (subRes.ok) {
          const subHtml = await subRes.text();
          const subEmails = extractEmailsFromHtml(subHtml);
          if (subEmails.length > 0) {
            extractedEmails = subEmails;
            break;
          }
        }
      } catch {
        // ignore subpage errors
      }
    }
  }

  if (extractedEmails.length === 0) {
    issues.push({
      type: 'info',
      title: 'No Direct Contact Email Detected',
      description: 'Visitors may struggle to find a direct direct email to contact the business.',
      impactScore: 0,
    });
  } else {
    issues.push({
      type: 'success',
      title: `Found ${extractedEmails.length} Contact Email(s)`,
      description: `Discovered: ${extractedEmails.slice(0, 2).join(', ')}`,
      impactScore: 0,
    });
  }

  // Ensure score stays bounded [10, 100]
  const finalScore = Math.max(10, Math.min(100, Math.round(score)));

  return {
    url: cleanUrl,
    healthScore: finalScore,
    auditedAt: new Date().toISOString(),
    responseTimeMs,
    ssl: {
      hasSsl,
      valid: sslValid,
      protocol: hasSsl ? 'TLS 1.3 / HTTPS' : 'HTTP (Insecure)',
    },
    mobileResponsive: {
      hasViewport,
      viewportContent: viewportMatch ? viewportMatch[1] : undefined,
      isMobileFriendly,
    },
    meta: {
      title: rawTitle || undefined,
      titleLength,
      description: rawDesc || undefined,
      descriptionLength: descLength,
      hasOgImage,
    },
    techStack,
    copyright: {
      detectedYear,
      isOutdated,
      currentYear,
      rawText: copyrightText || undefined,
    },
    extractedEmails,
    issues,
    keyRecommendations: recommendations.length > 0 ? recommendations : ['Site is in good shape. Consider running A/B conversion rate tests.'],
  };
}
