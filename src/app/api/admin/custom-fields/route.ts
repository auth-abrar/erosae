import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkAdminPermission } from '@/lib/rbac';

export async function GET() {
  try {
    await checkAdminPermission('CUSTOM_FIELDS', 'VIEW');
    const fields = await prisma.customFieldDefinition.findMany({
      include: {
        targetCategory: true,
        _count: { select: { values: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ fields });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await checkAdminPermission('CUSTOM_FIELDS', 'CREATE');
    const body = await req.json();
    const { name, key, fieldType, options, targetCategoryId, isRequired } = body;

    if (!name || !key || !fieldType) {
      return NextResponse.json({ error: 'Name, key, and fieldType are required' }, { status: 400 });
    }

    const field = await prisma.customFieldDefinition.create({
      data: {
        entityType: 'PRODUCT',
        name,
        key: key.toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
        fieldType,
        options: options ? JSON.stringify(options) : null,
        targetCategoryId: targetCategoryId || null,
        isRequired: !!isRequired,
      },
    });

    return NextResponse.json({ success: true, field });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await checkAdminPermission('CUSTOM_FIELDS', 'DELETE');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    await prisma.customFieldDefinition.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}