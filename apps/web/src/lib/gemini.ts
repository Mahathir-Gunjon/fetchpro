import { GoogleGenAI } from '@google/genai';
import { AuditData, Lead, PitchGenerationResult } from './types';
import { calculateOpportunityScore } from './scoring';

/**
 * Upgraded High-Converting Two-Step Gemini Pitch Generator
 * ONLY generates pitches for high-opportunity/hot leads to save API quota.
 */
export async function generateColdPitch(
  lead: Partial<Lead>,
  audit?: AuditData | null
): Promise<PitchGenerationResult> {
  const businessName = lead.business_name || 'Business Owner';
  const rating = lead.rating ? `${lead.rating}★` : '';
  const reviewsCount = lead.reviews_count ? `${lead.reviews_count} reviews` : '';
  const websiteUrl = lead.website_url || audit?.url || '';
  const socials = lead.socials || audit?.socials;
  const hasSocialsOnly = !websiteUrl && Boolean(socials && (socials.facebook || socials.instagram || socials.tiktok));
  const hasNoWebsite = !websiteUrl && !hasSocialsOnly;

  // Zero-Waste Check: If lead is classified as trash, return minimal placeholder
  const oppResult = calculateOpportunityScore(lead, audit);
  if (lead.status === 'trash' || (oppResult.score < 20 && oppResult.recommendedStatus === 'trash')) {
    return {
      subject: `Notes for ${businessName}`,
      pitch: `Site is in optimal condition (${audit?.healthScore || 90}/100). No immediate outreach required.`,
      keyHooksUsed: ['Zero critical flaws'],
    };
  }

  // Extract top 1-2 exact flaws found
  const hooks: string[] = [];

  if (hasSocialsOnly) {
    hooks.push('Business relies only on social media pages without a dedicated high-converting booking website');
  } else if (hasNoWebsite) {
    hooks.push('Business has no website or online booking presence listed on Google Maps');
  }

  if (audit) {
    if (audit.pageSpeed && audit.pageSpeed.score < 60) {
      hooks.push(`Mobile page speed is ${audit.pageSpeed.score}/100 (high visitor bounce on smartphones)`);
    } else if (audit.responseTimeMs > 2500) {
      hooks.push(`Server response latency is ${(audit.responseTimeMs / 1000).toFixed(1)}s`);
    }

    if (audit.localSeo && !audit.localSeo.hasLocalSchema) {
      hooks.push('Missing LocalBusiness schema markup (reducing visibility in Google Maps local pack)');
    }

    if (audit.ctaCheck && !audit.ctaCheck.hasClearCta) {
      hooks.push('Missing direct Call-To-Action (Call/Quote button) above the fold');
    }

    if (audit.copyright && audit.copyright.isOutdated && audit.copyright.detectedYear) {
      hooks.push(`Footer copyright hasn't been updated since ${audit.copyright.detectedYear}`);
    }

    if (audit.ssl && (!audit.ssl.hasSsl || !audit.ssl.valid)) {
      hooks.push('Website shows "Not Secure" warning in browsers (missing SSL certificate)');
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      let flawContext = '';
      if (hasNoWebsite) {
        flawContext = 'The business has no website listed on Google Maps, losing potential search customers.';
      } else if (hasSocialsOnly) {
        flawContext = 'The business only has social media pages on Google Maps, lacking an instant booking site.';
      } else {
        flawContext = `Exact flaws identified:\n${hooks.slice(0, 2).map((h) => `- ${h}`).join('\n')}`;
      }

      const prompt = `
You are an elite B2B cold email strategist for local web design & digital growth agencies.
Write a curiosity-driven, ultra-concise 3-sentence plain text cold email to "${businessName}".

Context:
- Target Business: ${businessName} (Google Rating: ${rating} with ${reviewsCount})
- Opportunity Findings:
${flawContext}

Rules:
1. Sentence 1: Genuine, warm compliment on their local reputation / Google Maps reviews.
2. Sentence 2: Highlight 1-2 exact findings naturally without sounding aggressive (e.g. "I noticed your mobile speed is loading at ${audit?.pageSpeed?.score || 35}/100 and missing Local Business markup, which causes nearby smartphone searchers to bounce before calling.").
3. Sentence 3: Low-friction, no-pressure CTA (e.g. "Would it be okay if I sent over a short 2-minute video teardown showing how to fix this?").
4. Keep it under 65 words. No fluff.
5. Return ONLY valid JSON:
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
            keyHooksUsed: hooks.slice(0, 2),
          };
        }
      }
    } catch (error: any) {
      console.warn('[Gemini AI] Fallback to deterministic copywriting:', error.message);
    }
  }

  return generateHeuristicPitch(businessName, rating, reviewsCount, hooks, websiteUrl, hasSocialsOnly, hasNoWebsite, audit);
}

function generateHeuristicPitch(
  businessName: string,
  rating: string,
  reviewsCount: string,
  hooks: string[],
  websiteUrl: string,
  hasSocialsOnly: boolean,
  hasNoWebsite: boolean,
  audit?: AuditData | null
): PitchGenerationResult {
  const cleanDomain = websiteUrl ? websiteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : '';

  if (hasSocialsOnly) {
    return {
      subject: `Quick idea for ${businessName}`,
      pitch:
        `Hi ${businessName} Team,\n\n` +
        `Huge congrats on your ${rating || '5★'} rating${reviewsCount ? ` with ${reviewsCount}` : ''} on Google Maps!\n\n` +
        `I noticed your business uses social media on Google Maps rather than a dedicated booking website, which makes it harder for mobile searchers to request instant quotes.\n\n` +
        `Would it be okay if I sent over a short 2-minute video teardown showing how a streamlined booking site can double your quote requests?`,
      keyHooksUsed: ['Social media only / No dedicated booking site'],
    };
  }

  if (hasNoWebsite) {
    return {
      subject: `Website idea for ${businessName}`,
      pitch:
        `Hi ${businessName} Team,\n\n` +
        `Huge congrats on your stellar ${rating || '5★'} reputation${reviewsCount ? ` with ${reviewsCount}` : ''} on Google Maps—local clients clearly love your service!\n\n` +
        `I noticed you don't have an active website listed on your Google profile yet, which means nearby customers searching on smartphones might be calling competitors instead.\n\n` +
        `Would it be okay if I sent over a short 2-minute video teardown with a modern website mockup designed specifically for ${businessName}?`,
      keyHooksUsed: ['No website listed on Google Maps'],
    };
  }

  let flawSentence = '';
  if (audit?.pageSpeed && audit.pageSpeed.score < 60) {
    flawSentence = `While looking at top local services, I noticed your mobile speed is ${audit.pageSpeed.score}/100 and missing Local Business schema, causing mobile searchers to bounce before calling.`;
  } else if (hooks.length > 0) {
    flawSentence = `While reviewing your online presence on ${cleanDomain}, I noticed your site ${hooks[0].toLowerCase()} which is likely reducing inbound phone inquiries.`;
  } else {
    flawSentence = `While checking out your website (${cleanDomain}), I spotted 2 quick mobile optimization tweaks that could significantly increase your monthly estimate requests.`;
  }

  return {
    subject: `Quick suggestion for ${cleanDomain || businessName}`,
    pitch:
      `Hi ${businessName} Team,\n\n` +
      `Congrats on your fantastic ${rating ? `${rating} reputation` : 'reviews'}${reviewsCount ? ` across ${reviewsCount}` : ''} on Google Maps!\n\n` +
      `${flawSentence}\n\n` +
      `Would it be okay if I sent over a short 2-minute video teardown showing exactly how to fix this?`,
    keyHooksUsed: hooks.slice(0, 2),
  };
}
