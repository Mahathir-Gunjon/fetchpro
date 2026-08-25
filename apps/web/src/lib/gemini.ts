import { GoogleGenAI } from '@google/genai';
import { AuditData, Lead, PitchGenerationResult } from './types';

/**
 * Generate a high-converting 3-4 sentence cold outreach email
 * using Google Gemini AI, customized depending on:
 * 1. Has website but NOT linked on GMB profile (Huge conversion leak)
 * 2. Has Facebook/Instagram only (no official booking website)
 * 3. Has website with audit flaws (SSL, Mobile, Backdated Copyright, Speed)
 * 4. Has no website at all (Brand new website pitch)
 */
export async function generateColdPitch(
  lead: Partial<Lead>,
  audit?: AuditData | null
): Promise<PitchGenerationResult> {
  const businessName = lead.business_name || 'Business Owner';
  const rating = lead.rating ? `${lead.rating}★` : '';
  const reviewsCount = lead.reviews_count ? `${lead.reviews_count} reviews` : '';
  const websiteUrl = lead.website_url || audit?.url || '';
  const isUnlinkedGmbWebsite = Boolean(lead.unlinked_gmb_website);
  const socials = lead.socials || audit?.socials;
  const hasSocialsOnly = !websiteUrl && Boolean(socials && (socials.facebook || socials.instagram));
  const hasNoWebsite = !websiteUrl && !hasSocialsOnly;

  // Extract key hooks from audit
  const hooks: string[] = [];
  if (isUnlinkedGmbWebsite) {
    hooks.push(`Your website (${websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}) is active but NOT linked to your Google Business Profile (no "Website" button on Google Maps).`);
  } else if (hasSocialsOnly) {
    hooks.push('Business relies on Facebook/Instagram on Google Maps without a dedicated online booking website.');
  } else if (hasNoWebsite) {
    hooks.push('Business has no active website or online booking page listed on Google Maps.');
  }

  if (audit) {
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

      let angleDescription = '';
      if (isUnlinkedGmbWebsite) {
        angleDescription = `
- Scenario: The business has a website (${websiteUrl}), BUT they forgot to link it to their Google Business listing (their Google Maps profile does not have a "Website" button).
- Key Point: Customers searching on Google Maps cannot click through to see pricing or book appointments with one tap, causing them to bounce to competitors.
`;
      } else if (hasSocialsOnly) {
        angleDescription = `
- Scenario: The business has a Facebook/Instagram page, but NO dedicated booking website.
- Key Point: Social media pages don't allow fast frictionless booking or SEO indexing on Google. Pitch them a modern 1-page booking site.
`;
      } else if (hasNoWebsite) {
        angleDescription = `
- Scenario: No website found.
- Key Point: Pitch a brand new high-converting mobile site to capture daily Google Maps search traffic.
`;
      } else {
        angleDescription = `
- Scenario: Website found with specific audit flaws:
${hooks.map((h) => `  * ${h}`).join('\n')}
`;
      }

      const prompt = `
You are an elite B2B sales copywriter for digital growth and web development agencies.
Write a personalized, ultra-natural 3-4 sentence cold outreach email to "${businessName}".

Context:
- Business: ${businessName} (Google Rating: ${rating} across ${reviewsCount})
${angleDescription}

Rules:
1. Line 1: Genuine compliment on their local reputation / stellar Google Maps reviews.
2. Line 2-3: Point out the exact finding (${isUnlinkedGmbWebsite ? 'their website is missing from their Google Maps profile button' : 'the specific website flaws or opportunity'}).
3. Line 4: Friendly, zero-pressure call to action (e.g. "I recorded a quick 45-second video walkthrough showing how to fix this—would you be open to seeing it?").
4. Return ONLY valid JSON format:
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

  return generateHeuristicPitch(businessName, rating, reviewsCount, hooks, websiteUrl, isUnlinkedGmbWebsite, hasSocialsOnly, hasNoWebsite);
}

function generateHeuristicPitch(
  businessName: string,
  rating: string,
  reviewsCount: string,
  hooks: string[],
  websiteUrl: string,
  isUnlinkedGmbWebsite: boolean,
  hasSocialsOnly: boolean,
  hasNoWebsite: boolean
): PitchGenerationResult {
  const cleanDomain = websiteUrl ? websiteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : '';

  if (isUnlinkedGmbWebsite) {
    return {
      subject: `Missing website button for ${businessName} on Google Maps`,
      pitch:
        `Hi ${businessName} Team,\n\n` +
        `Congrats on your fantastic ${rating || '5★'} reputation${reviewsCount ? ` across ${reviewsCount}` : ''} on Google Maps!\n\n` +
        `I found your website at ${cleanDomain}, but noticed it's currently NOT linked to your Google Business profile (your listing doesn't have a "Website" button). Nearby customers looking for fast estimates might bounce to competitors because they can't view your services in one tap.\n\n` +
        `I put together a 45-second video showing how to fix this and boost your direct bookings. Would you be open to me sending that over?`,
      keyHooksUsed: ['Website unlinked on Google My Business'],
    };
  }

  if (hasSocialsOnly) {
    return {
      subject: `Quick idea for ${businessName}`,
      pitch:
        `Hi ${businessName} Team,\n\n` +
        `Huge congrats on your ${rating || '5★'} rating${reviewsCount ? ` with ${reviewsCount}` : ''} on Google Maps!\n\n` +
        `I noticed your business uses social media pages on Google rather than a dedicated online booking website, which makes it harder for mobile searchers to request instant quotes.\n\n` +
        `I created a quick 60-second mockup of a streamlined booking site designed specifically for ${businessName}. Open to seeing it?`,
      keyHooksUsed: ['Social media only / No dedicated booking site'],
    };
  }

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
