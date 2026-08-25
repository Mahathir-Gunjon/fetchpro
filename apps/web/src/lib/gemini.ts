import { GoogleGenAI } from '@google/genai';
import { AuditData, Lead, PitchGenerationResult } from './types';

/**
 * Generate a high-converting 3-4 sentence cold outreach email
 * using Google Gemini AI, customized depending on whether the business has a website or not.
 */
export async function generateColdPitch(
  lead: Partial<Lead>,
  audit?: AuditData | null
): Promise<PitchGenerationResult> {
  const businessName = lead.business_name || 'Business Owner';
  const rating = lead.rating ? `${lead.rating}★` : '';
  const reviewsCount = lead.reviews_count ? `${lead.reviews_count} reviews` : '';
  const websiteUrl = lead.website_url || audit?.url || '';
  const hasNoWebsite = !websiteUrl;

  // Extract key hooks from audit
  const hooks: string[] = [];
  if (hasNoWebsite) {
    hooks.push('Business has no active website linked on Google Maps, losing clients to competitors with websites.');
  } else if (audit) {
    if (!audit.ssl.hasSsl || !audit.ssl.valid) {
      hooks.push('Website shows "Not Secure" warning in browsers (missing SSL certificate).');
    }
    if (!audit.mobileResponsive.isMobileFriendly) {
      hooks.push('Site is not mobile-optimized, rendering zoomed out on smartphones.');
    }
    if (audit.copyright.isOutdated && audit.copyright.detectedYear) {
      hooks.push(`Footer copyright hasn't been updated since ${audit.copyright.detectedYear}.`);
    }
    if (!audit.meta.description) {
      hooks.push('Missing Google search meta description, resulting in generic search snippets.');
    }
    if (audit.responseTimeMs > 2200) {
      hooks.push(`Slow page load speed (${(audit.responseTimeMs / 1000).toFixed(1)}s latency).`);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      let contextDetails = '';
      if (hasNoWebsite) {
        contextDetails = `
- Business: ${businessName} (Google Rating: ${rating} across ${reviewsCount})
- Core Problem: The business has NO website listed on Google Maps, so customers searching on mobile cannot view pricing, services, or book appointments.
- Goal: Propose building them a clean, high-converting modern website to turn their 5-star Google reputation into daily booked clients.
`;
      } else {
        contextDetails = `
- Business: ${businessName} (Google Rating: ${rating} across ${reviewsCount})
- Website: ${websiteUrl}
- Audit Flaws Found:
${hooks.map((h) => `  * ${h}`).join('\n')}
- Goal: Highlight the exact flaws above and offer a quick 60-second video demo or redesign fix.
`;
      }

      const prompt = `
You are an expert B2B copywriter for high-end web design and SEO agencies.
Write a personalized, ultra-natural 3-4 sentence cold outreach email to "${businessName}".

Context:
${contextDetails}

Rules:
1. Line 1: Genuine compliment on their local reputation / stellar Google Maps reviews.
2. Line 2-3: Clearly state the exact opportunity (${hasNoWebsite ? 'building a modern website to capture daily search traffic' : 'fixing the specific website flaws found'}).
3. Line 4: Friendly, zero-pressure call to action (e.g. "I put together a 45-second video mockup—would you be open to seeing it?").
4. Return ONLY valid JSON format with "subject" and "pitch":
{"subject": "...", "pitch": "..."}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.subject && parsed.pitch) {
          return {
            subject: parsed.subject,
            pitch: parsed.pitch,
            keyHooksUsed: hooks,
          };
        }
      }
    } catch (error: any) {
      console.warn('[Gemini AI] Using smart heuristic pitch fallback:', error.message);
    }
  }

  return generateHeuristicPitch(businessName, rating, reviewsCount, hooks, websiteUrl, hasNoWebsite);
}

function generateHeuristicPitch(
  businessName: string,
  rating: string,
  reviewsCount: string,
  hooks: string[],
  websiteUrl: string,
  hasNoWebsite: boolean
): PitchGenerationResult {
  if (hasNoWebsite) {
    return {
      subject: `Website proposal for ${businessName}`,
      pitch:
        `Hi ${businessName} Team,\n\n` +
        `Huge congrats on your stellar ${rating || '5★'} reputation${reviewsCount ? ` with ${reviewsCount}` : ''} on Google Maps—local clients clearly love your service!\n\n` +
        `I noticed you don't have a website linked on your Google profile yet, which means nearby customers searching online might be calling competitors who offer instant online bookings.\n\n` +
        `I created a quick 60-second video mockup of a high-converting website tailored for ${businessName}. Would you be open to me sending that over?`,
      keyHooksUsed: ['No website listed on Google Maps'],
    };
  }

  const cleanDomain = websiteUrl ? websiteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : '';
  const flawSentence = hooks.length > 0
    ? `While reviewing top-rated local services, I noticed your site (${cleanDomain}) ${hooks[0].toLowerCase()} which may be costing you phone inquiries from mobile visitors.`
    : `While checking out your online presence on ${cleanDomain}, I noticed huge potential to increase your appointment conversions with a modern mobile redesign.`;

  return {
    subject: `Quick suggestion for ${cleanDomain || businessName}`,
    pitch:
      `Hi ${businessName} Team,\n\n` +
      `Congrats on your fantastic ${rating ? `${rating} rating` : 'reviews'}${reviewsCount ? ` across ${reviewsCount}` : ''} on Google Maps!\n\n` +
      `${flawSentence}\n\n` +
      `I recorded a quick 45-second video walkthrough showing 3 quick fixes to increase your monthly bookings. Would you be open to seeing it?`,
    keyHooksUsed: hooks,
  };
}
