import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeads, dbUpdateLead } from '@/lib/supabase';
import { runLeadAuditAndQualification } from '@/lib/audit-engine';
import { Lead } from '@/lib/types';

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

// POST /api/leads/batch-audit - Batch audit with server-side audit engine and AI qualification reasoning
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const leadIds: string[] = body.leadIds || [];

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return corsResponse({ success: false, error: 'No lead IDs provided for batch audit' }, 400);
    }

    const allLeads = await dbGetLeads();
    const leadsToAudit = allLeads.filter((l) => leadIds.includes(l.id));

    if (leadsToAudit.length === 0) {
      return corsResponse(
        {
          success: false,
          error: 'None of the selected leads were found in database.',
        },
        400
      );
    }

    const updatedLeads: Lead[] = [];

    // Controlled concurrency of 3
    const CONCURRENCY = 3;
    for (let i = 0; i < leadsToAudit.length; i += CONCURRENCY) {
      const chunk = leadsToAudit.slice(i, i + CONCURRENCY);

      const chunkResults = await Promise.all(
        chunk.map(async (lead) => {
          try {
            const auditRunResult = await runLeadAuditAndQualification(lead, {
              generatePitch: true,
            });

            const {
              auditData,
              is_qualified,
              opportunity_score,
              opportunity_reasons,
              qualification_log,
              pitchResult,
              recommendedStatus,
            } = auditRunResult;

            const newEmail =
              lead.email ||
              (auditData && auditData.extractedEmails.length > 0 ? auditData.extractedEmails[0] : null);

            const combinedSocials = {
              ...(lead.social_profiles || lead.socials || {}),
              ...(auditData?.socials || {}),
            };

            const updated = await dbUpdateLead(lead.id, {
              status: lead.status === 'emailed' ? 'emailed' : recommendedStatus,
              audit_data: auditData,
              is_qualified: is_qualified,
              opportunity_score: opportunity_score,
              opportunity_reasons: opportunity_reasons,
              qualification_log: qualification_log,
              email: newEmail,
              socials: Object.keys(combinedSocials).length > 0 ? combinedSocials : null,
              social_profiles: Object.keys(combinedSocials).length > 0 ? combinedSocials : null,
              ai_subject: pitchResult?.subject || lead.ai_subject,
              ai_pitch: pitchResult?.pitch || lead.ai_pitch,
            });

            return updated;
          } catch (err: any) {
            console.error(`[Batch Audit Error] lead ${lead.id}:`, err);
            return null;
          }
        })
      );

      chunkResults.forEach((res) => {
        if (res) updatedLeads.push(res);
      });
    }

    return corsResponse({
      success: true,
      auditedCount: updatedLeads.length,
      message: `Audited ${updatedLeads.length} lead(s) with PageSpeed, CWV & Qualification Reasoning.`,
      leads: updatedLeads,
    });
  } catch (error: any) {
    console.error('[Batch Audit API Error]', error);
    return corsResponse(
      { success: false, error: error.message || 'Batch audit failed' },
      500
    );
  }
}
