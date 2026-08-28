import { NextRequest, NextResponse } from 'next/server';
import { checkAdminPermission } from '@/lib/rbac';
import { importProductsFromCSV } from '@/lib/csv';

export async function POST(req: NextRequest) {
  try {
    await checkAdminPermission('CATALOG', 'CREATE');
    const { csvContent } = await req.json();

    if (!csvContent) {
      return NextResponse.json({ error: 'No CSV content provided' }, { status: 400 });
    }

    const result = await importProductsFromCSV(csvContent);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes('Forbidden') ? 403 : 500 });
  }
}