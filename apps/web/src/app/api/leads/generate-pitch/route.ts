import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeadById, dbUpdateLead } from '@/lib/supabase';
import { generateColdPitch } from '@/lib/gemini';

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

// POST /api/leads/generate-pitch - Generate or regenerate Gemini AI cold pitch
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return corsResponse({ success: false, error: 'Lead ID is required' }, 400);
    }

    const lead = await dbGetLeadById(leadId);
    if (!lead) {
      return corsResponse({ success: false, error: 'Lead not found' }, 404);
    }

    // Generate pitch
    const pitchResult = await generateColdPitch(lead, lead.audit_data);

    // Update in database
    const updatedLead = await dbUpdateLead(leadId, {
      ai_subject: pitchResult.subject,
      ai_pitch: pitchResult.pitch,
    });

    return corsResponse({
      success: true,
      subject: pitchResult.subject,
      pitch: pitchResult.pitch,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error('[Generate Pitch API Error]', error);
    return corsResponse(
      { success: false, error: error.message || 'Failed to generate pitch' },
      500
    );
  }
}
