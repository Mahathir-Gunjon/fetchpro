export type LeadStatus = 'pending' | 'audited' | 'emailed' | 'hot_lead' | 'trash';

export interface SocialLinks {
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  twitter_x?: string | null;
  youtube?: string | null;
  yelp?: string | null;
  mapquest?: string | null;
  yellowpages?: string | null;
  other_directories?: string[];
}

export interface WebResultLink {
  type:
    | 'website'
    | 'facebook'
    | 'instagram'
    | 'yelp'
    | 'linkedin'
    | 'twitter_x'
    | 'youtube'
    | 'mapquest'
    | 'directory'
    | 'other';
  url: string;
  title?: string;
}

export interface AuditIssue {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  impactScore: number;
}

export interface CoreWebVitals {
  fcp?: string; // First Contentful Paint
  lcp?: string; // Largest Contentful Paint
  cls?: string; // Cumulative Layout Shift
  inp?: string; // Interaction to Next Paint
}

export interface PageSpeedData {
  score: number; // 0 - 100
  fcp?: string;
  lcp?: string;
  cls?: string;
  inp?: string;
  isSlow: boolean;
  webVitals?: CoreWebVitals;
}

export interface LocalSeoData {
  hasLocalSchema: boolean;
  schemaTypes: string[];
  hasH1: boolean;
  hasH2: boolean;
  hasTitle: boolean;
  hasDescription: boolean;
  brokenLinks?: boolean;
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
  yelp_page_found?: boolean;
  ssl_valid: boolean | null;
  copyright_year: number | null;
  mobile_speed_score: number | null;
  missing_local_schema: boolean | null;
  seo_issues_count?: number;
}

export interface QualificationLog {
  is_qualified: boolean;
  primary_reason: string;
  qualification_tag:
    | 'NO_WEBSITE'
    | 'NO_ONLINE_PRESENCE'
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
  extractedPhones?: string[];
  socials?: SocialLinks;
  social_profiles?: SocialLinks;
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
  category?: string | null;
  address?: string | null;
  opening_hours?: string | null;
  description?: string | null;
  maps_url?: string | null;
  gmb_website_url?: string | null;
  website_url?: string | null;
  discovered_website?: string | null;
  website_source?: 'GMB_BUTTON' | 'WEB_RESULTS' | 'NONE' | string | null;
  web_results_links?: WebResultLink[] | null;
  email?: string | null;
  status: LeadStatus;
  is_qualified?: boolean;
  opportunity_score?: number | null;
  opportunity_reasons?: string[] | null;
  qualification_log?: QualificationLog | null;
  audit_data?: AuditData | null;
  socials?: SocialLinks | null;
  social_profiles?: SocialLinks | null;
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
  category?: string | null;
  address?: string | null;
  opening_hours?: string | null;
  description?: string | null;
  maps_url?: string | null;
  gmb_website_url?: string | null;
  website_url?: string | null;
  discovered_website?: string | null;
  website_source?: 'GMB_BUTTON' | 'WEB_RESULTS' | 'NONE' | string | null;
  web_results_links?: WebResultLink[] | null;
  socials?: SocialLinks | null;
  social_profiles?: SocialLinks | null;
  email?: string | null;
  status?: string;
  is_qualified?: boolean;
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
  qualifiedLeadsCount: number;
  hotLeadsCount: number;
  trashLeadsCount: number;
  averageHealthScore: number;
  emailsSent: number;
  leadsWithWebsites: number;
  leadsWithoutWebsites: number;
  leadsWithPhones: number;
}
