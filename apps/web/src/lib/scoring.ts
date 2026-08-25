import { Lead, AuditData, LeadStatus } from './types';

export interface OpportunityScoreResult {
  score: number; // 0 - 100
  reasons: string[];
  recommendedStatus: LeadStatus;
}

/**
 * Deterministic Opportunity Scoring Engine
 * Evaluates how valuable and high-converting this lead is for web agency outreach.
 */
export function calculateOpportunityScore(
  lead: Partial<Lead>,
  audit?: AuditData | null
): OpportunityScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const websiteUrl = lead.website_url || audit?.url;
  const reviewsCount = typeof lead.reviews_count === 'number' ? lead.reviews_count : 0;

  // 1. No Website Found -> Instant Top Opportunity
  if (!websiteUrl) {
    return {
      score: 95,
      reasons: ['No Website Found (Immediate Need for Full Site Build)'],
      recommendedStatus: 'hot_lead',
    };
  }

  // 2. Mobile PageSpeed Insights (< 50 -> +30, 50-70 -> +15)
  if (audit?.pageSpeed) {
    if (audit.pageSpeed.score < 50) {
      score += 30;
      reasons.push(`Critical Mobile Speed (${audit.pageSpeed.score}/100)`);
    } else if (audit.pageSpeed.score <= 70) {
      score += 15;
      reasons.push(`Suboptimal Mobile Speed (${audit.pageSpeed.score}/100)`);
    }
  } else if (audit?.responseTimeMs && audit.responseTimeMs > 2500) {
    score += 20;
    reasons.push(`Slow Server Response (${(audit.responseTimeMs / 1000).toFixed(1)}s)`);
  }

  // 3. Backdated Copyright (<= 2023) or UI / Viewport Flaws (+25)
  let hasUiOrCopyrightFlaw = false;
  if (audit?.copyright?.detectedYear && audit.copyright.detectedYear <= 2023) {
    score += 25;
    hasUiOrCopyrightFlaw = true;
    reasons.push(`Backdated Copyright (${audit.copyright.detectedYear})`);
  }

  if (audit?.mobileResponsive && !audit.mobileResponsive.isMobileFriendly) {
    if (!hasUiOrCopyrightFlaw) {
      score += 25;
      hasUiOrCopyrightFlaw = true;
    }
    reasons.push('Missing Responsive Mobile Viewport');
  }

  if (audit?.ctaCheck && !audit.ctaCheck.hasClearCta) {
    if (!hasUiOrCopyrightFlaw) {
      score += 15;
    }
    reasons.push('Missing Direct Booking / Quote Call-To-Action');
  }

  // 4. Missing Local Schema or Meta Tags (+20)
  let hasSeoFlaw = false;
  if (audit?.localSeo && !audit.localSeo.hasLocalSchema) {
    score += 20;
    hasSeoFlaw = true;
    reasons.push('Missing LocalBusiness JSON-LD Schema');
  }

  if (audit?.meta && (!audit.meta.description || !audit.meta.title)) {
    if (!hasSeoFlaw) {
      score += 15;
      hasSeoFlaw = true;
    }
    reasons.push('Missing SEO Title or Description');
  }

  // 5. SSL Security Check
  if (audit?.ssl && (!audit.ssl.hasSsl || !audit.ssl.valid)) {
    score += 25;
    reasons.push('Insecure / Missing SSL Certificate (Not Secure)');
  }

  // 6. GMB Review Optimization Gap (< 30 reviews -> +15)
  if (reviewsCount > 0 && reviewsCount < 30) {
    score += 15;
    reasons.push(`Low GMB Review Count (${reviewsCount} reviews)`);
  }

  // Cap at 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine Classification Status:
  // - Score >= 45: hot_lead (Top opportunity for immediate outreach)
  // - Flawless site (score < 15, valid SSL, speed >= 85, valid schema): trash (Auto-Archive)
  let recommendedStatus: LeadStatus = 'audited';

  const isFlawless =
    finalScore < 15 &&
    audit?.ssl?.valid &&
    (audit?.pageSpeed?.score || 85) >= 80 &&
    (audit?.localSeo?.hasLocalSchema || true);

  if (finalScore >= 45) {
    recommendedStatus = 'hot_lead';
  } else if (isFlawless && lead.status !== 'emailed') {
    recommendedStatus = 'trash';
  } else if (lead.status === 'emailed') {
    recommendedStatus = 'emailed';
  }

  return {
    score: finalScore,
    reasons,
    recommendedStatus,
  };
}

/**
 * Intelligent Funnel Filter:
 * Takes a list of leads, sorts them by Opportunity Score,
 * flags the Top 20-30% with score >= 40 as 'hot_lead',
 * and flags flawless / zero-opportunity sites as 'trash'.
 */
export function classifyBatchFunnel(leads: Lead[]): Lead[] {
  if (!leads || leads.length === 0) return [];

  // Calculate scores for all leads
  const scoredList = leads.map((lead) => {
    const opp = calculateOpportunityScore(lead, lead.audit_data);
    return {
      ...lead,
      opportunity_score: opp.score,
      opportunity_reasons: opp.reasons,
      _calculatedStatus: opp.recommendedStatus,
    };
  });

  // Calculate 70th percentile threshold (top 30%)
  const scores = scoredList.map((l) => l.opportunity_score || 0).sort((a, b) => b - a);
  const top30Index = Math.max(0, Math.floor(scores.length * 0.3) - 1);
  const top30Threshold = scores[top30Index] || 45;

  return scoredList.map((lead) => {
    // Preserve emailed status
    if (lead.status === 'emailed') {
      const { _calculatedStatus, ...clean } = lead;
      return clean;
    }

    const currentScore = lead.opportunity_score || 0;
    let finalStatus: LeadStatus = lead.status;

    if (currentScore >= Math.min(45, top30Threshold) || !lead.website_url) {
      finalStatus = 'hot_lead';
    } else if (currentScore <= 15 && lead.audit_data?.healthScore && lead.audit_data.healthScore >= 85) {
      finalStatus = 'trash';
    } else if (lead.status === 'pending' && lead.audit_data) {
      finalStatus = 'audited';
    }

    const { _calculatedStatus, ...clean } = lead;
    return {
      ...clean,
      status: finalStatus,
    };
  });
}
