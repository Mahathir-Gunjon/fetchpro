import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeads, dbCreateLead, dbDeleteLead, dbGetStats } from '@/lib/supabase';

// GET /api/leads - Retrieve all leads + dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const leads = await dbGetLeads();
    const stats = await dbGetStats();

    return NextResponse.json({
      success: true,
      leads,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

// POST /api/leads - Create a single manual lead
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.business_name) {
      return NextResponse.json(
        { success: false, error: 'Business name is required' },
        { status: 400 }
      );
    }

    const lead = await dbCreateLead(body);
    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads?id=... - Delete a lead
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const deleted = await dbDeleteLead(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
