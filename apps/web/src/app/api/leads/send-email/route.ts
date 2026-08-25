import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeadById, dbUpdateLead } from '@/lib/supabase';
import { sendOutreachEmail } from '@/lib/resend';

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

// POST /api/leads/send-email - Send cold outreach email via Resend
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, to, subject, pitchBody } = body;

    if (!to || !to.includes('@')) {
      return corsResponse(
        { success: false, error: 'A valid recipient email address is required' },
        400
      );
    }

    if (!subject || !pitchBody) {
      return corsResponse(
        { success: false, error: 'Email subject and body are required' },
        400
      );
    }

    let businessName = 'Business Owner';
    let lead = null;

    if (leadId) {
      lead = await dbGetLeadById(leadId);
      if (lead) {
        businessName = lead.business_name;
      }
    }

    // Send email via Resend
    const result = await sendOutreachEmail({
      to,
      subject,
      pitchBody,
      businessName,
    });

    if (!result.success) {
      return corsResponse(
        { success: false, error: result.error || 'Failed to send email' },
        500
      );
    }

    // Update lead status to 'emailed'
    let updatedLead = lead;
    if (leadId) {
      updatedLead = await dbUpdateLead(leadId, {
        status: 'emailed',
        email: to,
        ai_subject: subject,
        ai_pitch: pitchBody,
        emailed_at: new Date().toISOString(),
      });
    }

    return corsResponse({
      success: true,
      messageId: result.messageId,
      simulated: result.simulated,
      message: result.simulated
        ? `Outreach simulated in sandbox mode (to: ${to}). Add RESEND_API_KEY in .env.local for live delivery.`
        : `Email successfully sent to ${to}!`,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error('[Send Email API Error]', error);
    return corsResponse(
      { success: false, error: error.message || 'Failed to send outreach email' },
      500
    );
  }
}
