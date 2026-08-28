import { NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/rbac';
import { exportProductsToCSV } from '@/lib/csv';

export async function GET() {
  try {
    await checkAdminPermission('CATALOG', 'EXPORT');
    const csvData = await exportProductsToCSV();

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="erosae_products_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}