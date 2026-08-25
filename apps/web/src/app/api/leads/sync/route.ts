import { NextRequest, NextResponse } from 'next/server';
import { dbBatchInsertLeads, dbUpdateLead } from '@/lib/supabase';
import { auditWebsite } from '@/lib/audit';
import { generateColdPitch } from '@/lib/gemini';
import { ExtractedLeadInput, Lead } from '@/lib/types';

// POST /api/leads/sync - Batch sync from Chrome Extension
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const serverSecret = process.env.LEADFLOW_API_SECRET;

    // Optional API Secret check
    if (serverSecret && authHeader) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token !== serverSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized: Invalid API Key' }, { status: 401 });
      }
    }

    const body = await req.json();
    const rawLeads: ExtractedLeadInput[] = body.leads || [];

    if (!Array.isArray(rawLeads) || rawLeads.length === 0) {
      return NextResponse.json({ success: false, error: 'No leads provided in payload' }, { status: 400 });
    }

    // Insert batch of leads
    const insertedLeads = await dbBatchInsertLeads(
      rawLeads.map((l) => ({
        business_name: l.business_name,
        phone: l.phone || null,
        rating: l.rating || 0,
        reviews_count: l.reviews_count || 0,
        maps_url: l.maps_url || null,
        website_url: l.website_url || null,
        email: l.email || null,
        status: 'pending',
      }))
    );

    // Auto-audit leads with websites in parallel (up to 3 concurrent)
    const leadsWithWebsites = insertedLeads.filter((l) => !!l.website_url).slice(0, 5);
    (async () => {
      for (const lead of leadsWithWebsites) {
        if (!lead.website_url) continue;
        try {
          const auditResult = await auditWebsite(lead.website_url);
          const pitchResult = await generateColdPitch(lead, auditResult);
          
          await dbUpdateLead(lead.id, {
            status: 'audited',
            audit_data: auditResult,
            email: lead.email || (auditResult.extractedEmails.length > 0 ? auditResult.extractedEmails[0] : null),
            ai_subject: pitchResult.subject,
            ai_pitch: pitchResult.pitch,
          });
        } catch (auditErr) {
          console.warn(`[Sync Auto-Audit Error] Lead ${lead.id}:`, auditErr);
        }
      }
    })().catch((err) => console.error('[Background Sync Worker Error]', err));

    return NextResponse.json({
      success: true,
      syncedCount: insertedLeads.length,
      message: `Successfully synced ${insertedLeads.length} leads. Background audit initiated.`,
      leads: insertedLeads,
    });
  } catch (error: any) {
    console.error('[Sync API Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to sync leads' },
      { status: 500 }
    );
  }
}
