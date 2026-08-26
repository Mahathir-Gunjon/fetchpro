import { NextRequest, NextResponse } from 'next/server';
import { dbBatchInsertLeads } from '@/lib/supabase';
import { ExtractedLeadInput } from '@/lib/types';
import { calculateOpportunityScore } from '@/lib/scoring';

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

// POST /api/leads/sync - Batch sync from Chrome Extension with initial Opportunity & Qualification Scoring
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
        const initialOpp = calculateOpportunityScore(
          {
            business_name: l.business_name,
            website_url: l.website_url,
            rating: l.rating,
            reviews_count: l.reviews_count,
            socials: l.socials,
          },
          null
        );

        return {
          business_name: l.business_name || 'Unnamed Business',
          phone: l.phone || null,
          rating: typeof l.rating === 'number' ? l.rating : 0,
          reviews_count: typeof l.reviews_count === 'number' ? l.reviews_count : 0,
          maps_url: l.maps_url || null,
          website_url: l.website_url || null,
          socials: l.socials || null,
          email: l.email || null,
          opportunity_score: initialOpp.score,
          opportunity_reasons: initialOpp.reasons,
          qualification_log: initialOpp.qualification_log,
          status: !l.website_url ? 'hot_lead' : 'pending',
        };
      })
    );

    return corsResponse({
      success: true,
      syncedCount: insertedLeads.length,
      message: `Successfully synced ${insertedLeads.length} leads to FetchPro with Deep Qualification Reasoning.`,
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
