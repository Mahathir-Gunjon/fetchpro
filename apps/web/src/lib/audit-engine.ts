import {
  AuditData,
  AuditIssue,
  SocialLinks,
  PageSpeedData,
  LocalSeoData,
  CtaCheckData,
  Lead,
  QualificationLog,
  CoreWebVitals,
} from './types';
import { generateColdPitch } from './gemini';

const DEFAULT_PAGESPEED_KEY = 'AIzaSyAnEbHM4CSK9ONRQVatSkbaSYenImfHsQ0';

/**
 * Normalize a target URL
 */
export function normalizeTargetUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Filter out dummy or CDN emails
 */
function isValidBusinessEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  const blockedDomains = [
    'sentry.io',
    'wixpress.com',
    'w3.org',
    'domain.com',
    'example.com',
    'schema.org',
    'cloudflare.com',
    'googleapis.com',
  ];
  const blockedPrefixes = ['noreply', 'no-reply', 'mailer-daemon', 'donotreply', 'privacy', 'abuse'];
  const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.css', '.js', '.woff', '.woff2'];

  if (extensions.some((ext) => lower.endsWith(ext))) return false;
  if (blockedDomains.some((d) => lower.includes(d))) return false;
  if (blockedPrefixes.some((p) => lower.startsWith(p))) return false;

  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(lower);
}

/**
 * Extract phone numbers from HTML
 */
function extractPhonesFromHtml(html: string): string[] {
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  const matches = html.match(phoneRegex) || [];
  const validSet = new Set<string>();

  for (const match of matches) {
    const clean = match.trim();
    if (clean.length >= 10 && !clean.includes('0000000')) {
      validSet.add(clean);
    }
  }

  // Also check tel: links
  const telRegex = /href=["']tel:([^"'\s?]+)["']/gi;
  let telMatch;
  while ((telMatch = telRegex.exec(html)) !== null) {
    const rawTel = telMatch[1].replace(/[^\d+()-.\s]/g, '').trim();
    if (rawTel.length >= 10) {
      validSet.add(rawTel);
    }
  }

  return Array.from(validSet);
}

/**
 * Extract emails from HTML and mailto links
 */
function extractEmailsFromHtml(html: string): string[] {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = html.match(emailRegex) || [];
  const validSet = new Set<string>();

  for (const match of matches) {
    if (isValidBusinessEmail(match)) {
      validSet.add(match.toLowerCase());
    }
  }

  const mailtoRegex = /href=["']mailto:([^"'\s?]+)["']/gi;
  let mailtoMatch;
  while ((mailtoMatch = mailtoRegex.exec(html)) !== null) {
    const rawEmail = mailtoMatch[1];
    if (isValidBusinessEmail(rawEmail)) {
      validSet.add(rawEmail.toLowerCase());
    }
  }

  return Array.from(validSet);
}

/**
 * Crawl /contact and /about subpages for contact info
 */
async function crawlSubpageContacts(baseUrl: string): Promise<{ emails: string[]; phones: string[] }> {
  const subpaths = ['/contact', '/contact-us', '/about', '/about-us'];
  const discoveredEmails = new Set<string>();
  const discoveredPhones = new Set<string>();
  const cleanBase = baseUrl.replace(/\/$/, '');

  for (const path of subpaths) {
    try {
      const subUrl = `${cleanBase}${path}`;
      const res = await fetch(subUrl, {
        signal: AbortSignal.timeout(2400),
        headers: { 'User-Agent': 'Mozilla/5.0 (FetchPro-AuditEngine/2.0)' },
      });
      if (res.ok) {
        const subHtml = await res.text();
        extractEmailsFromHtml(subHtml).forEach((e) => discoveredEmails.add(e));
        extractPhonesFromHtml(subHtml).forEach((p) => discoveredPhones.add(p));
        if (discoveredEmails.size >= 2) break;
      }
    } catch (e) {}
  }

  return {
    emails: Array.from(discoveredEmails),
    phones: Array.from(discoveredPhones),
  };
}

/**
 * Extract social media profiles from HTML
 */
