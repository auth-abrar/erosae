import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkAdminPermission } from '@/lib/rbac';

export async function GET() {
  try {
    await checkAdminPermission('STAFF', 'VIEW');
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
        _count: { select: { adminUsers: true } },
      },
    });

    const allPermissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    return NextResponse.json({ roles, allPermissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await checkAdminPermission('STAFF', 'CREATE');
    const { name, description, permissionIds } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9-]+/g, '-');

    const role = await prisma.role.create({
      data: {
        name,
        slug,
        description,
        permissions: {
          create: (permissionIds || []).map((pId: string) => ({
            permissionId: pId,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}