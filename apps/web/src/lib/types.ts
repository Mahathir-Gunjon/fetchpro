export type LeadStatus = 'pending' | 'audited' | 'emailed';

export interface AuditIssue {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  impactScore: number; // Penalty deducted or reward
}

export interface AuditData {
  url: string;
  healthScore: number; // 0 - 100
  auditedAt: string;
  responseTimeMs: number;
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
  audit_data?: AuditData | null;
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
  status?: string;
}

export interface PitchGenerationResult {
  subject: string;
  pitch: string;
  keyHooksUsed: string[];
}

export interface DashboardStats {
  totalLeads: number;
  auditedLeads: number;
  averageHealthScore: number;
  emailsSent: number;
  leadsWithWebsites: number;
  leadsWithPhones: number;
}