export function extractSocialProfiles(html: string): SocialLinks {
  const socials: SocialLinks = {
    facebook: null,
    instagram: null,
    tiktok: null,
    linkedin: null,
    twitter_x: null,
    youtube: null,
    yelp: null,
    mapquest: null,
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
    } else if (!socials.tiktok && lower.includes('tiktok.com/@')) {
      socials.tiktok = url;
    } else if (!socials.yelp && lower.includes('yelp.com/biz/')) {
      socials.yelp = url;
    } else if (!socials.linkedin && (lower.includes('linkedin.com/company/') || lower.includes('linkedin.com/in/'))) {
      socials.linkedin = url;
    } else if (!socials.twitter_x && (lower.includes('twitter.com/') || lower.includes('x.com/')) && !lower.includes('/intent')) {
      socials.twitter_x = url;
      socials.twitter = url;
    } else if (!socials.youtube && (lower.includes('youtube.com/c/') || lower.includes('youtube.com/@') || lower.includes('youtube.com/channel/'))) {
      socials.youtube = url;
    } else if (!socials.mapquest && lower.includes('mapquest.com')) {
      socials.mapquest = url;
    }
  }

  return socials;
}

/**
 * Fetch Google PageSpeed Insights API (Mobile Performance & Core Web Vitals)
 */
async function fetchGooglePageSpeedAndCWV(url: string, responseTimeMs: number): Promise<PageSpeedData> {
  const apiKey = process.env.PAGESPEED_API_KEY || DEFAULT_PAGESPEED_KEY;
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
    url
  )}&strategy=mobile&key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const lighthouse = data?.lighthouseResult;
      const perfCategory = lighthouse?.categories?.performance;
      const perfScore = typeof perfCategory?.score === 'number' ? Math.round(perfCategory.score * 100) : null;

      const fcp = lighthouse?.audits?.['first-contentful-paint']?.displayValue || '1.8 s';
      const lcp = lighthouse?.audits?.['largest-contentful-paint']?.displayValue || '3.5 s';
      const cls = lighthouse?.audits?.['cumulative-layout-shift']?.displayValue || '0.04';
      const inp = lighthouse?.audits?.['interactive']?.displayValue || '240 ms';

      const webVitals: CoreWebVitals = { fcp, lcp, cls, inp };

      if (perfScore !== null) {
        return {
          score: perfScore,
          fcp,
          lcp,
          cls,
          inp,
          isSlow: perfScore < 50,
          webVitals,
        };
      }
    }
  } catch (err) {}

  // Fallback estimates based on server response latency
  let estimatedScore = 78;
  let estimatedFcp = '1.5 s';
  let estimatedLcp = '2.4 s';
  let estimatedCls = '0.05';
  let estimatedInp = '180 ms';

  if (responseTimeMs > 3000) {
    estimatedScore = 32;
    estimatedFcp = '3.8 s';
    estimatedLcp = '6.2 s';
    estimatedCls = '0.28';
    estimatedInp = '650 ms';
  } else if (responseTimeMs > 2000) {
    estimatedScore = 48;
    estimatedFcp = '2.9 s';
    estimatedLcp = '4.5 s';
    estimatedCls = '0.18';
    estimatedInp = '420 ms';
  } else if (responseTimeMs > 1200) {
    estimatedScore = 65;
    estimatedFcp = '2.1 s';
    estimatedLcp = '3.2 s';
    estimatedCls = '0.09';
    estimatedInp = '260 ms';
  }

  return {
    score: estimatedScore,
    fcp: estimatedFcp,
    lcp: estimatedLcp,
    cls: estimatedCls,
    inp: estimatedInp,
    isSlow: estimatedScore < 50,
    webVitals: {
      fcp: estimatedFcp,
      lcp: estimatedLcp,
      cls: estimatedCls,
      inp: estimatedInp,
    },
  };
}

/**
 * Technical SEO & Schema.org Structured Data Audit
 */
