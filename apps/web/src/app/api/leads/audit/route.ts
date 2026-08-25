import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeadById, dbUpdateLead } from '@/lib/supabase';
import { auditWebsite } from '@/lib/audit';
import { generateColdPitch } from '@/lib/gemini';

// POST /api/leads/audit - Trigger full website audit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, url } = body;

    let targetUrl = url;
    let lead = null;

    if (leadId) {
      lead = await dbGetLeadById(leadId);
      if (!lead) {
        return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      }
      targetUrl = targetUrl || lead.website_url;
    }

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Website URL is required for audit' },
        { status: 400 }
      );
    }

    // Run audit
    const auditData = await auditWebsite(targetUrl);

    // If linked to a lead, generate pitch and update DB
    let updatedLead = lead;
    if (leadId && lead) {
      const pitchResult = await generateColdPitch(lead, auditData);
      
      const newEmail = lead.email || (auditData.extractedEmails.length > 0 ? auditData.extractedEmails[0] : null);

      updatedLead = await dbUpdateLead(leadId, {
        website_url: targetUrl,
        audit_data: auditData,
        email: newEmail,
        status: 'audited',
        ai_subject: pitchResult.subject,
        ai_pitch: pitchResult.pitch,
      });
    }

    return NextResponse.json({
      success: true,
      auditData,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error('[Audit API Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Audit failed' },
      { status: 500 }
    );
  }
}
