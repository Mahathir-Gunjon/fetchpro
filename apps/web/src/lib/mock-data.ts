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
    reviews_count: 142,
    maps_url: 'https://www.google.com/maps/place/Apex+Precision+Plumbing',
    website_url: 'http://apexplumbingtx.com',
    email: 'contact@apexplumbingtx.com',
    status: 'audited',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    socials: {
      facebook: 'https://facebook.com/apexplumbingtx',
      instagram: 'https://instagram.com/apexplumbingtx',
    },
    audit_data: {
      url: 'http://apexplumbingtx.com',
      healthScore: 40,
      auditedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      responseTimeMs: 2450,
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
      },
      issues: [
        {
          type: 'error',
          title: 'Missing SSL Certificate',
          description: 'Visitors see "Not Secure" warning in Chrome and Safari.',
          impactScore: -25,
        },
        {
          type: 'error',
          title: 'Not Mobile Friendly',
          description: 'No responsive viewport tag detected.',
          impactScore: -20,
        },
      ],
      keyRecommendations: [
        'Install SSL certificate and redesign for mobile booking conversion.',
      ],
    },
    ai_subject: 'Quick question for Apex Precision Plumbing',
    ai_pitch:
      'Hi Apex Precision Plumbing Team,\n\n' +
      'Congrats on your 4.8★ reputation across 142 reviews on Google Maps!\n\n' +
      'While checking apexplumbingtx.com, I noticed it triggers a "Not Secure" warning and is missing a mobile viewport tag.\n\n' +
      'I created a quick 45-second video mockup showing how to fix this—would you be open to seeing it?',
  },
  {
    id: 'lead-demo-002',
    business_name: 'Lone Star Family Dental (No Website)',
    phone: '(214) 555-9922',
    rating: 4.9,
    reviews_count: 88,
    maps_url: 'https://www.google.com/maps/place/Lone+Star+Dental',
    website_url: null,
    email: null,
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    socials: null,
    audit_data: null,
    ai_subject: 'Website proposal for Lone Star Family Dental',
    ai_pitch:
      'Hi Lone Star Family Dental Team,\n\n' +
      'Huge congrats on your stellar 4.9★ reputation across 88 Google reviews!\n\n' +
      'I noticed you do not have a website linked on your Google profile, which means nearby patients looking for online scheduling might be calling competitors.\n\n' +
      'I put together a 60-second video walkthrough of a modern patient booking website tailored for Lone Star. Open to seeing it?',
  },
];