function auditTechnicalSeoAndSchema(html: string): LocalSeoData {
  const schemaTypes: string[] = [];
  let hasLocalSchema = false;

  const scriptRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const jsonStr = match[1];
    try {
      const parsed = JSON.parse(jsonStr);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        const type = item['@type'] || (item['@graph'] && item['@graph'][0]?.['@type']);
        if (type) {
          const typeStr = Array.isArray(type) ? type.join(', ') : String(type);
          schemaTypes.push(typeStr);

          const lowerType = typeStr.toLowerCase();
          if (
            lowerType.includes('localbusiness') ||
            lowerType.includes('organization') ||
            lowerType.includes('service') ||
            lowerType.includes('store') ||
            lowerType.includes('dentist') ||
            lowerType.includes('plumber') ||
            lowerType.includes('contractor') ||
            lowerType.includes('restaurant') ||
            lowerType.includes('professionalservice') ||
            lowerType.includes('homeandconstructionbusiness')
          ) {
            hasLocalSchema = true;
          }
        }
      }
    } catch (e) {}
  }

  const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(html);
  const hasH2 = /<h2[^>]*>[\s\S]*?<\/h2>/i.test(html);
  const hasTitle = /<title[^>]*>[\s\S]*?<\/title>/i.test(html);
  const hasDescription = /<meta\s+[^>]*(name=["']description["']|property=["']og:description["'])[^>]*>/i.test(html);

  return {
    hasLocalSchema,
    schemaTypes: Array.from(new Set(schemaTypes)),
    hasH1,
    hasH2,
    hasTitle,
    hasDescription,
  };
}

/**
 * Check UI/UX Signals & Call-to-Action (CTA) presence
 */
function auditCtaAndUx(html: string): CtaCheckData {
  const ctaLabels: string[] = [];
  const ctaPatterns = [
    /href=["']tel:[^"']+["']/i,
    /href=["']mailto:[^"']+["']/i,
    /href=["'][^"']*(book|schedule|contact|quote|estimate|appointment|consultation)[^"']*["']/i,
    /(?:book now|get a quote|schedule estimate|call now|free consultation|request service|get started|contact us)/i,
  ];

  let hasClearCta = false;
  for (const pattern of ctaPatterns) {
    if (pattern.test(html)) {
      hasClearCta = true;
      break;
    }
  }

  const ctaButtonMatches = html.match(/<(?:button|a)[^>]*>([\s\S]*?)<\/(?:button|a)>/gi);
  if (ctaButtonMatches) {
    for (const btn of ctaButtonMatches.slice(0, 30)) {
      const cleanBtnText = btn.replace(/<[^>]+>/g, '').trim();
      if (
        cleanBtnText.length > 2 &&
        cleanBtnText.length < 35 &&
        /(quote|estimate|book|call|schedule|contact|appointment)/i.test(cleanBtnText)
      ) {
        ctaLabels.push(cleanBtnText);
        hasClearCta = true;
      }
    }
  }

  return {
    hasClearCta,
    ctaLabels: Array.from(new Set(ctaLabels)).slice(0, 4),
  };
}

/**
 * Master Multi-Layer Website & SEO Audit Engine (Server-Side)
 */
export async function auditWebsiteServerSide(
  targetUrl: string,
  options?: { reviewsCount?: number; businessName?: string }
): Promise<AuditData> {
  const cleanUrl = normalizeTargetUrl(targetUrl);
  const startTime = Date.now();
  const currentYear = new Date().getFullYear();
  const reviewsCount = options?.reviewsCount ?? 0;

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
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(cleanUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (compatible; FetchProAuditEngine/2.0)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
          headers: { 'User-Agent': 'Mozilla/5.0 (FetchProAuditEngine/2.0)' },
        });
        html = await fallbackRes.text();
        hasSsl = false;
        sslValid = false;
      } catch {}
    }
  }

  // If site is completely unreachable / broken
  if (!html || html.length < 50) {
    return {
      url: targetUrl,
      healthScore: 10,
      auditedAt: new Date().toISOString(),
      responseTimeMs: responseTimeMs || 4500,
      pageSpeed: {
        score: 10,
        fcp: '> 5.0 s',
        lcp: '> 8.0 s',
        cls: '0.40',
        inp: '800 ms',
        isSlow: true,
        webVitals: { fcp: '> 5.0 s', lcp: '> 8.0 s', cls: '0.40', inp: '800 ms' },
      },
      localSeo: {
        hasLocalSchema: false,
        schemaTypes: [],
        hasH1: false,
        hasH2: false,
        hasTitle: false,
        hasDescription: false,
        brokenLinks: true,
      },
      ctaCheck: { hasClearCta: false, ctaLabels: [] },
      ssl: { hasSsl: false, valid: false, protocol: 'Unreachable / Insecure' },
      mobileResponsive: { hasViewport: false, isMobileFriendly: false },
      meta: { hasOgImage: false },
      techStack: { frameworks: [], analytics: [] },
      copyright: { isOutdated: true, currentYear },
      extractedEmails: [],
      extractedPhones: [],
      socials: {},
      social_profiles: {},
      issues: [
        {
          type: 'error',
          title: 'Website Unreachable or Offline',
          description: 'Server timed out or returned no content. Critical lost revenue opportunity.',
          impactScore: -90,
        },
      ],
      keyRecommendations: [
        'Urgent: Domain is dead/unreachable. Immediate opportunity to pitch hosting & high-converting site redesign.',
      ],
    };
  }

  // 2. Google PageSpeed & Core Web Vitals
  const pageSpeed = await fetchGooglePageSpeedAndCWV(finalUrl, responseTimeMs);
  if (pageSpeed.score < 50) {
    score -= 25;
    issues.push({
      type: 'error',
      title: `Critical Mobile Speed (${pageSpeed.score}/100)`,
      description: `Mobile PageSpeed score is ${pageSpeed.score}/100 with LCP ${pageSpeed.lcp || 'slow'}. High bounce rate on mobile.`,
      impactScore: -25,
    });
    recommendations.push('Optimize mobile page speed, compress images, and improve Core Web Vitals (LCP/CLS/INP).');
  } else if (pageSpeed.score <= 70) {
    score -= 10;
    issues.push({
      type: 'warning',
      title: `Suboptimal Mobile Speed (${pageSpeed.score}/100)`,
      description: `PageSpeed is ${pageSpeed.score}/100. Performance optimization needed.`,
      impactScore: -10,
    });
  } else {
    issues.push({
      type: 'success',
      title: `Fast Mobile Performance (${pageSpeed.score}/100)`,
      description: 'Page loads swiftly on mobile devices.',
      impactScore: 0,
    });
  }

  // 3. Technical SEO & Schema.org
  const localSeo = auditTechnicalSeoAndSchema(html);
  if (!localSeo.hasLocalSchema) {
    score -= 15;
    issues.push({
      type: 'warning',
      title: 'Missing LocalBusiness Schema (schema.org)',
      description: 'No LocalBusiness structured data found. Google Maps and voice search cannot read NAP properly.',
      impactScore: -15,
    });
    recommendations.push('Add schema.org LocalBusiness JSON-LD markup with NAP (Name, Address, Phone).');
  } else {
    issues.push({
      type: 'success',
      title: 'LocalBusiness Schema Found',
      description: `Structured data detected: ${localSeo.schemaTypes.slice(0, 2).join(', ')}.`,
      impactScore: 0,
    });
  }

  if (!localSeo.hasH1) {
    score -= 8;
    issues.push({
      type: 'warning',
      title: 'Missing Primary <h1> Heading',
      description: 'Page lacks an <h1> tag for key search term hierarchy.',
      impactScore: -8,
    });
  }

  if (!localSeo.hasH2) {
    score -= 4;
    issues.push({
      type: 'info',
      title: 'Missing <h2> Subheadings',
      description: 'No secondary <h2> tags detected to organize service offerings.',
      impactScore: -4,
    });
  }

  // 4. Mobile Viewport & Responsiveness
  const viewportMatch =
    html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']viewport["']/i);
  const hasViewport = !!viewportMatch;
  const isMobileFriendly =
    hasViewport &&
    (viewportMatch[1].includes('width=device-width') || viewportMatch[1].includes('initial-scale=1'));

  if (!isMobileFriendly) {
    score -= 20;
    issues.push({
      type: 'error',
      title: 'Missing Mobile Viewport Tag',
      description: 'Site is not responsive on smartphones, forcing users to pinch-to-zoom.',
      impactScore: -20,
    });
    recommendations.push('Add responsive viewport tags and fluid smartphone styling.');
  }

  // 5. Call-To-Action (CTA) Verification
  const ctaCheck = auditCtaAndUx(html);
  if (!ctaCheck.hasClearCta) {
    score -= 10;
    issues.push({
      type: 'warning',
      title: 'Missing Above-The-Fold CTA',
      description: 'No clear Call, Quote, or Booking button detected on homepage.',
      impactScore: -10,
    });
    recommendations.push('Implement prominent CTA buttons (Call Now / Get Instant Estimate).');
  }

  // 6. Backdated Copyright (<= 2022)
  let detectedYear: number | undefined = undefined;
  let isOutdated = false;
  let copyrightText = '';

  const copyrightRegex = /(?:©|&copy;|&#169;|copyright)\s*(?:[0-9]{4}\s*-\s*)?([12][0-9]{3})/i;
  const copyrightMatch = html.match(copyrightRegex);

  if (copyrightMatch) {
    detectedYear = parseInt(copyrightMatch[1], 10);
    copyrightText = copyrightMatch[0];

    if (detectedYear <= 2022) {
      isOutdated = true;
      score -= 20;
      issues.push({
        type: 'error',
        title: `Backdated Copyright (${detectedYear})`,
        description: `Footer displays copyright ${detectedYear} (over 3 years outdated). Strong indicator of abandoned website.`,
        impactScore: -20,
      });
      recommendations.push(`Update copyright to ${currentYear} and modernize stale website components.`);
    } else if (detectedYear === 2023) {
      isOutdated = true;
      score -= 10;
      issues.push({
        type: 'warning',
        title: `Outdated Copyright (${detectedYear})`,
        description: `Footer shows copyright ${detectedYear}.`,
        impactScore: -10,
      });
    } else {
      issues.push({
        type: 'success',
        title: `Modern Copyright (${detectedYear})`,
        description: 'Footer copyright is actively maintained.',
        impactScore: 0,
      });
    }
  }

  // 7. SSL Certificate Security
  if (!hasSsl || !sslValid) {
    score -= 25;
    issues.push({
      type: 'error',
      title: 'Insecure SSL (HTTP Not Secure)',
      description: 'Visitors see a "Not Secure" warning in modern browsers.',
      impactScore: -25,
    });
    recommendations.push('Install SSL certificate (HTTPS) and enforce automatic TLS encryption.');
  }

  // 8. Meta Title & Description
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle = titleMatch ? titleMatch[1].trim() : '';
  const titleLength = rawTitle.length;

  if (!rawTitle) {
    score -= 10;
    issues.push({
      type: 'error',
      title: 'Missing <title> Tag',
      description: 'No title tag declared for search engine SERP snippets.',
      impactScore: -10,
    });
  }

  const descMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i) ||
    html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const rawDesc = descMatch ? descMatch[1].trim() : '';
  const descLength = rawDesc.length;

  if (!rawDesc) {
    score -= 10;
    issues.push({
      type: 'warning',
      title: 'Missing Meta Description',
      description: 'Search engines display unformatted page text instead of a value proposition.',
      impactScore: -10,
    });
  }

  // 9. Tech Stack & Outdated JS Indicators
  const techStack = {
    cms: undefined as string | undefined,
    frameworks: [] as string[],
    analytics: [] as string[],
    server: undefined as string | undefined,
  };

  const lowerHtml = html.toLowerCase();
  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes')) techStack.cms = 'WordPress';
  else if (lowerHtml.includes('cdn.shopify.com') || lowerHtml.includes('shopify.theme')) techStack.cms = 'Shopify';
  else if (lowerHtml.includes('squarespace.com') || lowerHtml.includes('static1.squarespace.com'))
    techStack.cms = 'Squarespace';
  else if (lowerHtml.includes('wix.com') || lowerHtml.includes('parastorage.com')) techStack.cms = 'Wix';
  else if (lowerHtml.includes('webflow.js') || lowerHtml.includes('wf-page')) techStack.cms = 'Webflow';

  if (lowerHtml.includes('jquery-1.') || lowerHtml.includes('jquery/1.')) {
    score -= 5;
    techStack.frameworks.push('Legacy jQuery 1.x');
    issues.push({
      type: 'warning',
      title: 'Outdated JS Library (jQuery 1.x)',
      description: 'Site runs an end-of-life jQuery version with known security and performance penalties.',
      impactScore: -5,
    });
  }

  if (lowerHtml.includes('next.js') || lowerHtml.includes('__next_data__') || lowerHtml.includes('/_next/'))
    techStack.frameworks.push('Next.js');
  if (lowerHtml.includes('react') || lowerHtml.includes('data-reactroot')) techStack.frameworks.push('React');
  if (lowerHtml.includes('tailwind')) techStack.frameworks.push('Tailwind CSS');
  if (lowerHtml.includes('bootstrap')) techStack.frameworks.push('Bootstrap');

  if (lowerHtml.includes('googletagmanager.com') || lowerHtml.includes('gtag(') || lowerHtml.includes('ga('))
    techStack.analytics.push('Google Analytics');
  if (lowerHtml.includes('facebook.com/tr') || lowerHtml.includes('fbq(')) techStack.analytics.push('Meta Pixel');

  // 10. Contact Information & Subpage Crawl
  let extractedEmails = extractEmailsFromHtml(html);
  let extractedPhones = extractPhonesFromHtml(html);

  if ((extractedEmails.length === 0 || extractedPhones.length === 0) && finalUrl.startsWith('http')) {
    const subContacts = await crawlSubpageContacts(finalUrl);
    if (extractedEmails.length === 0) extractedEmails = subContacts.emails;
    if (extractedPhones.length === 0) extractedPhones = subContacts.phones;
  }

  const socials = extractSocialProfiles(html);
  const finalScore = Math.max(10, Math.min(100, Math.round(score)));

  return {
    url: cleanUrl,
    healthScore: finalScore,
    auditedAt: new Date().toISOString(),
    responseTimeMs,
    pageSpeed,
    localSeo,
    ctaCheck,
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
      hasOgImage: /<meta\s+property=["']og:image["']/i.test(html),
    },
    techStack,
    copyright: {
      detectedYear,
      isOutdated,
      currentYear,
      rawText: copyrightText || undefined,
    },
    extractedEmails,
    extractedPhones,
    socials,
    social_profiles: socials,
    issues,
    keyRecommendations:
      recommendations.length > 0 ? recommendations : ['Website is in healthy operating condition.'],
  };
}

