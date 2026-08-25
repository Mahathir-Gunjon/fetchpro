import { NextRequest, NextResponse } from 'next/server';
import { dbResetMockData, dbGetStats } from '@/lib/supabase';

// POST /api/leads/demo-seed - Reset or reload demo sample leads
export async function POST(req: NextRequest) {
  try {
    const leads = await dbResetMockData();
    const stats = await dbGetStats();

    return NextResponse.json({
      success: true,
      message: 'Demo dataset reloaded successfully',
      leads,
      stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed demo data' },
      { status: 500 }
    );
  }
}
