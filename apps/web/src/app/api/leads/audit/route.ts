import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeadById, dbUpdateLead } from '@/lib/supabase';
import { runLeadAuditAndQualification } from '@/lib/audit-engine';

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

// POST /api/leads/audit - Trigger server-side multi-layer website & SEO audit + qualification logic
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, url } = body;

    let targetUrl = url;
    let lead = null;

    if (leadId) {
      lead = await dbGetLeadById(leadId);
      if (!lead) {
        return corsResponse({ success: false, error: 'Lead not found' }, 404);
      }
      targetUrl = targetUrl || lead.gmb_website_url || lead.website_url || lead.discovered_website;
    }

    if (!targetUrl && !lead) {
      return corsResponse(
        { success: false, error: 'Website URL or Lead ID is required for audit' },
        400
      );
    }

    // Run Full Server-side Audit & Qualification Pipeline
    const auditRunResult = await runLeadAuditAndQualification(
      lead || {
        website_url: targetUrl,
        gmb_website_url: targetUrl,
      },
      { generatePitch: true }
    );

    const {
      auditData,
      is_qualified,
      opportunity_score,
      opportunity_reasons,
      qualification_log,
      pitchResult,
      recommendedStatus,
    } = auditRunResult;

    // If linked to a lead, update DB
    let updatedLead = lead;
    if (leadId && lead) {
      const newEmail =
        lead.email ||
        (auditData && auditData.extractedEmails.length > 0 ? auditData.extractedEmails[0] : null);

      const combinedSocials = {
        ...(lead.social_profiles || lead.socials || {}),
        ...(auditData?.socials || {}),
      };

      updatedLead = await dbUpdateLead(leadId, {
        website_url: targetUrl || lead.website_url,
        audit_data: auditData,
        socials: Object.keys(combinedSocials).length > 0 ? combinedSocials : null,
        social_profiles: Object.keys(combinedSocials).length > 0 ? combinedSocials : null,
        email: newEmail,
        is_qualified: is_qualified,
        opportunity_score: opportunity_score,
        opportunity_reasons: opportunity_reasons,
        qualification_log: qualification_log,
        status: lead.status === 'emailed' ? 'emailed' : recommendedStatus,
        ai_subject: pitchResult?.subject || lead.ai_subject,
        ai_pitch: pitchResult?.pitch || lead.ai_pitch,
      });
    }

    return corsResponse({
      success: true,
      auditData,
      is_qualified,
      opportunityScore: opportunity_score,
      qualification_log,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error('[Audit API Error]', error);
    return corsResponse(
      { success: false, error: error.message || 'Audit failed' },
      500
    );
  }
}