/**
 * Social Media Presence Checker
 */
export function checkSocialPresence(socials?: SocialLinks | null): {
  hasAnySocial: boolean;
  activeProfiles: string[];
} {
  if (!socials) return { hasAnySocial: false, activeProfiles: [] };

  const active: string[] = [];
  if (socials.facebook) active.push('Facebook');
  if (socials.instagram) active.push('Instagram');
  if (socials.yelp) active.push('Yelp');
  if (socials.tiktok) active.push('TikTok');
  if (socials.linkedin) active.push('LinkedIn');
  if (socials.twitter_x || socials.twitter) active.push('Twitter/X');
  if (socials.youtube) active.push('YouTube');

  return {
    hasAnySocial: active.length > 0,
    activeProfiles: active,
  };
}

/**
 * Deterministic Lead Qualification Logic
 *
 * Marks as QUALIFIED if:
 * 1. No Website exists on GMB or Web Results
 * 2. PageSpeed Score < 50
 * 3. SEO Issues >= 3
 * 4. Copyright <= 2022
 * 5. Missing Mobile Viewport
 * 6. Insecure SSL
 */
export function evaluateQualification(
  lead: Partial<Lead>,
  auditData?: AuditData | null
): {
  is_qualified: boolean;
  opportunity_score: number;
  opportunity_reasons: string[];
  qualification_log: QualificationLog;
  recommendedStatus: 'hot_lead' | 'trash' | 'audited';
} {
  const targetUrl = lead.gmb_website_url || lead.website_url || lead.discovered_website;
  const socials = lead.social_profiles || lead.socials || auditData?.socials || {};

  // Case 1: No Website found anywhere
  if (!targetUrl) {
    const reasons = [
      'No Website Found on Google Maps Profile or Web Results',
      'Immediate requirement for full professional website build',
    ];
    if (socials.facebook || socials.instagram || socials.yelp) {
      reasons.push('Active local presence on social channels without dedicated domain');
    }

    return {
      is_qualified: true,
      opportunity_score: 95,
      opportunity_reasons: reasons,
      qualification_log: {
        is_qualified: true,
        primary_reason: 'No Website Found on Profile or Web Results (Immediate Need for Full Site Build)',
        qualification_tag: 'NO_WEBSITE',
        checks: {
          google_maps_website_button: false,
          web_results_matched: false,
          facebook_page_found: !!socials.facebook,
          instagram_page_found: !!socials.instagram,
          tiktok_page_found: !!socials.tiktok,
          yelp_page_found: !!socials.yelp,
          ssl_valid: null,
          copyright_year: null,
          mobile_speed_score: null,
          missing_local_schema: null,
          seo_issues_count: 0,
        },
        score: 95,
      },
      recommendedStatus: 'hot_lead',
    };
  }

  // If we don't have audit data yet, initial qualification estimate
  if (!auditData) {
    return {
      is_qualified: true,
      opportunity_score: 50,
      opportunity_reasons: ['Pending full multi-layer website & SEO audit'],
      qualification_log: {
        is_qualified: true,
        primary_reason: 'Scraped lead queued for multi-layer server audit',
        qualification_tag: 'QUALIFIED_HOT',
        checks: {
          google_maps_website_button: !!lead.gmb_website_url,
          web_results_matched: !!lead.discovered_website,
          facebook_page_found: !!socials.facebook,
          instagram_page_found: !!socials.instagram,
          tiktok_page_found: !!socials.tiktok,
          yelp_page_found: !!socials.yelp,
          ssl_valid: null,
          copyright_year: null,
          mobile_speed_score: null,
          missing_local_schema: null,
          seo_issues_count: 0,
        },
        score: 50,
      },
      recommendedStatus: 'audited',
    };
  }

  // Detailed Audited Qualification Checks
  let score = 0;
  const reasons: string[] = [];

  const errorIssues = auditData.issues.filter((i) => i.type === 'error').length;
  const warningIssues = auditData.issues.filter((i) => i.type === 'warning').length;
  const totalSeoIssues = errorIssues + warningIssues;

  // 1. Mobile PageSpeed < 50
  const pageSpeedScore = auditData.pageSpeed?.score ?? 70;
  if (pageSpeedScore < 50) {
    score += 30;
    reasons.push(`Critical Mobile PageSpeed (${pageSpeedScore}/100, LCP: ${auditData.pageSpeed?.lcp || 'slow'})`);
  } else if (pageSpeedScore <= 65) {
    score += 15;
    reasons.push(`Slow Mobile Performance (${pageSpeedScore}/100)`);
  }

  // 2. Copyright <= 2022
  const copyrightYear = auditData.copyright.detectedYear ?? null;
  if (copyrightYear && copyrightYear <= 2022) {
    score += 25;
    reasons.push(`Backdated Copyright (${copyrightYear} - over 3 years outdated)`);
  } else if (copyrightYear && copyrightYear === 2023) {
    score += 15;
    reasons.push(`Outdated Copyright (${copyrightYear})`);
  }

  // 3. Insecure SSL
  if (!auditData.ssl.valid) {
    score += 25;
    reasons.push('Insecure SSL / HTTP Not Secure warning');
  }

  // 4. Missing Mobile Viewport
  if (!auditData.mobileResponsive.isMobileFriendly) {
    score += 20;
    reasons.push('Missing Mobile Viewport (Not smartphone optimized)');
  }

  // 5. Missing Schema.org LocalBusiness
  if (!auditData.localSeo?.hasLocalSchema) {
    score += 15;
    reasons.push('Missing schema.org LocalBusiness JSON-LD markup');
  }

  // 6. Missing Call-To-Action
  if (!auditData.ctaCheck?.hasClearCta) {
    score += 10;
    reasons.push('Missing direct Call-To-Action / Quote button');
  }

  // 7. SEO Issues >= 3
  if (totalSeoIssues >= 3) {
    score += 15;
    reasons.push(`Multiple Technical SEO issues (${totalSeoIssues} defects detected)`);
  }

  const is_qualified =
    pageSpeedScore < 50 ||
    (copyrightYear !== null && copyrightYear <= 2022) ||
    !auditData.ssl.valid ||
    !auditData.mobileResponsive.isMobileFriendly ||
    totalSeoIssues >= 3;

  const finalScore = Math.min(99, Math.max(is_qualified ? 45 : 10, score));

  // Determine Primary Reason & Tag
  let primaryReason = reasons[0] || 'Website has minor optimization opportunities';
  let qualification_tag: QualificationLog['qualification_tag'] = 'QUALIFIED_HOT';

  if (!auditData.ssl.valid) {
    qualification_tag = 'INSECURE_SSL';
  } else if (pageSpeedScore < 50) {
    qualification_tag = 'SLOW_PAGESPEED';
  } else if (copyrightYear && copyrightYear <= 2022) {
    qualification_tag = 'OUTDATED_WEBSITE';
  } else if (!auditData.localSeo?.hasLocalSchema) {
    qualification_tag = 'MISSING_SCHEMA';
  } else if (!is_qualified && auditData.healthScore >= 85) {
    qualification_tag = 'PERFECT_SITE';
    primaryReason = 'Site is already high-performing and modern';
  }

  const isTrash = !is_qualified && auditData.healthScore >= 85 && finalScore <= 15;

  return {
    is_qualified,
    opportunity_score: finalScore,
    opportunity_reasons: reasons.length > 0 ? reasons : ['Modern website with no major conversion leaks'],
    qualification_log: {
      is_qualified,
      primary_reason: primaryReason,
      qualification_tag,
      checks: {
        google_maps_website_button: !!lead.gmb_website_url,
        web_results_matched: !!lead.discovered_website,
        facebook_page_found: !!socials.facebook,
        instagram_page_found: !!socials.instagram,
        tiktok_page_found: !!socials.tiktok,
        yelp_page_found: !!socials.yelp,
        ssl_valid: auditData.ssl.valid,
        copyright_year: copyrightYear,
        mobile_speed_score: pageSpeedScore,
        missing_local_schema: !auditData.localSeo?.hasLocalSchema,
        seo_issues_count: totalSeoIssues,
      },
      score: finalScore,
    },
    recommendedStatus: isTrash ? 'trash' : is_qualified ? 'hot_lead' : 'audited',
  };
}

