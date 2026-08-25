import { GoogleGenAI } from '@google/genai';
import { AuditData, Lead, PitchGenerationResult } from './types';

/**
 * Generate a high-converting 3-4 sentence cold outreach email
 * using Google Gemini AI, tailored to the lead's exact website audit flaws.
 */
export async function generateColdPitch(
  lead: Partial<Lead>,
  audit?: AuditData | null
): Promise<PitchGenerationResult> {
  const businessName = lead.business_name || 'Business Owner';
  const rating = lead.rating ? `${lead.rating}★` : '';
  const reviewsCount = lead.reviews_count ? `${lead.reviews_count} reviews` : '';
  const websiteUrl = lead.website_url || audit?.url || '';

  // Extract key hooks from audit
  const hooks: string[] = [];
  if (audit) {
    if (!audit.ssl.hasSsl || !audit.ssl.valid) {
      hooks.push('Website shows "Not Secure" warning in browsers (missing SSL).');
    }
    if (!audit.mobileResponsive.isMobileFriendly) {
      hooks.push('Site is not optimized for smartphone screens, hurting mobile conversions.');
    }
    if (audit.copyright.isOutdated && audit.copyright.detectedYear) {
      hooks.push(`Footer copyright hasn't been updated since ${audit.copyright.detectedYear}.`);
    }
    if (!audit.meta.description) {
      hooks.push('Missing Google search meta description, resulting in generic search snippets.');
    }
    if (audit.responseTimeMs > 2000) {
      hooks.push(`Slow page load speed (${(audit.responseTimeMs / 1000).toFixed(1)}s load latency).`);
    }
    if (audit.techStack.cms) {
      hooks.push(`Built on older ${audit.techStack.cms} template.`);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are a world-class B2B copywriter and web design agency outreach specialist.
Write a personalized, punchy, hyper-converting 3-4 sentence cold outreach email to the owner of "${businessName}".

Context:
- Business: ${businessName}
- Google Reputation: ${rating} with ${reviewsCount}
- Website: ${websiteUrl || 'No active website found'}
- Specific Website Audit Findings:
${hooks.length > 0 ? hooks.map((h) => `  * ${h}`).join('\n') : '  * Good foundation, but missing modern speed optimization and high-converting mobile CTA.'}

Rules for the Email:
1. Tone: Natural, helpful, respectful, peer-to-peer (no generic sleazy buzzwords like "synergy" or "game-changer").
2. Line 1: Genuine compliment on their high Google ratings / local reputation.
3. Line 2-3: Highlight the 1-2 exact website flaws found above and why it might be leaking local leads to competitors.
4. Line 4: Low-friction call-to-action (e.g. "I recorded a quick 60-second video mockup showing how to fix this—would you be open to seeing it?").
5. Return JSON format with two keys:
   - "subject": A short, casual, curiosity-inducing subject line (e.g. "quick question for {Business Name}", "noticed something on {Domain}")
   - "pitch": The 3-4 sentence body text.

Respond ONLY with valid JSON:
{"subject": "...", "pitch": "..."}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      // Parse JSON from response
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
      console.warn('[Gemini AI] API call failed or rate limited, falling back to smart heuristic generator:', error.message);
    }
  }

  // Smart Heuristic Fallback Generator (Guaranteed output)
  return generateHeuristicPitch(businessName, rating, reviewsCount, hooks, websiteUrl);
}

/**
 * Intelligent template-based generator fallback
 */
function generateHeuristicPitch(
  businessName: string,
  rating: string,
  reviewsCount: string,
  hooks: string[],
  websiteUrl: string
): PitchGenerationResult {
  const cleanDomain = websiteUrl ? websiteUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : '';
  const subject = cleanDomain
    ? `Quick suggestion for ${cleanDomain}`
    : `Quick question regarding ${businessName}`;

  let flawSentence = '';
  if (hooks.length > 0) {
    const primaryHook = hooks[0].toLowerCase();
    flawSentence = `While looking up top-rated services in the area, I noticed your site (${cleanDomain || businessName}) ${primaryHook} which might be costing you calls from mobile searchers.`;
  } else {
    flawSentence = `While checking out your online presence, I noticed your website has huge potential for a modern visual facelift to convert more visitors into booked appointments.`;
  }

  const pitch = `Hi ${businessName} Team,\n\n` +
    `Huge congrats on your fantastic ${rating ? `${rating} reputation` : 'customer reviews'}${reviewsCount ? ` across ${reviewsCount}` : ''} on Google Maps—clearly your clients love your work.\n\n` +
    `${flawSentence}\n\n` +
    `I put together a quick 60-second video walkthrough with 3 quick fixes to boost your booking conversion rate. Would you be open to me sending that over?`;

  return {
    subject,
    pitch,
    keyHooksUsed: hooks,
  };
}
