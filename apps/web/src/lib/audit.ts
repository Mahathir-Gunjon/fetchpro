import { AuditData, AuditIssue, SocialLinks } from './types';

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
  const blockedDomains = ['sentry.io', 'wixpress.com', 'w3.org', 'domain.com', 'example.com', 'schema.org', 'cloudflare.com', 'googleapis.com'];
  const blockedPrefixes = ['noreply', 'no-reply', 'mailer-daemon', 'donotreply', 'privacy', 'abuse'];
  const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.css', '.js', '.woff'];

  if (extensions.some((ext) => lower.endsWith(ext))) return false;
  if (blockedDomains.some((d) => lower.includes(d))) return false;
  if (blockedPrefixes.some((p) => lower.startsWith(p))) return false;

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
 * Extract social media profile links
 */
function extractSocialProfiles(html: string): SocialLinks {
  const socials: SocialLinks = {
    facebook: null,
    instagram: null,
    linkedin: null,
    twitter: null,
    youtube: null,
    tiktok: null,
  };

  const linkRegex = /href=["'](https?:\/\/[^"'\s]+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const lower = url.toLowerCase();

    if (!socials.facebook && lower.includes('facebook.com/') && !lower.includes('/sharer')) {
      socials.facebook = url;
    } else if (!socials.instagram && lower.includes('instagram.com/') && !lower.includes('/p/')) {
      socials.instagram = url;
    } else if (!socials.linkedin && lower.includes('linkedin.com/company/') || (!socials.linkedin && lower.includes('linkedin.com/in/'))) {
      socials.linkedin = url;
    } else if (!socials.twitter && (lower.includes('twitter.com/') || lower.includes('x.com/')) && !lower.includes('/intent')) {
      socials.twitter = url;
    } else if (!socials.youtube && (lower.includes('youtube.com/c/') || lower.includes('youtube.com/@') || lower.includes('youtube.com/channel/'))) {
      socials.youtube = url;
    } else if (!socials.tiktok && lower.includes('tiktok.com/@')) {
      socials.tiktok = url;
    }
  }

  return socials;
}

/**
 * Perform deterministic, high-speed audit on target website
 */
