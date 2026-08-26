import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeads, dbUpdateLead } from '@/lib/supabase';
import { auditWebsite } from '@/lib/audit';
import { generateColdPitch } from '@/lib/gemini';
import { calculateOpportunityScore } from '@/lib/scoring';
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

// POST /api/leads/batch-audit - Batch audit with opportunity scoring and AI qualification reasoning
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const leadIds: string[] = body.leadIds || [];

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return corsResponse({ success: false, error: 'No lead IDs provided for batch audit' }, 400);
    }

    const allLeads = await dbGetLeads();
    const leadsToAudit = allLeads.filter((l) => leadIds.includes(l.id) && !!l.website_url);

    if (leadsToAudit.length === 0) {
      return corsResponse(
        {
          success: false,
          error: 'None of the selected leads have website URLs to audit.',
        },
        400
      );
    }

    const updatedLeads: Lead[] = [];

    // Process with controlled concurrency of 3
    const CONCURRENCY = 3;
    for (let i = 0; i < leadsToAudit.length; i += CONCURRENCY) {
      const chunk = leadsToAudit.slice(i, i + CONCURRENCY);

      const chunkResults = await Promise.all(
        chunk.map(async (lead) => {
          try {
            const auditResult = await auditWebsite(lead.website_url!, {
              reviewsCount: lead.reviews_count,
            });

            const opp = calculateOpportunityScore(lead, auditResult);
            auditResult.opportunityScore = opp.score;
            auditResult.opportunityReasons = opp.reasons;
            auditResult.qualification_log = opp.qualification_log;

            // Generate pitch for hot leads (zero-waste execution)
            const pitchResult = await generateColdPitch(
              { ...lead, status: opp.recommendedStatus },
              auditResult
            );

            const newEmail =
              lead.email ||
              (auditResult.extractedEmails.length > 0 ? auditResult.extractedEmails[0] : null);
            const combinedSocials = {
              ...(lead.socials || {}),
              ...(auditResult.socials || {}),
            };

            const updated = await dbUpdateLead(lead.id, {
              status: lead.status === 'emailed' ? 'emailed' : opp.recommendedStatus,
              audit_data: auditResult,
              opportunity_score: opp.score,
              opportunity_reasons: opp.reasons,
              qualification_log: opp.qualification_log,
              email: newEmail,
              socials: Object.keys(combinedSocials).length > 0 ? combinedSocials : null,
              ai_subject: pitchResult.subject,
              ai_pitch: pitchResult.pitch,
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
      message: `Audited ${updatedLeads.length} website(s) with PageSpeed & Qualification Reasoning.`,
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
