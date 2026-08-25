import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeads, dbCreateLead, dbDeleteLead, dbGetStats } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function corsResponse(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function OPTIONS() {
  return corsResponse({ ok: true });
}

// GET /api/leads - Retrieve all leads + dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const leads = await dbGetLeads();
    const stats = await dbGetStats();

    return corsResponse({
      success: true,
      leads,
      stats,
    });
  } catch (error: any) {
    return corsResponse(
      { success: false, error: error.message || 'Failed to fetch leads' },
      500
    );
  }
}

// POST /api/leads - Create a single manual lead
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.business_name) {
      return corsResponse(
        { success: false, error: 'Business name is required' },
        400
      );
    }

    const lead = await dbCreateLead(body);
    return corsResponse({ success: true, lead }, 201);
  } catch (error: any) {
    return corsResponse(
      { success: false, error: error.message || 'Failed to create lead' },
      500
    );
  }
}

// DELETE /api/leads?id=... - Delete a lead
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return corsResponse({ success: false, error: 'Lead ID is required' }, 400);
    }

    const deleted = await dbDeleteLead(id);
    return corsResponse({ success: true, deleted });
  } catch (error: any) {
    return corsResponse(
      { success: false, error: error.message || 'Failed to delete lead' },
      500
    );
  }
}
