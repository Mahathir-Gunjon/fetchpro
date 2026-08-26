import { Lead, AuditData, LeadStatus, QualificationLog } from './types';

export interface OpportunityScoreResult {
  score: number; // 0 - 100
  reasons: string[];
  recommendedStatus: LeadStatus;
  qualification_log: QualificationLog;
}

/**
 * Deterministic Opportunity & Qualification Reasoning Engine
 * Evaluates leads with transparent checklist breakdown for the "Why Picked?" modal.
 */
export function calculateOpportunityScore(
  lead: Partial<Lead>,
  audit?: AuditData | null
): OpportunityScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const websiteUrl = lead.website_url || audit?.url;
  const reviewsCount = typeof lead.reviews_count === 'number' ? lead.reviews_count : 0;
  const socials = lead.socials || audit?.socials;

  const hasFacebook = Boolean(socials?.facebook);
  const hasInstagram = Boolean(socials?.instagram);
  const hasTiktok = Boolean(socials?.tiktok);

  // 1. No Website Found -> Instant Qualified Hot Lead
  if (!websiteUrl) {
    const qualLog: QualificationLog = {
      is_qualified: true,
      primary_reason: 'No Website Found on Profile or Web Results (Immediate Need for Full Site Build)',
      qualification_tag: 'NO_WEBSITE',
      checks: {
        google_maps_website_button: false,
        web_results_matched: false,
        facebook_page_found: hasFacebook,
        instagram_page_found: hasInstagram,
        tiktok_page_found: hasTiktok,
        ssl_valid: null,
        copyright_year: null,
        mobile_speed_score: null,
        missing_local_schema: null,
      },
      score: 95,
    };

    return {
      score: 95,
      reasons: ['No Website Found on Google Maps (Prime Prospect for Complete Website Build)'],
      recommendedStatus: 'hot_lead',
      qualification_log: qualLog,
    };
  }

  // 2. Mobile PageSpeed Insights (< 50 -> +30, 50-70 -> +15)
  let mobileSpeedScore: number | null = null;
  if (audit?.pageSpeed) {
    mobileSpeedScore = audit.pageSpeed.score;
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
  let copyrightYear: number | null = null;
  let isBackdated = false;
  if (audit?.copyright?.detectedYear) {
    copyrightYear = audit.copyright.detectedYear;
    if (copyrightYear <= 2023) {
      isBackdated = true;
      score += 25;
      reasons.push(`Backdated Copyright (${copyrightYear})`);
    }
  }

  if (audit?.mobileResponsive && !audit.mobileResponsive.isMobileFriendly) {
    if (!isBackdated) score += 25;
    reasons.push('Missing Responsive Mobile Viewport');
  }

  if (audit?.ctaCheck && !audit.ctaCheck.hasClearCta) {
    score += 15;
    reasons.push('Missing Direct Call-To-Action (Call/Quote Button)');
  }

  // 4. Missing Local Schema or Meta Tags (+20)
  let missingSchema = false;
  if (audit?.localSeo) {
    missingSchema = !audit.localSeo.hasLocalSchema;
    if (missingSchema) {
      score += 20;
      reasons.push('Missing LocalBusiness JSON-LD Schema');
    }
  }

  if (audit?.meta && (!audit.meta.description || !audit.meta.title)) {
    score += 15;
    reasons.push('Missing SEO Meta Title or Description');
  }

  // 5. SSL Security Check
  const sslValid = audit?.ssl ? audit.ssl.hasSsl && audit.ssl.valid : null;
  if (audit?.ssl && (!audit.ssl.hasSsl || !audit.ssl.valid)) {
    score += 25;
    reasons.push('Insecure / Missing SSL Certificate (Not Secure)');
  }

  // 6. GMB Review Optimization Gap (< 30 reviews -> +15)
  if (reviewsCount > 0 && reviewsCount < 30) {
    score += 15;
    reasons.push(`Low GMB Review Count (${reviewsCount} reviews)`);
  }

  // Cap score at 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine Tag & Primary Reason
  let primaryReason = 'Active Website with High Digital Conversion Opportunity';
  let tag: QualificationLog['qualification_tag'] = 'QUALIFIED_HOT';

  if (isBackdated && mobileSpeedScore && mobileSpeedScore < 60) {
    primaryReason = `Outdated & Slow Website (Speed: ${mobileSpeedScore}/100, Copyright ${copyrightYear})`;
    tag = 'OUTDATED_WEBSITE';
  } else if (mobileSpeedScore && mobileSpeedScore < 50) {
    primaryReason = `Severe Mobile Speed Latency (${mobileSpeedScore}/100 PageSpeed)`;
    tag = 'SLOW_PAGESPEED';
  } else if (sslValid === false) {
    primaryReason = 'Insecure Website Warning (Missing SSL/HTTPS Certificate)';
    tag = 'INSECURE_SSL';
  } else if (missingSchema) {
    primaryReason = 'Missing LocalBusiness Schema & Google Maps SEO Signals';
    tag = 'MISSING_SCHEMA';
  } else if (isBackdated) {
    primaryReason = `Neglected / Backdated Website (Copyright ${copyrightYear})`;
    tag = 'OUTDATED_WEBSITE';
  } else if (finalScore <= 15 && (audit?.healthScore || 85) >= 80) {
    primaryReason = 'Website is fully modern, fast, and optimized (100% OK)';
    tag = 'PERFECT_SITE';
  }

  const isQualified = finalScore >= 40 || tag !== 'PERFECT_SITE';

  const qualLog: QualificationLog = {
    is_qualified: isQualified,
    primary_reason: primaryReason,
    qualification_tag: tag,
    checks: {
      google_maps_website_button: Boolean(lead.website_url),
      web_results_matched: true,
      facebook_page_found: hasFacebook,
      instagram_page_found: hasInstagram,
      tiktok_page_found: hasTiktok,
      ssl_valid: sslValid,
      copyright_year: copyrightYear,
      mobile_speed_score: mobileSpeedScore,
      missing_local_schema: missingSchema,
    },
    score: finalScore,
  };

  let recommendedStatus: LeadStatus = 'audited';
  if (finalScore >= 45) {
    recommendedStatus = 'hot_lead';
  } else if (tag === 'PERFECT_SITE' && lead.status !== 'emailed') {
    recommendedStatus = 'trash';
  } else if (lead.status === 'emailed') {
    recommendedStatus = 'emailed';
  }

  return {
    score: finalScore,
    reasons,
    recommendedStatus,
    qualification_log: qualLog,
  };
}

/**
 * Intelligent Funnel Filter:
 * Ranks leads, attaches structured qualification reasoning,
 * and classifies the Top 20-30% into hot_lead.
 */
export function classifyBatchFunnel(leads: Lead[]): Lead[] {
  if (!leads || leads.length === 0) return [];

  const scoredList = leads.map((lead) => {
    const opp = calculateOpportunityScore(lead, lead.audit_data);
    return {
      ...lead,
      opportunity_score: opp.score,
      opportunity_reasons: opp.reasons,
      qualification_log: opp.qualification_log,
      _calculatedStatus: opp.recommendedStatus,
    };
  });

  const scores = scoredList.map((l) => l.opportunity_score || 0).sort((a, b) => b - a);
  const top30Index = Math.max(0, Math.floor(scores.length * 0.3) - 1);
  const top30Threshold = scores[top30Index] || 45;

  return scoredList.map((lead) => {
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