export async function auditWebsite(
  targetUrl: string,
  options?: { unlinkedGmbWebsite?: boolean }
): Promise<AuditData> {
  const cleanUrl = normalizeUrl(targetUrl);
  const startTime = Date.now();
  const currentYear = new Date().getFullYear();
  const unlinkedGmbWebsite = Boolean(options?.unlinkedGmbWebsite);

  let html = '';
  let responseTimeMs = 0;
  let hasSsl = cleanUrl.startsWith('https://');
  let sslValid = hasSsl;
  let finalUrl = cleanUrl;

  const issues: AuditIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // If website was found in Web Results but not on primary GMB button
  if (unlinkedGmbWebsite) {
    score -= 15;
    issues.push({
      type: 'error',
      title: 'Website Not Linked on Google Maps Profile',
      description: 'The business owns this website, but it is NOT linked to their primary Google Business listing (no "Website" button). Customers searching on Google Maps cannot click through to book.',
      impactScore: -15,
    });
    recommendations.push('Add your website URL to your Google Business Profile to capture mobile search booking traffic.');
  }

  // 1. Fetch website HTML with fast 4s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; FetchProAuditor/1.0)',
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
    if (cleanUrl.startsWith('https://')) {
      try {
        const httpUrl = cleanUrl.replace('https://', 'http://');
        const fallbackRes = await fetch(httpUrl, {
          signal: AbortSignal.timeout(3000),
          headers: { 'User-Agent': 'Mozilla/5.0 FetchProAuditor/1.0' },
        });
        html = await fallbackRes.text();
        hasSsl = false;
        sslValid = false;
      } catch {}
    }
  }

  // If site is completely unreachable
  if (!html || html.length < 50) {
    return {
      url: targetUrl,
      healthScore: 15,
      auditedAt: new Date().toISOString(),
      responseTimeMs: responseTimeMs || 4000,
      unlinkedGmbWebsite,
      ssl: { hasSsl: false, valid: false },
      mobileResponsive: { hasViewport: false, isMobileFriendly: false },
      meta: { hasOgImage: false },
      techStack: { frameworks: [], analytics: [] },
      copyright: { isOutdated: true, currentYear },
      extractedEmails: [],
      socials: {},
      issues: [
        {
          type: 'error',
          title: 'Website Inaccessible / Offline',
          description: 'Server failed to respond or blocked automated inspection.',
          impactScore: -85,
        },
      ],
      keyRecommendations: [
        'Urgent: The domain appears offline or unreachable. High opportunity to pitch reliable hosting and a modern rebuild.',
      ],
    };
  }

  // 2. SSL Assessment (Deterministic deduction: -25)
  if (!hasSsl || !sslValid) {
    score -= 25;
    issues.push({
      type: 'error',
      title: 'Missing or Insecure SSL Certificate',
      description: 'Browsers warn users with "Not Secure", causing immediate visitor abandonment.',
      impactScore: -25,
    });
    recommendations.push('Install an SSL certificate (HTTPS) and enforce automatic SSL redirects.');
  } else {
    issues.push({
      type: 'success',
      title: 'Valid SSL Certificate (HTTPS)',
      description: 'Site communication is encrypted and secure.',
      impactScore: 0,
    });
  }

  // 3. Mobile Viewport & Responsiveness (Deterministic deduction: -20)
  const viewportMatch = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']viewport["']/i);
  const hasViewport = !!viewportMatch;
  const isMobileFriendly = hasViewport && (viewportMatch[1].includes('width=device-width') || viewportMatch[1].includes('initial-scale=1'));

  if (!isMobileFriendly) {
    score -= 20;
    issues.push({
      type: 'error',
      title: 'Missing Mobile Viewport Tag',
      description: 'Page renders zoomed out on smartphones, severely hurting mobile conversion.',
      impactScore: -20,
    });
    recommendations.push('Add a responsive mobile viewport tag and optimize for smartphone view.');
  } else {
    issues.push({
      type: 'success',
      title: 'Mobile-Optimized Viewport',
      description: 'Configured for responsive layout on all screen sizes.',
      impactScore: 0,
    });
  }

  // 4. Meta Title & Description (Deterministic deduction: up to -20)
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : '';
  const titleLength = rawTitle.length;

  if (!rawTitle) {
    score -= 15;
    issues.push({
      type: 'error',
      title: 'Missing Title Tag',
      description: 'No <title> tag found. Search engines cannot index page correctly.',
      impactScore: -15,
    });
    recommendations.push('Add an SEO-optimized <title> tag (50-60 characters).');
  } else if (titleLength < 15 || titleLength > 75) {
    score -= 5;
    issues.push({
      type: 'warning',
      title: 'Suboptimal Title Tag Length',
      description: `Title is ${titleLength} characters (recommended: 30-65).`,
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
      description: 'Search engines generate random text snippet instead of a compelling pitch.',
      impactScore: -15,
    });
    recommendations.push('Add an engaging 130-160 character meta description.');
  }

  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  const hasOgImage = !!ogImageMatch;
  if (!hasOgImage) {
    score -= 5;
    issues.push({
      type: 'info',
      title: 'Missing Social Share Preview Card (og:image)',
      description: 'Sharing links on iMessage, Facebook, or LinkedIn shows no visual preview.',
      impactScore: -5,
    });
  }

  // 5. Tech Stack Clues
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
  if (lowerHtml.includes('tailwind')) techStack.frameworks.push('Tailwind CSS');
  if (lowerHtml.includes('bootstrap')) techStack.frameworks.push('Bootstrap');

  if (lowerHtml.includes('googletagmanager.com') || lowerHtml.includes('gtag(') || lowerHtml.includes('ga(')) techStack.analytics.push('Google Analytics');
  if (lowerHtml.includes('facebook.com/tr') || lowerHtml.includes('fbq(')) techStack.analytics.push('Meta Pixel');

  // 6. Copyright Year
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
        title: `Outdated Copyright (${detectedYear})`,
        description: `Footer shows copyright ${detectedYear}, indicating the website is neglected.`,
        impactScore: -10,
      });
      recommendations.push(`Update the footer copyright year to ${currentYear} and refresh dated content.`);
    } else {
      issues.push({
        type: 'success',
        title: `Active Maintenance (${detectedYear})`,
        description: 'Footer copyright indicates modern maintenance.',
        impactScore: 0,
      });
    }
  }

  // 7. Server Speed
  if (responseTimeMs > 2500) {
    score -= 10;
    issues.push({
      type: 'warning',
      title: `Slow Response Speed (${(responseTimeMs / 1000).toFixed(1)}s)`,
      description: 'Slow server response time increases visitor bounce rate.',
      impactScore: -10,
    });
  }

  // 8. Emails & Social Profiles Extraction
  const extractedEmails = extractEmailsFromHtml(html);
  const socials = extractSocialProfiles(html);

  const finalScore = Math.max(15, Math.min(100, Math.round(score)));

  return {
    url: cleanUrl,
    healthScore: finalScore,
    auditedAt: new Date().toISOString(),
    responseTimeMs,
    unlinkedGmbWebsite,
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
    socials,
    issues,
    keyRecommendations: recommendations.length > 0 ? recommendations : ['Website is in healthy condition. Consider adding an online booking widget.'],
  };
}
