import { NextRequest, NextResponse } from 'next/server';
import { dbBatchInsertLeads } from '@/lib/supabase';
import { ExtractedLeadInput } from '@/lib/types';
import { evaluateQualification } from '@/lib/audit-engine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function corsResponse(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

export async function OPTIONS() {
  return corsResponse({ ok: true });
}

// POST /api/leads/sync - Batch sync from Chrome Extension with High-Fidelity GMB extraction
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const serverSecret = process.env.LEADFLOW_API_SECRET;

    if (serverSecret && authHeader) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token !== serverSecret) {
        return corsResponse({ success: false, error: 'Unauthorized: Invalid API Key' }, 401);
      }
    }

    const body = await req.json();
    const rawLeads: ExtractedLeadInput[] = body.leads || [];

    if (!Array.isArray(rawLeads) || rawLeads.length === 0) {
      return corsResponse({ success: false, error: 'No leads provided in payload' }, 400);
    }

    // Insert batch of leads with initial opportunity score & qualification log
    const insertedLeads = await dbBatchInsertLeads(
      rawLeads.map((l) => {
        const targetUrl = l.gmb_website_url || l.website_url || l.discovered_website;
        const socials = l.social_profiles || l.socials;

        const qual = evaluateQualification(
          {
            business_name: l.business_name,
            website_url: targetUrl,
            gmb_website_url: l.gmb_website_url,
            discovered_website: l.discovered_website,
            social_profiles: socials,
            rating: l.rating,
            reviews_count: l.reviews_count,
          },
          null
        );

        return {
          business_name: l.business_name || 'Unnamed Business',
          phone: l.phone || null,
          rating: typeof l.rating === 'number' ? l.rating : 0,
          reviews_count: typeof l.reviews_count === 'number' ? l.reviews_count : 0,
          category: l.category || null,
          address: l.address || null,
          maps_url: l.maps_url || null,
          gmb_website_url: l.gmb_website_url || null,
          website_url: targetUrl || null,
          discovered_website: l.discovered_website || null,
          web_results_links: l.web_results_links || null,
          socials: socials || null,
          social_profiles: socials || null,
          email: l.email || null,
          is_qualified: qual.is_qualified,
          opportunity_score: qual.opportunity_score,
          opportunity_reasons: qual.opportunity_reasons,
          qualification_log: qual.qualification_log,
          status: !targetUrl ? 'hot_lead' : 'pending',
        };
      })
    );

    return corsResponse({
      success: true,
      syncedCount: insertedLeads.length,
      message: `Successfully synced ${insertedLeads.length} leads to FetchPro! Ready for multi-layer audit.`,
      leads: insertedLeads,
    });
  } catch (error: any) {
    console.error('[Sync API Error]', error);
    return corsResponse(
      { success: false, error: error.message || 'Failed to sync leads' },
      500
    );
  }
}
