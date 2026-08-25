import { NextRequest, NextResponse } from 'next/server';
import { dbGetLeads } from '@/lib/supabase';

// GET /api/leads/export - Export leads to CSV
export async function GET(req: NextRequest) {
  try {
    const leads = await dbGetLeads();

    const headers = [
      'Business Name',
      'Phone',
      'Rating',
      'Reviews Count',
      'Website URL',
      'Scraped Email',
      'Status',
      'Audit Health Score',
      'SSL Valid',
      'Mobile Friendly',
      'Copyright Year',
      'AI Pitch Preview',
      'Created At',
      'Google Maps URL',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const text = String(str).replace(/"/g, '""').replace(/\n/g, ' ');
      return `"${text}"`;
    };

    const rows = leads.map((l) => [
      escapeCsv(l.business_name),
      escapeCsv(l.phone || ''),
      l.rating || 0,
      l.reviews_count || 0,
      escapeCsv(l.website_url || ''),
      escapeCsv(l.email || ''),
      escapeCsv(l.status),
      l.audit_data?.healthScore !== undefined ? l.audit_data.healthScore : '',
      l.audit_data?.ssl?.valid ? 'Yes' : 'No',
      l.audit_data?.mobileResponsive?.isMobileFriendly ? 'Yes' : 'No',
      l.audit_data?.copyright?.detectedYear || '',
      escapeCsv(l.ai_pitch || ''),
      escapeCsv(l.created_at),
      escapeCsv(l.maps_url || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leadflow_leads_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
