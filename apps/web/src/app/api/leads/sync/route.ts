import { NextRequest, NextResponse } from 'next/server';
import { dbBatchInsertLeads, dbUpdateLead } from '@/lib/supabase';
import { auditWebsite } from '@/lib/audit';
import { generateColdPitch } from '@/lib/gemini';
import { ExtractedLeadInput } from '@/lib/types';

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

// POST /api/leads/sync - Batch sync from Chrome Extension
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

    // Insert batch of leads
    const insertedLeads = await dbBatchInsertLeads(
      rawLeads.map((l) => ({
        business_name: l.business_name || 'Unnamed Business',
        phone: l.phone || null,
        rating: typeof l.rating === 'number' ? l.rating : 0,
        reviews_count: typeof l.reviews_count === 'number' ? l.reviews_count : 0,
        maps_url: l.maps_url || null,
        website_url: l.website_url || null,
        unlinked_gmb_website: Boolean(l.unlinked_gmb_website),
        socials: l.socials || null,
        email: l.email || null,
        status: 'pending',
      }))
    );

    // Auto-audit leads with websites in background
    const leadsWithWebsites = insertedLeads.filter((l) => !!l.website_url).slice(0, 5);
    (async () => {
      for (const lead of leadsWithWebsites) {
        if (!lead.website_url) continue;
        try {
          const auditResult = await auditWebsite(lead.website_url, {
            unlinkedGmbWebsite: Boolean(lead.unlinked_gmb_website),
          });
          const pitchResult = await generateColdPitch(lead, auditResult);

          await dbUpdateLead(lead.id, {
            status: 'audited',
            audit_data: auditResult,
            email: lead.email || (auditResult.extractedEmails.length > 0 ? auditResult.extractedEmails[0] : null),
            socials: lead.socials || auditResult.socials,
            ai_subject: pitchResult.subject,
            ai_pitch: pitchResult.pitch,
          });
        } catch (auditErr) {
          console.warn(`[Sync Auto-Audit Error] Lead ${lead.id}:`, auditErr);
        }
      }
    })().catch((err) => console.error('[Background Sync Worker Error]', err));

    return corsResponse({
      success: true,
      syncedCount: insertedLeads.length,
      message: `Successfully synced ${insertedLeads.length} leads to FetchPro Dashboard!`,
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
