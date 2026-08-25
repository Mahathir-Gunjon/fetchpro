import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeadById, dbUpdateLead } from '@/lib/supabase';
import { generateColdPitch } from '@/lib/gemini';

// POST /api/leads/generate-pitch - Generate or regenerate Gemini AI cold pitch
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const lead = await dbGetLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Generate pitch
    const pitchResult = await generateColdPitch(lead, lead.audit_data);

    // Update in database
    const updatedLead = await dbUpdateLead(leadId, {
      ai_subject: pitchResult.subject,
      ai_pitch: pitchResult.pitch,
    });

    return NextResponse.json({
      success: true,
      subject: pitchResult.subject,
      pitch: pitchResult.pitch,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error('[Generate Pitch API Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate pitch' },
      { status: 500 }
    );
  }
}
