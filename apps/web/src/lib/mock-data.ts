import { Lead } from './types';

export const INITIAL_MOCK_LEADS: Lead[] = [
  {
    id: 'lead-mock-001',
    business_name: 'Apex Precision Plumbing & Rooter',
    phone: '(512) 555-0194',
    rating: 4.8,
    reviews_count: 142,
    maps_url: 'https://www.google.com/maps/place/Apex+Precision+Plumbing',
    website_url: 'http://apexplumbingtx.com',
    email: 'contact@apexplumbingtx.com',
    status: 'audited',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    audit_data: {
      url: 'http://apexplumbingtx.com',
      healthScore: 42,
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
      extractedEmails: ['contact@apexplumbingtx.com', 'service@apexplumbingtx.com'],
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
          description: 'No responsive viewport tag detected; page displays as zoomed-out desktop.',
          impactScore: -20,
        },
        {
          type: 'warning',
          title: 'Outdated Copyright (2019)',
          description: 'Footer copyright is 7 years backdated, signaling low maintenance.',
          impactScore: -10,
        },
        {
          type: 'warning',
          title: 'Missing Meta Description',
          description: 'Search engines display arbitrary text snippets.',
          impactScore: -15,
        },
      ],
      keyRecommendations: [
        'Enable HTTPS certificate and enforce 301 redirects.',
        'Redesign with responsive modern layout to capture mobile emergency calls.',
        'Update footer copyright and contact intake form.',
      ],
    },
    ai_subject: 'Quick question for Apex Precision Plumbing',
    ai_pitch:
      'Hi Apex Precision Plumbing Team,\n\n' +
      'Huge congrats on your fantastic 4.8★ reputation across 142 reviews on Google Maps—Austin homeowners clearly trust your crew.\n\n' +
      'While looking at your site (apexplumbingtx.com), I noticed it triggers a "Not Secure" warning and lacks a mobile viewport, which likely causes 40%+ of emergency mobile visitors to bounce.\n\n' +
      'I created a 60-second video walkthrough showing how a modern mobile redesign could double your inbound calls. Would you be open to seeing it?',
  },
  {
    id: 'lead-mock-002',
    business_name: 'Vanguard Elite Roofing & Restoration',
    phone: '(305) 555-8321',
    rating: 4.9,
    reviews_count: 87,
    maps_url: 'https://www.google.com/maps/place/Vanguard+Elite+Roofing',
    website_url: 'https://vanguardroofingfl.com',
    email: 'info@vanguardroofingfl.com',
    status: 'emailed',
    emailed_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    audit_data: {
      url: 'https://vanguardroofingfl.com',
      healthScore: 68,
      auditedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      responseTimeMs: 1420,
      ssl: {
        hasSsl: true,
        valid: true,
        protocol: 'TLS 1.3 / HTTPS',
      },
      mobileResponsive: {
        hasViewport: true,
        viewportContent: 'width=device-width, initial-scale=1.0',
        isMobileFriendly: true,
      },
      meta: {
        title: 'Roofing Services Miami FL | Vanguard Elite Roofing',
        titleLength: 51,
        description: 'Vanguard Elite Roofing provides residential and commercial roofing in Miami.',
        descriptionLength: 76,
        hasOgImage: false,
      },
      techStack: {
        cms: 'Wix',
        frameworks: ['React'],
        analytics: ['Google Analytics', 'Meta Pixel'],
      },
      copyright: {
        detectedYear: 2021,
        isOutdated: true,
        currentYear: 2026,
        rawText: '© 2021 Vanguard Roofing FL',
      },
      extractedEmails: ['info@vanguardroofingfl.com', 'claims@vanguardroofingfl.com'],
      issues: [
        {
          type: 'warning',
          title: 'Outdated Copyright (2021)',
          description: 'Website has not refreshed footer date in 5 years.',
          impactScore: -10,
        },
        {
          type: 'warning',
          title: 'Missing Social Share Image',
          description: 'Sharing links on iMessage or WhatsApp shows no visual card.',
          impactScore: -5,
        },
      ],
      keyRecommendations: [
        'Add instant storm quote calculator to dramatically increase high-ticket quote submissions.',
        'Update copyright year and add client video testimonials.',
      ],
    },
    ai_subject: 'Noticed something on vanguardroofingfl.com',
    ai_pitch:
      'Hi Vanguard Elite Roofing Team,\n\n' +
      'Impressive 4.9★ rating across 87 reviews in Miami—your reputation for clean roofing work is outstanding.\n\n' +
      'Your site has a solid base on Wix, but is missing an instant estimate calculator and social preview tags, leaving high-intent storm inquiries on the table.\n\n' +
      'We recently added an instant roof estimator for a Florida contractor that tripled their online bookings. Open to seeing a 2-minute demo tailored for Vanguard?',
  },
  {
    id: 'lead-mock-003',
    business_name: 'BrightSmile Family Dental Care',
    phone: '(214) 555-4920',
    rating: 4.7,
    reviews_count: 231,
    maps_url: 'https://www.google.com/maps/place/BrightSmile+Dental',
    website_url: 'https://brightsmile-dallas.com',
    email: 'frontdesk@brightsmile-dallas.com',
    status: 'audited',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    audit_data: {
      url: 'https://brightsmile-dallas.com',
      healthScore: 55,
      auditedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      responseTimeMs: 3100,
      ssl: {
        hasSsl: true,
        valid: true,
        protocol: 'TLS 1.3 / HTTPS',
      },
      mobileResponsive: {
        hasViewport: true,
        viewportContent: 'width=device-width, initial-scale=1.0',
        isMobileFriendly: true,
      },
      meta: {
        title: 'BrightSmile Dental - Dallas Dentist',
        titleLength: 35,
        descriptionLength: 0,
        hasOgImage: false,
      },
      techStack: {
        cms: 'Squarespace',
        frameworks: ['jQuery'],
        analytics: ['Google Analytics'],
      },
      copyright: {
        detectedYear: 2020,
        isOutdated: true,
        currentYear: 2026,
        rawText: '© 2020 BrightSmile Dallas',
      },
      extractedEmails: ['frontdesk@brightsmile-dallas.com'],
      issues: [
        {
          type: 'warning',
          title: 'Slow Server Response (3.1s)',
          description: 'High page load delay increases patient drop-off on mobile.',
          impactScore: -15,
        },
        {
          type: 'warning',
          title: 'Missing Meta Description',
          description: 'No curated summary appears in Google local search results.',
          impactScore: -15,
        },
        {
          type: 'warning',
          title: 'Outdated Copyright (2020)',
          description: 'Website has not been updated since 2020.',
          impactScore: -10,
        },
      ],
      keyRecommendations: [
        'Integrate real-time 1-click patient appointment booking widget.',
        'Optimize high-res clinic images to bring load speed under 1 second.',
      ],
    },
    ai_subject: 'Patient booking question for BrightSmile Dental',
    ai_pitch:
      'Hi Dr. BrightSmile Team,\n\n' +
      'Congratulations on maintaining an exceptional 4.7★ across 231 patient reviews—your Dallas clinic clearly provides stellar patient care.\n\n' +
      'I noticed your site takes over 3 seconds to load on mobile and lacks direct online booking, which often frustrates prospective patients looking for urgent appointments.\n\n' +
      'Would you be open to a 30-second preview of a modern, lightning-fast patient scheduling widget built for dental clinics?',
  },
  {
    id: 'lead-mock-004',
    business_name: 'IronClad Commercial HVAC Solutions',
    phone: '(404) 555-7182',
    rating: 4.6,
    reviews_count: 53,
    maps_url: 'https://www.google.com/maps/place/IronClad+HVAC',
    website_url: 'http://ironcladhvacatl.com',
    email: null,
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    audit_data: null,
    ai_pitch: null,
  },
  {
    id: 'lead-mock-005',
    business_name: 'Starlight Architecture & Interior Design',
    phone: '(615) 555-9012',
    rating: 5.0,
    reviews_count: 38,
    maps_url: 'https://www.google.com/maps/place/Starlight+Architecture',
    website_url: 'https://starlightstudio.design',
    email: 'hello@starlightstudio.design',
    status: 'audited',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    audit_data: {
      url: 'https://starlightstudio.design',
      healthScore: 88,
      auditedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      responseTimeMs: 680,
      ssl: {
        hasSsl: true,
        valid: true,
        protocol: 'TLS 1.3 / HTTPS',
      },
      mobileResponsive: {
        hasViewport: true,
        viewportContent: 'width=device-width, initial-scale=1.0',
        isMobileFriendly: true,
      },
      meta: {
        title: 'Starlight Architecture | Luxury Modern Homes Nashville',
        titleLength: 54,
        description: 'Award-winning luxury architectural design and bespoke residential interiors in Nashville.',
        descriptionLength: 89,
        hasOgImage: true,
      },
      techStack: {
        cms: 'Webflow',
        frameworks: ['Tailwind CSS'],
        analytics: ['Google Analytics', 'Microsoft Clarity'],
      },
      copyright: {
        detectedYear: 2026,
        isOutdated: false,
        currentYear: 2026,
        rawText: '© 2026 Starlight Studio Design',
      },
      extractedEmails: ['hello@starlightstudio.design', 'press@starlightstudio.design'],
      issues: [
        {
          type: 'success',
          title: 'High Performance & Modern Tech',
          description: 'Fast response time and responsive Webflow structure.',
          impactScore: 0,
        },
      ],
      keyRecommendations: [
        'Site is in top-tier shape. Consider adding a high-ticket project budget filter on the contact page.',
      ],
    },
    ai_subject: 'Quick compliment on Starlight Studio\'s portfolio',
    ai_pitch:
      'Hi Starlight Architecture Team,\n\n' +
      'Stunning work on your residential portfolio—a flawless 5.0★ rating on Google is extremely rare and well-deserved.\n\n' +
      'Your Webflow site is visually gorgeous; we noticed high-end studios are adding interactive 3D project budget calculators to pre-qualify $200k+ inquiries before the initial consultation.\n\n' +
      'Would you like me to share a quick 1-page case study on how this boosted qualified architect leads by 40%?',
  },
  {
    id: 'lead-mock-006',
    business_name: 'Metro Legal Defense Group',
    phone: '(312) 555-6677',
    rating: 4.4,
    reviews_count: 119,
    maps_url: 'https://www.google.com/maps/place/Metro+Legal+Chicago',
    website_url: 'https://metrolegalchicago.com',
    email: 'intake@metrolegalchicago.com',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    audit_data: null,
    ai_pitch: null,
  },
];