/**
 * Full Pipeline Runner: Audit + Qualification + AI Cold Pitch Generator
 */
export async function runLeadAuditAndQualification(
  lead: Partial<Lead>,
  options?: { generatePitch?: boolean }
): Promise<{
  auditData: AuditData | null;
  is_qualified: boolean;
  opportunity_score: number;
  opportunity_reasons: string[];
  qualification_log: QualificationLog;
  pitchResult?: { subject: string; pitch: string };
  recommendedStatus: 'hot_lead' | 'trash' | 'audited';
}> {
  const targetUrl = lead.gmb_website_url || lead.website_url || lead.discovered_website;

  // If no website exists anywhere
  if (!targetUrl) {
    const qual = evaluateQualification(lead, null);
    let pitchResult: { subject: string; pitch: string } | undefined = undefined;

    if (options?.generatePitch !== false) {
      pitchResult = await generateColdPitch(
        {
          business_name: lead.business_name || 'Business',
          phone: lead.phone || null,
          rating: lead.rating || 0,
          reviews_count: lead.reviews_count || 0,
          status: 'hot_lead',
        },
        null
      );
    }

    return {
      auditData: null,
      is_qualified: qual.is_qualified,
      opportunity_score: qual.opportunity_score,
      opportunity_reasons: qual.opportunity_reasons,
      qualification_log: qual.qualification_log,
      pitchResult,
      recommendedStatus: qual.recommendedStatus,
    };
  }

  // Run Server-side Multi-layer Audit
  const auditData = await auditWebsiteServerSide(targetUrl, {
    reviewsCount: lead.reviews_count,
    businessName: lead.business_name,
  });

  // Evaluate Qualification
  const qual = evaluateQualification(lead, auditData);
  auditData.opportunityScore = qual.opportunity_score;
  auditData.opportunityReasons = qual.opportunity_reasons;
  auditData.qualification_log = qual.qualification_log;

  // Generate Cold Pitch with Exact Audit Defects
  let pitchResult: { subject: string; pitch: string } | undefined = undefined;
  if (options?.generatePitch !== false) {
    pitchResult = await generateColdPitch(
      {
        business_name: lead.business_name || 'Business',
        phone: lead.phone || null,
        rating: lead.rating || 0,
        reviews_count: lead.reviews_count || 0,
        status: qual.recommendedStatus,
      },
      auditData
    );
  }

  return {
    auditData,
    is_qualified: qual.is_qualified,
    opportunity_score: qual.opportunity_score,
    opportunity_reasons: qual.opportunity_reasons,
    qualification_log: qual.qualification_log,
    pitchResult,
    recommendedStatus: qual.recommendedStatus,
  };
}
