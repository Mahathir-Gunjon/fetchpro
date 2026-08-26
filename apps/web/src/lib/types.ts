export type LeadStatus = 'pending' | 'audited' | 'emailed' | 'hot_lead' | 'trash';

export interface SocialLinks {
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  youtube?: string | null;
}

export interface AuditIssue {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  impactScore: number;
}

export interface PageSpeedData {
  score: number; // 0 - 100
  fcp?: string;  // e.g. "1.8 s"
  lcp?: string;  // e.g. "3.4 s"
  isSlow: boolean;
}

export interface LocalSeoData {
  hasLocalSchema: boolean;
  schemaTypes: string[];
  hasH1: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
}

export interface CtaCheckData {
  hasClearCta: boolean;
  ctaLabels: string[];
}

export interface QualificationChecks {
  google_maps_website_button: boolean;
  web_results_matched: boolean;
  facebook_page_found: boolean;
  instagram_page_found: boolean;
  tiktok_page_found: boolean;
  ssl_valid: boolean | null;
  copyright_year: number | null;
  mobile_speed_score: number | null;
  missing_local_schema: boolean | null;
}

export interface QualificationLog {
  is_qualified: boolean;
  primary_reason: string;
  qualification_tag:
    | 'NO_WEBSITE'
    | 'OUTDATED_WEBSITE'
    | 'SLOW_PAGESPEED'
    | 'MISSING_SCHEMA'
    | 'INSECURE_SSL'
    | 'QUALIFIED_HOT'
    | 'PERFECT_SITE';
  checks: QualificationChecks;
  score: number;
}

export interface AuditData {
  url: string;
  healthScore: number; // 0 - 100
  auditedAt: string;
  responseTimeMs: number;
  opportunityScore?: number;
  opportunityReasons?: string[];
  qualification_log?: QualificationLog;
  pageSpeed?: PageSpeedData;
  localSeo?: LocalSeoData;
  ctaCheck?: CtaCheckData;
  ssl: {
    hasSsl: boolean;
    valid: boolean;
    protocol?: string;
  };
  mobileResponsive: {
    hasViewport: boolean;
    viewportContent?: string;
    isMobileFriendly: boolean;
  };
  meta: {
    title?: string;
    titleLength?: number;
    description?: string;
    descriptionLength?: number;
    hasOgImage: boolean;
    favicon?: string;
  };
  techStack: {
    cms?: string;
    frameworks: string[];
    analytics: string[];
    server?: string;
  };
  copyright: {
    detectedYear?: number;
    isOutdated: boolean;
    currentYear: number;
    rawText?: string;
  };
  extractedEmails: string[];
  socials?: SocialLinks;
  issues: AuditIssue[];
  keyRecommendations: string[];
}

export interface Lead {
  id: string;
  user_id?: string;
  business_name: string;
  phone?: string | null;
  rating: number;
  reviews_count: number;
  maps_url?: string | null;
  website_url?: string | null;
  email?: string | null;
  status: LeadStatus;
  opportunity_score?: number | null;
  opportunity_reasons?: string[] | null;
  qualification_log?: QualificationLog | null;
  audit_data?: AuditData | null;
  socials?: SocialLinks | null;
  ai_pitch?: string | null;
  ai_subject?: string | null;
  emailed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ExtractedLeadInput {
  id?: string;
  business_name: string;
  phone?: string | null;
  rating?: number;
  reviews_count?: number;
  maps_url?: string | null;
  website_url?: string | null;
  email?: string | null;
  socials?: SocialLinks | null;
  status?: string;
  qualification_log?: QualificationLog | null;
}

export interface PitchGenerationResult {
  subject: string;
  pitch: string;
  keyHooksUsed: string[];
}

export interface DashboardStats {
  totalLeads: number;
  auditedLeads: number;
  hotLeadsCount: number;
  trashLeadsCount: number;
  averageHealthScore: number;
  emailsSent: number;
  leadsWithWebsites: number;
  leadsWithoutWebsites: number;
  leadsWithPhones: number;
}
