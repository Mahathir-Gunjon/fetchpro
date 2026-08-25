import { NextRequest, NextResponse } from 'next/server';
import { dbResetMockData, dbGetStats } from '@/lib/supabase';

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

// POST /api/leads/demo-seed - Reset or reload demo sample leads
export async function POST(req: NextRequest) {
  try {
    const leads = await dbResetMockData();
    const stats = await dbGetStats();

    return corsResponse({
      success: true,
      message: 'Demo dataset reloaded successfully',
      leads,
      stats,
    });
  } catch (error: any) {
    return corsResponse(
      { success: false, error: error.message || 'Failed to seed demo data' },
      500
    );
  }
}
