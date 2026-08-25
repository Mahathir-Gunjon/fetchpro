import { Lead } from './types';

// Default is 0 dummy data (clean slate as requested by user)
export const INITIAL_MOCK_LEADS: Lead[] = [];

// Available only if the user explicitly clicks "Load Sample Demo Leads"
export const SAMPLE_DEMO_LEADS: Lead[] = [
  {
    id: 'lead-demo-001',
    business_name: 'Apex Precision Plumbing & Rooter',
    phone: '(512) 555-0194',
    rating: 4.8,
    reviews_count: 22,
    maps_url: 'https://www.google.com/maps/place/Apex+Precision+Plumbing',
    website_url: 'http://apexplumbingtx.com',
    email: 'contact@apexplumbingtx.com',
    status: 'hot_lead',
    opportunity_score: 85,
    opportunity_reasons: [
      'Critical Mobile Speed (34/100)',
      'Backdated Copyright (2019)',
      'Missing LocalBusiness Schema',
      'Insecure SSL (Not Secure)',
    ],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    socials: {
      facebook: 'https://facebook.com/apexplumbingtx',
      instagram: 'https://instagram.com/apexplumbingtx',
      tiktok: 'https://tiktok.com/@apexplumbingtx',
    },
    audit_data: {
      url: 'http://apexplumbingtx.com',
      healthScore: 35,
      auditedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      responseTimeMs: 2450,
      pageSpeed: {
        score: 34,
        fcp: '3.2 s',
        lcp: '5.8 s',
        isSlow: true,
      },
      localSeo: {
        hasLocalSchema: false,
        schemaTypes: [],
        hasH1: false,
        hasTitle: true,
        hasDescription: false,
      },
      ctaCheck: {
        hasClearCta: false,
        ctaLabels: [],
      },
      ssl: {
        hasSsl: false,
        valid: false,
        protocol: 'HTTP (Insecure)',
      },
      mobileResponsive: {
        hasViewport: false,
        isMobileFriendly: false,
      },
      meta: {
        title: 'Apex Plumbing - Best Plumber',
        titleLength: 28,
        descriptionLength: 0,
        hasOgImage: false,
      },
      techStack: {
        cms: 'WordPress',
        frameworks: ['jQuery', 'Bootstrap'],
        analytics: ['Google Analytics'],
      },
      copyright: {
        detectedYear: 2019,
        isOutdated: true,
        currentYear: 2026,
        rawText: 'Copyright © 2019 Apex Plumbing',
      },
      extractedEmails: ['contact@apexplumbingtx.com'],
      socials: {
        facebook: 'https://facebook.com/apexplumbingtx',
        instagram: 'https://instagram.com/apexplumbingtx',
        tiktok: 'https://tiktok.com/@apexplumbingtx',
      },
      issues: [
        {
          type: 'error',
          title: 'Critical Mobile Speed (34/100)',
          description: 'PageSpeed score is 34/100. High mobile abandonment.',
          impactScore: -25,
        },
        {
          type: 'error',
          title: 'Missing SSL Certificate',
          description: 'Visitors see "Not Secure" warning in Chrome and Safari.',
          impactScore: -25,
        },
        {
          type: 'warning',
          title: 'Missing LocalBusiness Schema',
          description: 'No structured data found for Google Maps local pack.',
          impactScore: -15,
        },
        {
          type: 'warning',
          title: 'Backdated Copyright (2019)',
          description: 'Footer shows copyright 2019.',
          impactScore: -15,
        },
      ],
      keyRecommendations: [
        'Speed optimization & image compression to reach 90+ PageSpeed.',
        'Add LocalBusiness JSON-LD schema with NAP information.',
        'Install SSL certificate (HTTPS) and mobile booking CTA.',
      ],
    },
    ai_subject: 'Quick question for Apex Precision Plumbing',
    ai_pitch:
      'Hi Apex Precision Plumbing Team,\n\n' +
      'Congrats on your 4.8★ reputation across Google Maps!\n\n' +
      'While checking apexplumbingtx.com, I noticed your mobile speed is loading at 34/100 and missing Local Business markup, which causes nearby smartphone searchers to bounce before calling.\n\n' +
      'Would it be okay if I sent over a short 2-minute video teardown showing how to fix this?',
  },
  {
    id: 'lead-demo-002',
    business_name: 'Lone Star Family Dental',
    phone: '(214) 555-9922',
    rating: 4.9,
    reviews_count: 88,
    maps_url: 'https://www.google.com/maps/place/Lone+Star+Dental',
    website_url: null,
    email: null,
    status: 'hot_lead',
    opportunity_score: 95,
    opportunity_reasons: ['No Website Found (Immediate Need for Full Site Build)'],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    socials: {
      facebook: 'https://facebook.com/lonestardental',
      instagram: 'https://instagram.com/lonestardental',
    },
    audit_data: null,
    ai_subject: 'Website proposal for Lone Star Family Dental',
    ai_pitch:
      'Hi Lone Star Family Dental Team,\n\n' +
      'Huge congrats on your stellar 4.9★ reputation across 88 Google reviews!\n\n' +
      'I noticed you do not have an active website listed on your Google profile yet, which means nearby patients looking for online scheduling might be calling competitors instead.\n\n' +
      'Would it be okay if I sent over a short 2-minute video teardown with a modern website mockup designed specifically for Lone Star?',
  },
];
